# محمس كويز — M7mas Quiz
1. `npm install`
2. Supabase project → SQL Editor → run `supabase/schema.sql` (also enables Realtime on rooms/players).
3. `cp .env.example .env.local`, fill the keys (Supabase URL/anon/service-role, ANTHROPIC_API_KEY).
4. `npm run dev` → http://localhost:3000. Use Chrome/Edge for Arabic speech recognition (HTTPS or localhost); other browsers get the text fallback.
Without keys the UI loads but create/join/question generation show an error state.
## Architecture
All writes go through `/api/game` (service role); clients only read via Realtime. Buzzing is one atomic SQL UPDATE (`buzz()` RPC). The 15s cooldown is per player (`players.cooldown_until`). Answers are judged server-side by the AI; correct answers live in `secrets` (no client access). Refetch on Realtime resubscribe handles reconnects.
## Not built yet
Profiles, statistics, leaderboards (need auth), full results page, page transitions, host-leave handling, rate limiting. Player ids are unauthenticated tokens kept in localStorage.
