"use client";

import { useState } from "react";
import type { CSSProperties } from "react";

const MOODS = [
  "사이다가 필요해",
  "울고 싶어",
  "담담하게",
  "위로받고 싶어",
  "설레고 싶어",
  "힐링하고 싶어",
  "신나고 싶어",
];

const GENRES = [
  { key: "상관없음", label: "상관없어요" },
  { key: "발라드", label: "발라드" },
  { key: "인디", label: "인디" },
  { key: "팝(해외)", label: "팝송" },
  { key: "힙합/알앤비", label: "힙합·R&B" },
  { key: "댄스/K-pop", label: "댄스·K-pop" },
];

export default function Home() {
  const [story, setStory] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [genre, setGenre] = useState("상관없음");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const requestSongs = async () => {
    if (!story.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // 서버 하나만 부르면 끝. 키는 서버에 있어서 여기엔 없음.
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story, mood, genre }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "선곡 실패");
      setResult(data);
    } catch (e) {
      const message = e instanceof Error ? e.message : "알 수 없는 오류";
      setError(`선곡에 실패했어요. (${message}) 다시 신청해 주세요.`);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div style={styles.page}>
      <style>{css}</style>

      <header style={styles.header}>
        <div style={styles.station}>
          <span style={styles.freq}>FM 02:47</span>
          <span style={styles.stationName}>사연 선곡실</span>
        </div>
        <div className={loading ? "onair onair-live" : "onair"}>
          <span className="onair-dot" />
          ON AIR
        </div>
      </header>

      <main style={styles.main}>
        {!result && (
          <>
            <p style={styles.eyebrow}>새벽에만 열리는 신청곡 창구</p>
            <h1 style={styles.title}>
              말 못 한 사연,
              <br />
              노래로 돌려드립니다
            </h1>
            <p style={styles.sub}>
              이별이든, 지친 하루든, 설레는 마음이든 — 어떤 사연이든 좋아요.
            </p>

            <div style={styles.card}>
              <label style={styles.label} htmlFor="story">
                오늘의 사연
              </label>
              <textarea
                id="story"
                value={story}
                onChange={(e) => setStory(e.target.value)}
                placeholder="예) 오늘 하루 너무 지쳤어요. 아무 말 없이 안아주는 노래가 필요해요."
                rows={5}
                style={styles.textarea}
                disabled={loading}
              />

              <p style={styles.moodLabel}>지금 기분 (선택, 하나만)</p>
              <div style={styles.chips}>
                {MOODS.map((m) => {
                  const on = mood === m;
                  return (
                    <button
                      key={m}
                      onClick={() => setMood(on ? null : m)}
                      className="chip"
                      style={{ ...styles.chip, ...(on ? styles.chipOn : {}) }}
                      disabled={loading}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>

              <p style={styles.moodLabel}>선호 장르 (선택, 하나만)</p>
              <div style={styles.chips}>
                {GENRES.map((g) => {
                  const on = genre === g.key;
                  return (
                    <button
                      key={g.key}
                      onClick={() => setGenre(g.key)}
                      className="chip"
                      style={{ ...styles.chip, ...(on ? styles.chipOnAlt : {}) }}
                      disabled={loading}
                    >
                      {g.label}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={requestSongs}
                className="submit"
                style={{
                  ...styles.submit,
                  opacity: !story.trim() || loading ? 0.45 : 1,
                  cursor: !story.trim() || loading ? "default" : "pointer",
                }}
                disabled={!story.trim() || loading}
              >
                {loading ? "DJ가 선곡하고 음반을 확인하는 중…" : "이 사연으로 신청하기"}
              </button>

              {error && <p style={styles.error}>{error}</p>}
            </div>
          </>
        )}

        {result && (
          <div>
            <p style={styles.eyebrow}>방금 도착한 선곡표 · 전곡 실존 확인 완료</p>
            <h2 style={styles.resultTitle}>오늘의 {result.songs.length}곡</h2>

            <div style={styles.djCard}>
              <p style={styles.djFrom}>DJ의 답장</p>
              <p style={styles.djComment}>{result.dj_comment}</p>
            </div>

            <ol style={styles.trackList}>
              {result.songs.map((s, i) => (
                <li key={i} style={styles.track}>
                  <div style={styles.trackTop}>
                    {s.albumArt ? (
                      <img src={s.albumArt} alt="" style={styles.albumArt} />
                    ) : (
                      <span style={styles.trackNo}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={styles.trackTitle}>{s.title}</p>
                      <p style={styles.trackArtist}>{s.artist}</p>
                    </div>
                    <span style={styles.moodTag}>{s.mood}</span>
                  </div>
                  {s.one_liner && <p style={styles.oneLiner}>“{s.one_liner}”</p>}
                  <p style={styles.reason}>{s.reason}</p>
                  <div style={{ display: "flex", gap: 16 }}>
                    {s.listenUrl  && (
                      <a
                        href={s.listenUrl }
                        target="_blank"
                        rel="noreferrer"
                        style={styles.listen}
                      >
                        Spotify에서 듣기 →
                      </a>
                    )}
                    <a
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                        s.artist + " " + s.title
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      style={styles.listen}
                    >
                      유튜브 →
                    </a>
                  </div>
                </li>
              ))}
            </ol>

            <button onClick={reset} className="submit" style={styles.again}>
              다른 사연 보내기
            </button>
          </div>
        )}
      </main>

      <footer style={styles.footer}>
        모든 곡은 Spotify에서 실존 확인 후 표시돼요 · 인용구는 가사가 아닌 DJ의 감상 · 가사는 저장·표시하지 않습니다
      </footer>
    </div>
  );
}

/* ───────────────── styles ───────────────── */

const css = `
@import url('https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=IBM+Plex+Sans+KR:wght@300;400;500;600&display=swap');

.onair {
  display: flex; align-items: center; gap: 7px;
  font-size: 11px; letter-spacing: 0.22em; font-weight: 600;
  color: #565b70; border: 1px solid #2a2f45;
  padding: 6px 12px; border-radius: 999px;
  transition: color .4s, border-color .4s;
}
.onair-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: #3a3f58; transition: background .4s, box-shadow .4s;
}
.onair-live { color: #e8a25e; border-color: #7a5a34; }
.onair-live .onair-dot {
  background: #e8a25e;
  box-shadow: 0 0 10px 2px rgba(232,162,94,.55);
  animation: pulse 1.6s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .35; }
}
@media (prefers-reduced-motion: reduce) {
  .onair-live .onair-dot { animation: none; }
}
.chip:hover { border-color: #7a5a34; }
.submit:focus-visible, .chip:focus-visible, textarea:focus-visible {
  outline: 2px solid #e8a25e; outline-offset: 2px;
}
textarea::placeholder { color: #565b70; }
* { box-sizing: border-box; }
body { margin: 0; }
`;

const styles: { [key: string]: CSSProperties } = {
  page: {
    minHeight: "100vh",
    background: "#12141f",
    color: "#eae6dc",
    fontFamily: "'IBM Plex Sans KR', sans-serif",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 24px",
    borderBottom: "1px solid #1f2336",
  },
  station: { display: "flex", alignItems: "baseline", gap: 10 },
  freq: { fontSize: 11, letterSpacing: "0.18em", color: "#e8a25e", fontWeight: 600 },
  stationName: { fontSize: 14, fontWeight: 500, color: "#a7abbe" },
  main: {
    flex: 1,
    width: "100%",
    maxWidth: 560,
    margin: "0 auto",
    padding: "40px 20px 56px",
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: "0.16em",
    color: "#e8a25e",
    marginBottom: 14,
    fontWeight: 500,
  },
  title: {
    fontFamily: "'Gowun Batang', serif",
    fontSize: "clamp(28px, 6vw, 38px)",
    lineHeight: 1.35,
    fontWeight: 700,
    margin: "0 0 14px",
  },
  sub: { color: "#8b8fa3", fontSize: 15, lineHeight: 1.7, marginBottom: 32 },
  card: {
    background: "#1b1f30",
    border: "1px solid #262b42",
    borderRadius: 16,
    padding: 22,
  },
  label: {
    display: "block",
    fontSize: 12,
    letterSpacing: "0.12em",
    color: "#8b8fa3",
    marginBottom: 10,
    fontWeight: 600,
  },
  textarea: {
    width: "100%",
    background: "#12141f",
    border: "1px solid #2a2f45",
    borderRadius: 10,
    color: "#eae6dc",
    fontSize: 15,
    lineHeight: 1.7,
    padding: 14,
    resize: "vertical",
    fontFamily: "'IBM Plex Sans KR', sans-serif",
  },
  moodLabel: { fontSize: 13, color: "#8b8fa3", margin: "18px 0 10px" },
  chips: { display: "flex", flexWrap: "wrap", gap: 8 },
  chip: {
    background: "transparent",
    border: "1px solid #2a2f45",
    color: "#a7abbe",
    borderRadius: 999,
    padding: "7px 14px",
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "'IBM Plex Sans KR', sans-serif",
    transition: "border-color .2s, color .2s, background .2s",
  },
  chipOn: {
    background: "rgba(232,162,94,.12)",
    borderColor: "#e8a25e",
    color: "#e8a25e",
  },
  chipOnAlt: {
    background: "rgba(201,138,150,.12)",
    borderColor: "#c98a96",
    color: "#c98a96",
  },
  submit: {
    width: "100%",
    marginTop: 22,
    background: "#e8a25e",
    color: "#12141f",
    border: "none",
    borderRadius: 10,
    padding: "15px 0",
    fontSize: 15,
    fontWeight: 600,
    fontFamily: "'IBM Plex Sans KR', sans-serif",
  },
  error: { color: "#c98a96", fontSize: 13, marginTop: 14, lineHeight: 1.6 },
  resultTitle: {
    fontFamily: "'Gowun Batang', serif",
    fontSize: 30,
    fontWeight: 700,
    margin: "0 0 22px",
  },
  djCard: {
    background: "rgba(232,162,94,.07)",
    border: "1px solid rgba(232,162,94,.25)",
    borderRadius: 14,
    padding: 20,
    marginBottom: 28,
  },
  djFrom: {
    fontSize: 11,
    letterSpacing: "0.16em",
    color: "#e8a25e",
    fontWeight: 600,
    margin: "0 0 10px",
  },
  djComment: {
    fontFamily: "'Gowun Batang', serif",
    fontSize: 16,
    lineHeight: 1.85,
    margin: 0,
  },
  trackList: { listStyle: "none", margin: 0, padding: 0 },
  track: { borderTop: "1px solid #23283e", padding: "20px 2px" },
  trackTop: { display: "flex", alignItems: "center", gap: 14 },
  trackNo: {
    fontSize: 13,
    color: "#565b70",
    fontWeight: 600,
    letterSpacing: "0.05em",
  },
  albumArt: {
    width: 52,
    height: 52,
    borderRadius: 8,
    objectFit: "cover",
    flexShrink: 0,
  },
  trackTitle: {
    fontSize: 17,
    fontWeight: 600,
    margin: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  trackArtist: { fontSize: 13, color: "#8b8fa3", margin: "3px 0 0" },
  moodTag: {
    flexShrink: 0,
    fontSize: 12,
    color: "#c98a96",
    border: "1px solid rgba(201,138,150,.4)",
    borderRadius: 999,
    padding: "4px 10px",
  },
  oneLiner: {
    fontFamily: "'Gowun Batang', serif",
    fontSize: 15,
    color: "#d8d2c4",
    lineHeight: 1.7,
    margin: "14px 0 4px",
  },
  reason: { fontSize: 14, color: "#a7abbe", lineHeight: 1.7, margin: "8px 0 10px" },
  listen: { fontSize: 13, color: "#e8a25e", textDecoration: "none", fontWeight: 500 },
  again: {
    width: "100%",
    marginTop: 30,
    background: "transparent",
    color: "#e8a25e",
    border: "1px solid #7a5a34",
    borderRadius: 10,
    padding: "14px 0",
    fontSize: 15,
    fontWeight: 600,
    fontFamily: "'IBM Plex Sans KR', sans-serif",
  },
  footer: {
    textAlign: "center",
    fontSize: 12,
    color: "#565b70",
    padding: "18px 20px 26px",
    lineHeight: 1.6,
  },
};
