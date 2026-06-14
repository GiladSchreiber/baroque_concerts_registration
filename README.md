# Baroque Concerts Registration

A bilingual (Hebrew/English) concert registration web app with QR code tickets and admin check-in.

## Stack

| Layer | Tech |
|-------|------|
| Framework | [Next.js 15](https://nextjs.org) (App Router) |
| Styling | Tailwind CSS v4 |
| Database | [Supabase](https://supabase.com) (Postgres + RLS) |
| Email | [Resend](https://resend.com) |
| QR generation | `qrcode` |
| QR scanning | `html5-qrcode` |
| Hosting | [Vercel](https://vercel.com) (free) |

---

## Setup

### 1. Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of [`supabase/schema.sql`](./supabase/schema.sql)
3. From **Project Settings → API**, copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Resend (optional — for email confirmations)

1. Create a free account at [resend.com](https://resend.com)
2. Create an API key → `RESEND_API_KEY`
3. Add and verify your sending domain, then update the `from` address in `app/api/register/route.ts`

### 3. Environment variables

Copy `.env.local` and fill in your values:

```bash
cp .env.local .env.local   # already exists, just fill it in
```

Required:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_PASSWORD=your-chosen-password
NEXT_PUBLIC_APP_URL=https://your-deployed-url.vercel.app
```

Optional (email):
```
RESEND_API_KEY=re_...
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

```bash
npx vercel
```

Set the same environment variables in your Vercel project dashboard under **Settings → Environment Variables**.

---

## Adding a Concert

Insert a row in the `concerts` table via Supabase Table Editor or SQL:

```sql
insert into public.concerts (
  title_en, title_he, date, location_en, location_he,
  description_en, description_he, capacity, price_nis, poster_url
) values (
  'My Concert', 'הקונצרט שלי',
  '2026-09-15 20:00:00+03',
  'Tel Aviv', 'תל אביב',
  'Description', 'תיאור',
  100, 120,
  'https://your-image-url.jpg'   -- optional
);
```

---

## Admin Panel

- Navigate to `/admin`
- Enter the `ADMIN_PASSWORD` from your env
- You land on `/admin/concerts` — your event dashboard

### What the admin can do

| Action | Where |
|---|---|
| **Create** a new event | Click **+ New Event** button |
| **Edit** an event (title, date, artists, poster, capacity, price…) | Click **Edit** on any event card |
| **Publish / Unpublish** an event | Click **Publish** or **Unpublish** on the card |
| **Delete** an event | Click **Delete** (with confirmation) |
| **View guest list** with search + filter | Click **Guest List** |
| **Scan QR codes** for check-in | Guest List page → **Scan QR Code** tab |
| **Analytics** per event (registrations, check-in rate, timeline, revenue) | Guest List page → **Analytics** tab |

### Image upload (Supabase Storage)

Before poster uploads work, create the storage bucket:

1. Go to **Supabase dashboard → Storage → New bucket**
2. Name: `concert-posters`  
3. Check **Public bucket** ✓
4. Click **Create bucket**

That's it — uploads go through the server using the service role key.

---

## Architecture

```
/                           Landing page — concert list
/concerts/[id]              Concert detail + register button
/concerts/[id]/register     Registration form
/confirmation/[id]          QR code + booking details
/admin                      Admin login
/admin/concerts             Concert selector
/admin/[concertId]          Guest list + QR scanner
```
