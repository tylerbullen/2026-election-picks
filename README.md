# 2026 Election Picks

A pick'em board for the 20 most expensive Senate, governor, and ballot-measure contests of the 2026 midterms. Players enter a name, call all 20 races, and submit. Everyone else's picks unlock only after you submit your own. After the election, the admin enters results and the board scores everyone.

## How it works

- `index.html` is the whole front end: race cards with spending totals and state maps, a Senate-control summary, and the group table.
- `api/picks.js` saves each player's picks to Redis and returns the group's picks only to players who have submitted.
- `api/results.js` saves race results. It requires the `ADMIN_KEY`.

## Deploy on Vercel

1. Import this repo as a new Vercel project. No build settings are needed.
2. Under Storage, create an Upstash for Redis database (free tier) and connect it to the project.
3. Add environment variables (see `.env.example`):
   - `ADMIN_KEY`: any long random string
   - `PICKS_LOCK_AT` (optional): time picks lock, such as `2026-11-03T23:00:00Z`
4. Redeploy and share the site URL.

## Entering results

Open `https://<your-site>/?admin=<ADMIN_KEY>`, submit your own picks, and use the Results row on the Group picks tab. Keep that link private.

## Notes

- No accounts. Each player is tied to the browser they used, so switching devices means a new entry.
- Spending figures are mid-to-late October 2026 snapshots from AdImpact, OpenSecrets and state filings. Each card names its source.
