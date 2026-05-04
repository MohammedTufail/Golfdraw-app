⛳ GolfDraw — Digital Heroes PRD Assignment

GolfDraw is a full-stack web application that gamifies golf performance into a monthly prize draw while supporting charitable contributions.

✨ Features
🎯 Score-based monthly draw system
🎲 Random + weighted draw engine
💳 Subscription-based access (LemonSqueezy)
❤️ Charity contribution system
👤 User dashboard (scores, winnings, charity selection)
🛠️ Admin dashboard (users, draws, winners, charities)
📩 Email notifications
📱 Fully responsive UI (glassmorphism + luxury theme)

                                 ----------------------------------------

🧑‍💻 Tech Stack
Frontend: Next.js 14 (App Router) + Tailwind CSS
Backend / DB: Supabase
Authentication: Supabase Auth (JWT)
Payments: LemonSqueezy
Deployment: Vercel

📁 Project Structure
GOLFDRAW/

- app/
  - admin/
  - api/
  - charities/
  - dashboard/
  - how-it-works/
  - login/
  - signup/
  - layout.tsx
  - page.tsx
  - globals.css
  - favicon.ico

- components/
- lib/
- public/

- .env
- .gitignore
- README.md

- next.config.ts
- tailwind.config.js
- tsconfig.json
- package.json
- package-lock.json
- postcss.config.mjs
- eslint.config.mjs

- (auto-generated)
  - .next/
  - node_modules/
    📋 Feature Status
    ✅ Completed

Project scaffold (Next.js + Tailwind)
Supabase schema & database setup
Authentication (Login / Signup)
Landing page
User dashboard
Score entry system
Charity selection
Admin dashboard
Draw engine (random + weighted)
Winner verification
LemonSqueezy integration
Email notifications
Responsive UI
Deployment

🗄️ Database Schema
profiles — user data + charity preferences
subscriptions — plan & status
scores — rolling golf scores
charities — available charities
draws — monthly draw metadata
draw_entries — participants
draw_results — generated numbers
winners — prize winners
charity_contributions — donation tracking

🔑 Environment Variables
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

LEMONSQUEEZY_API_KEY=
LEMONSQUEEZY_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=

RESEND_API_KEY=

🚀 Getting Started
Clone the repo
git clone https://github.com/your-username/golfdraw.git
cd golfdraw
Install dependencies
npm install
Setup Supabase
Create project
Run schema.sql
Add keys to .env
Setup LemonSqueezy
Create product + subscription
Add webhook:
/api/lemonsqueezy/webhook
Run locally
npm run dev

🚀 Deployment
Push code to GitHub
Import into Vercel
Add environment variables
Deploy
Configure LemonSqueezy webhook
🎲 Draw Logic
Random + weighted selection
Monthly admin-triggered draw
Score-based entry system

💰 Prize Distribution
5 matches → 40% (jackpot)
4 matches → 35%
3 matches → 25%
Charity → minimum 10%

🎨 Design
Dark UI + glass morphism
Subtle gradients + shine
Gold accents for winnings

📌 Notes
LemonSqueezy is used instead of Stripe
Webhooks are required for subscription sync
Supabase RLS should be enabled

🏁 Submission
Digital Heroes — Full Stack Developer Assignment (April 2026)
