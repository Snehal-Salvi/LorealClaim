# LorealClaim: Useful Commands and Troubleshooting

## Useful commands

| Command | What it does |
|---|---|
| `npx prisma studio` (in `backend`) | Browse the saved claims and assessments in the browser |
| `docker compose down` | Stop the database (data is kept) |
| `docker compose down -v` | Stop the database and delete all data |

## Troubleshooting

| Problem | Fix |
|---|---|
| `ECONNREFUSED` / health shows database unreachable | Docker Desktop isn't running, or run `docker compose up -d` |
| Port 5432 already in use | Another Postgres is running on your machine; stop it or change the port in `docker-compose.yml` and `DATABASE_URL` |
| `502 AI service is unavailable` | The model is busy or the key is wrong; check the backend log, retry, or switch `OPENAI_MODEL` |
| Changes to `.env` not picked up | Restart `npm run start:dev` |
| `Cannot find module '../generated/prisma/client'` | Run `npx prisma generate` (also runs automatically before `start:dev`) |
