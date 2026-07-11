// app/api/recommend/route.js
// ★ 하이브리드 검증: Spotify 우선 → 안 되면 iTunes 자동 전환
//   - Spotify 권한이 아직 안 풀렸어도 iTunes로 즉시 작동
//   - Spotify가 살아나면 자동으로 Spotify 사용 (코드 수정 불필요)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function extractJSON(rawText) {
  const trimmed = rawText.trim();
  try {
    return JSON.parse(trimmed);
  } catch (_) {}
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch (_) {}
  }
  throw new Error("응답 형식 오류");
}

async function askClaude(prompt) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1800,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message || "Claude API 오류");
  const text = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  if (!text) throw new Error("빈 응답");
  return extractJSON(text);
}

/* ── Spotify ── */
async function getSpotifyToken() {
  const id = (process.env.SPOTIFY_CLIENT_ID || "").trim();
  const secret = (process.env.SPOTIFY_CLIENT_SECRET || "").trim();
  if (!id || !secret) return null; // 키 없으면 조용히 iTunes로

  const creds = Buffer.from(`${id}:${secret}`).toString("base64");
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + creds,
    },
    body: "grant_type=client_credentials",
  });
  if (!response.ok) return null;
  const data = await response.json();
  return data.access_token || null;
}

async function verifyOnSpotify(token, title, artist) {
  const q = encodeURIComponent(`${title} ${artist}`);
  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${q}&type=track&limit=3&market=KR`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  // 403 = 권한 문제 → 이후 전부 iTunes로 전환하라는 신호
  if (response.status === 403) return { blocked: true };
  if (!response.ok) return null;

  const data = await response.json();
  const items = data?.tracks?.items || [];
  if (items.length === 0) return null;

  const norm = (s) => (s || "").toLowerCase().replace(/\s/g, "");
  const best =
    items.find((t) =>
      t.artists.some(
        (a) =>
          norm(a.name).includes(norm(artist)) ||
          norm(artist).includes(norm(a.name))
      )
    ) || items[0];

  return {
    title: best.name,
    artist: best.artists.map((a) => a.name).join(", "),
    albumArt: best.album?.images?.[1]?.url || best.album?.images?.[0]?.url || null,
    listenUrl: best.external_urls?.spotify || null,
    listenLabel: "Spotify에서 듣기",
  };
}

/* ── iTunes (무료, 키 불필요) ── */
async function verifyOnItunes(title, artist) {
  const term = encodeURIComponent(`${title} ${artist}`);
  const url = `https://itunes.apple.com/search?term=${term}&media=music&entity=song&country=KR&limit=5`;
  const response = await fetch(url);
  if (!response.ok) return null;

  const data = await response.json();
  const items = data?.results || [];
  if (items.length === 0) return null;

  const norm = (s) => (s || "").toLowerCase().replace(/\s/g, "");
  const best =
    items.find(
      (t) =>
        norm(t.artistName).includes(norm(artist)) ||
        norm(artist).includes(norm(t.artistName))
    ) || items[0];

  return {
    title: best.trackName,
    artist: best.artistName,
    albumArt: best.artworkUrl100
      ? best.artworkUrl100.replace("100x100", "300x300")
      : null,
    listenUrl: best.trackViewUrl || null,
    listenLabel: "Apple Music에서 듣기",
  };
}

export async function POST(request) {
  try {
    const { story, mood, genre } = await request.json();

    if (!story || !story.trim()) {
      return Response.json({ error: "사연을 입력해 주세요." }, { status: 400 });
    }

    const moodLine = mood ? `\n원하는 분위기: ${mood}` : "";
    const genreLine =
      genre && genre !== "상관없음"
        ? `\n선호 장르: ${genre}`
        : "\n장르 제한 없음 (국내가요/인디/팝 자유롭게)";

    const prompt = `당신은 심야 라디오 DJ입니다. 아래 사연에 맞는 노래를 선곡하세요.

<사연>
${story.trim()}${moodLine}${genreLine}
</사연>

규칙:
- 정확히 10곡 추천, 서로 다른 아티스트로
- 당신이 확실히 알고 있는 유명한 실제 곡만 (마이너한 곡보다 확실한 곡 우선)
- 사연 주제는 무엇이든 가능 (이별, 일상 피로, 짝사랑, 취업, 우정, 계절 등)
- dj_comment: DJ의 따뜻한 답장 2~3문장
- reason: 이 사연에 이 곡인 이유 1~2문장 (가사 인용 절대 금지)
- one_liner: 가사가 아니라 DJ가 직접 쓴 한 줄 감상 (20자 내외, 가사 인용 절대 금지)
- mood: 곡의 정서 2~4글자

다른 텍스트 없이 이 JSON만 출력:
{"dj_comment":"...","songs":[{"title":"...","artist":"...","reason":"...","one_liner":"...","mood":"..."}]}`;

    console.log("\n========== 새 요청 ==========");
    console.log("사연:", story.slice(0, 50));

    let parsed = null;
    let lastError = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        if (attempt > 1) await sleep(1500 * (attempt - 1));
        parsed = await askClaude(prompt);
        break;
      } catch (e) {
        console.log(`Claude 시도 ${attempt} 실패:`, e.message);
        lastError = e;
      }
    }
    if (!parsed) throw lastError || new Error("추천 실패");
    if (!parsed.songs || parsed.songs.length === 0)
      throw new Error("곡 목록 없음");

    console.log(
      "Claude 후보곡:",
      parsed.songs.map((s) => `${s.title}-${s.artist}`).join(", ")
    );

    // Spotify 시도 → 토큰 실패나 403이면 iTunes로 전환
    let spotifyToken = await getSpotifyToken();
    let useSpotify = !!spotifyToken;
    console.log(
      useSpotify
        ? "──[검증: Spotify 우선 모드]──"
        : "──[검증: iTunes 모드 (Spotify 키 없음/토큰 실패)]──"
    );

    const verified = [];
    for (const s of parsed.songs) {
      if (verified.length >= 5) break;
      try {
        let found = null;

        if (useSpotify) {
          const r = await verifyOnSpotify(spotifyToken, s.title, s.artist);
          if (r && r.blocked) {
            console.log("  ⚠️ Spotify 403 → iTunes로 자동 전환");
            useSpotify = false;
          } else {
            found = r;
          }
        }

        if (!useSpotify && !found) {
          found = await verifyOnItunes(s.title, s.artist);
          await sleep(250);
        }

        console.log(
          `  "${s.title} - ${s.artist}" → ${found ? "✅ 통과" : "❌ 탈락"}`
        );

        if (found) {
          verified.push({
            reason: s.reason,
            one_liner: s.one_liner,
            mood: s.mood,
            title: found.title,
            artist: found.artist,
            albumArt: found.albumArt,
            listenUrl: found.listenUrl,
            listenLabel: found.listenLabel,
          });
        }
      } catch (e) {
        console.log(`  "${s.title}" 검증 중 예외:`, e.message);
      }
    }

    console.log(`✅ 최종 검증 통과: ${verified.length}곡`);

    if (verified.length === 0)
      throw new Error("검증을 통과한 곡이 없어요 — 터미널 로그를 확인하세요");

    return Response.json({
      dj_comment: parsed.dj_comment,
      songs: verified,
    });
  } catch (e) {
    console.error("❌ 추천 실패:", e.message);
    return Response.json(
      { error: e.message || "선곡에 실패했어요." },
      { status: 500 }
    );
  }
}