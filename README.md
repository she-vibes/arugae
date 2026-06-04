# Arugae — அருகே

> *Beside you, always.*

Arugae is a community platform for family caregivers — connecting people caring for sick, elderly, or disabled loved ones with peer support, condition-specific communities, and an AI companion (AruBot).

---

## What it does

- **Circles** — Condition-specific communities (Cancer, Dementia, Stroke, Disability, Elderly Care)
- **Anonymous posting** — Share without revealing identity
- **Thread replies** — Conversations within each post
- **Reactions** — ❤️ 🫂 💪 🙏 with live counts
- **AruBot** — Claude-powered AI companion, available 24/7
- **Plans** — Freemium model (Free / Pro ₹149 / Expert ₹499 / NGO ₹2,999)

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite (PWA) |
| Backend | Supabase (Postgres + Auth + Realtime) |
| AI | Anthropic Claude API |
| Payments | Razorpay (coming Day 3) |
| Hosting | Vercel |

---

## Local development

```bash
# Clone
git clone https://github.com/vidyapriyaraj/arugae
cd arugae
npm install

# Environment
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# Run
npm run dev
