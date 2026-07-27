# TravelHub Dev Server Run Doc

## How to reproduce artifacts

1. Copy `.env` from main checkout if missing: `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/travelhub"`
2. Install dependencies: `npm install`
3. Ensure PostgreSQL is running on localhost:5432 with the `travelhub` database
4. If the database is empty, run seed: `npx prisma db seed`

## How to run the server

```bash
cd D:\travelhub
npx next dev -H 0.0.0.0 -p 3001
```

## Notes

- Default port is 3000, but if it's occupied use 3001 or higher
- Remove `.next/dev/lock` if a stale server prevents starting
- The server requires `dotenv/config` to be imported in `src/lib/prisma.ts` for `DATABASE_URL` to load at runtime
- Log file: `.freebuff/preview-thmrz7l5qhyzb5.log`
