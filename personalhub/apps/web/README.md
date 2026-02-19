# PersonalHub Web (Next.js)

## Run locally

```bash
npm install
npm run dev -w web
```

## Environment

Copy env template:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Required variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Supabase migration

Initial schema migration is stored in:

- `supabase/migrations/20260217000000_initial_family_schema.sql`

If Supabase CLI is installed, apply migrations with:

```bash
supabase db push
```
