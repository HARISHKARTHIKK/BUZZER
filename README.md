# Buzzer App

A real-time buzzer application for quiz competitions and games, built with HTML, CSS, JavaScript, and Supabase.

## Features
- Real-time buzzer order tracking.
- Admin panel for starting and resetting rounds.
- Team selection and identity persistence.
- Audio feedback on buzz.

## Setup
1. Create a Supabase project.
2. Set up the following tables:
   - `game_state`: `id` (int8), `status` (text), `winner_name` (text), `winner_timestamp` (timestamptz).
   - `buzzers`: `id` (int8), `team_name` (text), `created_at` (timestamptz).
3. Enable Realtime for these tables in Supabase Replication settings.
4. Update `supabase.js` with your credentials.
5. Run locally:
   ```bash
   npm install
   npm run dev
   ```
