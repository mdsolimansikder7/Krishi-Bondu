# 🌾 কৃষিবন্ধু (Krishi-Bondu)

**কৃষকের জন্য বাংলা-প্রথম ডিজিটাল কৃষি সহকারী।** কৃষিবন্ধুতে আবহাওয়া ও কৃষি পরামর্শ, ফসলের বাজারদর, ফসলের নির্দেশিকা, রোগের প্রাথমিক বিশ্লেষণ, কৃষি ক্যালেন্ডার, খামারের হিসাব, কৃষিপণ্য মার্কেটপ্লেস এবং কৃষি প্রশ্নোত্তর এক জায়গায় ব্যবহারের সুবিধা দেওয়ার লক্ষ্য রাখা হয়েছে।

<p align="center">
  <a href="https://krishi-bondu.vercel.app/"><strong>🌐 Live Demo</strong></a> ·
  <a href="https://github.com/mdsolimansikder7/Krishi-Bondu"><strong>💻 GitHub Repository</strong></a>
</p>

> **তথ্য-সতর্কতা:** বাজারদর ও আবহাওয়ার তথ্যের উৎস এবং সর্বশেষ আপডেট যাচাই করে ব্যবহার করুন। নমুনা বা fallback ডেটাকে real-time verified data ধরে নেবেন না। AI-ভিত্তিক রোগ বিশ্লেষণ প্রাথমিক সহায়তা মাত্র, নিশ্চিত রোগনির্ণয় নয়। কীটনাশক বা অন্য রাসায়নিক ব্যবহারের আগে স্থানীয় কৃষি বিশেষজ্ঞের পরামর্শ নিন।

## ✨ Features

- 🌦️ **আবহাওয়া ও কৃষি পরামর্শ** — অবস্থান অনুযায়ী আবহাওয়ার তথ্য, ঘণ্টাভিত্তিক ও দৈনিক পূর্বাভাস এবং কৃষি-উপযোগী পরামর্শ।
- 📈 **বাজারদর** — বিভিন্ন ফসলের পাইকারি ও খুচরা দামের তথ্য এবং বাজার তুলনা।
- 🌱 **ফসলের নির্দেশিকা** — ফসলের পরিচর্যা ও চাষাবাদ-সংক্রান্ত তথ্য।
- 🩺 **রোগের প্রাথমিক বিশ্লেষণ** — লক্ষণের বিবরণ বা ছবি ব্যবহার করে সম্ভাব্য রোগ সম্পর্কে প্রাথমিক সহায়তা; Gemini API key ঐচ্ছিক।
- 🗓️ **কৃষি ক্যালেন্ডার ও ক্যালকুলেটর** — মৌসুমি পরিকল্পনা এবং কৃষি-সম্পর্কিত হিসাব।
- 🚜 **My Farm** — জমি/ক্ষেত, খরচ এবং চাষাবাদের কাজের রেকর্ড।
- 🛒 **কৃষিপণ্য মার্কেটপ্লেস** — কৃষিপণ্য তালিকাভুক্ত ও ব্রাউজ করার সুবিধা।
- 💬 **প্রশ্নোত্তর** — কৃষি বিষয়ে প্রশ্ন ও উত্তর।
- 🔐 **Authentication** — Better Auth দিয়ে ইমেইল/পাসওয়ার্ড sign-up ও sign-in; Google OAuth ঐচ্ছিক।
- 🛠️ **Admin tools** — ব্যবহারকারী, বাজারদর, কনটেন্ট, মার্কেটপ্লেস মডারেশন এবং audit records পরিচালনার সুবিধা।

## 🧰 Tech Stack

| Area | Technologies |
| --- | --- |
| Frontend | React 19, TypeScript, Vite 8 |
| Styling | Tailwind CSS 4 |
| Icons & motion | Lucide React, Motion |
| Backend | Node.js, Express |
| Authentication | Better Auth |
| Database | MongoDB |
| AI-assisted feature (optional) | Google Gemini API |
| Weather | Open-Meteo API |
| Deployment | Vercel |

## 📁 Project Structure

```text
Krishi-Bondu/
├── api/
│   └── [...path].ts        # Root Vercel API entrypoint
├── backend/
│   ├── api/
│   │   └── [...path].ts    # Backend Vercel catch-all handler
│   ├── server.ts           # Express routes and middleware
│   ├── auth.ts             # Better Auth and MongoDB setup
│   ├── local.ts            # Local backend entrypoint
│   ├── package.json
│   └── vercel.json         # Backend project configuration
├── frontend/
│   ├── src/                # React application and UI components
│   ├── public/             # Static assets
│   ├── vite.config.ts      # Vite plugins and import aliases
│   └── package.json
├── shared/                 # Shared types, data, and business rules
├── package.json            # Root scripts
└── vercel.json             # Root Vercel configuration
```

## ✅ Requirements

- Node.js **20.19 or newer**
- npm
- MongoDB database (MongoDB Atlas can be used for deployment)
- Optional: Google OAuth credentials for Google sign-in
- Optional: Google Gemini API key for AI-assisted disease guidance

## 🚀 Local Development

### 1. Clone the repository

```bash
git clone https://github.com/mdsolimansikder7/Krishi-Bondu.git
cd Krishi-Bondu
```

### 2. Install dependencies

Run from the repository root:

```bash
npm run install:all
```

This installs dependencies in `backend/` and `frontend/` using `npm ci`. If a package lockfile is missing or does not match its `package.json`, run `npm install` in the relevant package directory to update the lockfile.

### 3. Configure the backend environment

Create `backend/.env` and provide your own values:

```dotenv
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<database>?retryWrites=true&w=majority
BETTER_AUTH_SECRET=<random-secret-at-least-32-characters>
BETTER_AUTH_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# Optional Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Optional Gemini-powered features
GEMINI_API_KEY=
```

Generate a strong secret locally, for example:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Use a real MongoDB connection string. Do not commit `.env` files or share secrets in issues, chats, or source code.

### 4. Configure the frontend

Create `frontend/.env.local` (or `frontend/.env` for local development):

```dotenv
# Leave empty to use relative /api paths and the Vite dev proxy.
VITE_API_BASE_URL=
```

The Vite development server proxies `/api/*` requests to `http://localhost:3000`.

### 5. Start development servers

Open two terminals at the repository root.

**Terminal 1 — Backend**

```bash
npm run dev:backend
```

**Terminal 2 — Frontend**

```bash
npm run dev:frontend
```

Open the URL printed by Vite (typically `http://localhost:5173`). The backend API listens on `http://localhost:3000`.

## 🔑 Environment Variables

### Backend

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `BETTER_AUTH_SECRET` | Yes | Private Better Auth secret (at least 32 characters) |
| `BETTER_AUTH_URL` | Production | Canonical backend/API origin, without `/api` |
| `FRONTEND_URL` | Production | Comma-separated exact frontend origins trusted by the API/auth setup |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth client secret |
| `GEMINI_API_KEY` | Optional | Gemini-powered features |

### Frontend

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Optional | API origin. Leave empty to use same-origin `/api` paths; use the backend project's origin when deploying the frontend and backend as separate Vercel projects. |

Anything prefixed with `VITE_` is bundled into client-side JavaScript. **Never put secrets in frontend environment variables.**

## ☁️ Vercel Deployment

The repository currently includes a root-level `vercel.json` for a **single Vercel project** serving the frontend build and a root API function. The repository also contains `backend/vercel.json` for a separately configured backend deployment. These are different deployment approaches: choose one approach and configure the Vercel project's Root Directory and routing to match it; do not combine the settings blindly.

### Option A — Root monorepo project

Use the repository root as the Vercel project's Root Directory. The root configuration installs both packages, runs the root build script, publishes `frontend/dist`, and defines the root API function. Shared files must be included in the serverless function bundle.

Configure the following Production environment variables in **Vercel → Project → Settings → Environment Variables**:

- `MONGODB_URI`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL` — the production API origin
- `FRONTEND_URL` — the exact deployed frontend origin
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` — only if Google sign-in is enabled
- `GEMINI_API_KEY` — only if Gemini-powered features are enabled

Because this approach serves frontend and API from the same domain, frontend requests can use relative `/api/...` URLs and `VITE_API_BASE_URL` can remain unset/empty unless your code needs a different API origin.

### Option B — Two Vercel projects

If deploying frontend and backend as separate Vercel projects, connect both projects to this repository and configure the Root Directory for each project. Enable **Include source files outside of the Root Directory** so the `shared/` files are available during build.

**Backend project**

| Setting | Value |
| --- | --- |
| Root Directory | `backend` |
| Framework Preset | Other |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | Leave unset |
| Node.js version | 22.x |

Set `MONGODB_URI`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (backend origin), `FRONTEND_URL` (frontend origin), and any optional provider keys.

**Frontend project**

| Setting | Value |
| --- | --- |
| Root Directory | `frontend` |
| Framework Preset | Vite |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

Set `VITE_API_BASE_URL` to the backend origin, e.g. `https://<backend-project>.vercel.app` (do not add `/api`). Update the backend's `FRONTEND_URL` to include the exact frontend origin, then redeploy both projects after changing environment variables.

If using Google OAuth with the separate backend project, set its authorized redirect URI to:

```text
https://<backend-project>.vercel.app/api/auth/callback/google
```

### Production verification

After deployment, test the relevant API routes on the API's origin:

```text
/api/health
/api/auth/providers
/api/locations/all
/api/market-prices
```

Then test account registration, sign-in/sign-out, Google OAuth (if configured), market data, marketplace actions, and role-protected admin features. **A successful build does not by itself confirm API runtime or authentication is working.** If an endpoint returns 500, review the Vercel Runtime Logs for that deployment.

## 🧪 Quality Checks

Run from the repository root:

```bash
npm run lint
npm run build
npm test
```

## 🔐 Security Notes

- Never commit `.env` files, MongoDB credentials, OAuth secrets, or API keys.
- Use a unique, strong `BETTER_AUTH_SECRET` for production.
- Restrict database access to the environments that need it.
- Review demo or seeded accounts before making the app public.
- Treat AI disease analysis as preliminary guidance rather than a confirmed diagnosis.

## 🤝 Contributing

1. Fork the repository.
2. Create a feature branch.
3. Make focused changes and run the checks above.
4. Open a pull request with a clear summary and test results.

## 📄 License

No license information is documented in this README. Check for a `LICENSE` file or repository settings before copying, modifying, or redistributing the project.
