# 🎧 사연 선곡실 | AI 감정 기반 음악 추천 서비스

> **Claude API와 음원 데이터를 결합하여 상황과 감정에 맞는 실제 존재하는 음악을 추천하는 AI 기반 웹서비스**

🔗 **Demo**  
https://sayeon-radio.vercel.app/

---

# 📌 Project Overview

사연 선곡실은 사용자가 자신의 상황과 감정을 자유롭게 작성하면 AI가 감정을 이해하고 현재 상황에 어울리는 음악을 추천하는 서비스입니다.

기존 AI 추천은 존재하지 않는 곡을 추천하거나(환각), 실제 음원과 일치하지 않는 정보를 제공하는 문제가 있었습니다.

이를 해결하기 위해 Claude API의 추천 결과를 Spotify와 iTunes API로 다시 검증하여 **실제 존재하는 곡만 추천하는 구조**를 설계했습니다.

---

# 🎯 Problem

- 현재 상황과 감정에 맞는 음악 탐색의 어려움
- LLM 기반 추천 서비스의 Hallucination 문제
- 실제 존재하지 않는 곡 추천 가능성
- 외부 API 정책 변화에 따른 서비스 불안정성

---

# 💡 Solution

Claude API를 이용해 추천 후보를 생성하고,

Spotify API와 iTunes API를 이용하여

추천 결과를 다시 검증하는 구조를 구현했습니다.

이를 통해

- 감정 기반 음악 추천
- 실제 존재하는 음원 검증
- 앨범 이미지 제공
- 재생 링크 제공
- DJ 코멘트 생성

을 하나의 서비스로 구현했습니다.

---

# ✨ Key Features

## 🤖 AI Recommendation

- 자유 서술형 사연 입력
- 감정 및 장르 선택
- Claude API 기반 감정 분석
- 상황 맞춤 음악 추천

---

## ✅ Recommendation Validation

- Spotify API 실존 검증
- iTunes API 자동 대체(Fallback)
- Hallucination 자동 제거
- 최대 5곡 추천

---

## 🎵 User Experience

- 앨범 커버 제공
- 공식 아티스트 정보
- Spotify / Apple Music 재생 링크
- AI DJ 코멘트 제공

---

# ⚙️ Recommendation Workflow

```text
사용자 입력

        ↓

Claude API 추천 후보 생성

        ↓

Spotify API 검증

        ↓

실패 시

        ↓

iTunes API 검증

        ↓

검증 완료

        ↓

최종 추천 5곡 제공
```

---

# 🛠 Tech Stack

## Frontend

- Next.js
- React
- TypeScript

## AI

- Claude API

## Music APIs

- Spotify Web API
- iTunes Search API

## Deployment

- Vercel

---

# 📂 Project Structure

```text
app

├── page.tsx
│   사용자 인터페이스
│
├── api/
│   └── recommend/
│        route.js
│
├── components/
│
└── public/
```

---

# 📷 Preview

> 메인 화면

(서비스 메인 이미지)

> 추천 결과

(추천 결과 이미지)

---

# 🚀 Getting Started

## Install

```bash
npm install
```

---

## Environment

`.env.local`

```env
ANTHROPIC_API_KEY=

SPOTIFY_CLIENT_ID=

SPOTIFY_CLIENT_SECRET=
```

Spotify API가 없더라도

자동으로 iTunes API를 사용합니다.

---

## Run

```bash
npm run dev
```

localhost:3000

---

# 📊 Architecture

```text
Browser

        ↓

Next.js API

        ↓

Claude API

        ↓

Spotify Validation

        ↓

iTunes Fallback

        ↓

Verified Songs

        ↓

Browser
```

---

# 📈 Technical Highlights

### AI Hallucination 대응

Claude가 추천한 후보곡을 그대로 사용하지 않고,

외부 음원 API를 이용해 실존 여부를 검증하는 구조를 설계했습니다.

---

### API Failover

Spotify 검색 실패(403 등)를 감지하면

자동으로 iTunes API로 전환하여

서비스 중단 없이 추천이 가능하도록 구현했습니다.

---

### Copyright-safe Design

가사 원문은 저장하거나 출력하지 않고,

AI가 생성한 DJ 코멘트와

공식 음원 메타데이터만 제공합니다.

---

# 📈 Outcome

본 프로젝트를 통해

- LLM 기반 추천 서비스 구현
- Hallucination 검증 구조 설계
- 다중 API 연동 경험
- API Failover 구조 구현
- AI 기반 사용자 경험 설계

를 수행했습니다.

---

# 💭 Why I Built This

단순한 음악 추천 서비스가 아니라,

**사용자의 감정을 이해하고, AI 추천 결과를 신뢰할 수 있는 서비스로 만들기 위한 방법을 고민한 프로젝트**입니다.

추천 정확도보다 **추천 결과의 신뢰성**에 집중하여,

LLM의 추천 → 외부 데이터 검증 → 사용자 제공

이라는 구조를 직접 설계하고 구현했습니다.

