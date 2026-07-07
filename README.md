# MatchMaker AI v2

Upload screenshots of your dating profile → AI vision analysis → full audit + profile mockup.

## What's new vs v1
- Screenshot upload (drag & drop, up to 4 images)
- Vision AI reads your actual profile — not what you describe
- Profile mockup generator showing exactly what the improved profile should look like
- App selector (Tinder, Bumble, Hinge, etc.)
- Better score color coding (green/yellow/red)

## Stack
- Frontend: React + Vite + Tailwind → Vercel
- Backend: Node + Express → Railway
- AI: Groq vision (`meta-llama/llama-4-scout-17b-16e-instruct`)
- DB: MongoDB Atlas
- Payments: Razorpay

## Local setup

### Backend
```bash
cd backend
cp .env.example .env   # fill in all values
npm install
npm run dev            # runs on :4000
```

### Frontend
```bash
cd frontend
npm install
npm run dev            # runs on :5173
```

## Deploy

### Backend → Railway
- Root directory: `backend`
- Variables: MONGODB_URI, GROQ_API_KEY, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, CLIENT_URL, PORT=4000

### Frontend → Vercel
- Root directory: `frontend`
- Environment variable: VITE_API_URL = your Railway URL

## Key differences from v1
- Uses `multer` for file uploads (multipart/form-data instead of JSON)
- Groq vision model instead of text-only llama
- No Stripe — Razorpay only
- Profile mockup is a React component, not an image (no image generation API needed)
