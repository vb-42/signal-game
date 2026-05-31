# Signal Game

A gamified demo for the Interhuman May Build Challenge. Act out all 12 social signals on camera, survive 3 attempts per signal, and claim your spot on the global leaderboard.

Built with Next.js 16, Tailwind CSS, Framer Motion, ElevenLabs TTS, Interhuman v1 stream analysis, and Neon Postgres.

## Game Flow

1. **Menu** — Start or view leaderboard
2. **Onboarding** — Learn the rules and all 12 signals
3. **Play** — Voice announces each signal; you act it out for 5 seconds
4. **Analysis** — Interhuman v1 reads your video segment
5. **Victory** — Enter your name for the global leaderboard

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

| Variable | Description |
|----------|-------------|
| `INTERHUMAN_API_KEY` | Interhuman API key (JWT bearer token) |
| `ELEVENLABS_API_KEY` | ElevenLabs API key for voice announcements |
| `DATABASE_URL` | Neon Postgres connection string for leaderboard |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy on Vercel

1. Push to GitHub and import in Vercel
2. Add the three environment variables above
3. Provision Neon Postgres from the Vercel Marketplace (or use neon.tech)
4. Deploy

## Demo Checklist

Before presenting live:

- [ ] Use **Chrome** (best MediaRecorder support)
- [ ] Allow **camera and microphone** when prompted
- [ ] Ensure real audio and video — silent or blank feeds reduce detection quality
- [ ] Test one signal end-to-end before the demo
- [ ] Confirm `INTERHUMAN_API_KEY` and `ELEVENLABS_API_KEY` are set in Vercel env
- [ ] Confirm `DATABASE_URL` is set if you want live leaderboard submissions
- [ ] Expect ~5s analysis latency per attempt (Interhuman processing time)

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/analyze` | POST | Proxies video segment to Interhuman v1 WebSocket |
| `/api/tts` | GET | ElevenLabs text-to-speech for signal announcements |
| `/api/leaderboard` | GET/POST | Global scoreboard (Neon Postgres) |

## Tech Notes

- Uses Interhuman **v1** stream endpoint: `wss://api.interhuman.ai/v1/stream/analyze`
- Video segments: 5 seconds, sent as binary WebSocket messages (min 10 KB, max 32 MB)
- Server-side proxy keeps the Interhuman API key off the client
- Leaderboard ranked by: completed signals (desc), total attempts (asc), completion time (asc)
