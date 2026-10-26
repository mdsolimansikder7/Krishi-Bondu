# কৃষিবন্ধু — Run and deploy

Krishi-Bondu is split into a Vite/React frontend (`frontend/`), an Express/Better Auth API (`backend/`), and TypeScript modules shared from `shared/`. The frontend and API deploy independently as two Vercel projects connected to this repository. Both projects must enable **Include source files outside of the Root Directory** so they can compile the shared modules.

## Local development

Prerequisites: Node.js 20.19+ and MongoDB.

1. Run `npm ci` in `backend/` and `frontend/` (or run `npm run install:all` from the repository root).
2. Copy `backend/.env.example` to `backend/.env` and set MongoDB, Better Auth, and any optional provider keys. Copy `frontend/.env.example` to `frontend/.env.local`; leave `VITE_API_BASE_URL` empty to use the Vite `/api` proxy.
3. Start the API with `npm run dev` in `backend/`.
4. Start Vite with `npm run dev` in `frontend/`.

The API listens on `http://localhost:3000`; Vite proxies `/api/*` there. You can also use `npm run dev:backend` and `npm run dev:frontend` from the repository root in separate terminals. Keep both `.env` files private.

## Vercel project: frontend

Create a Vercel project from the same GitHub repository with:

| Setting | Value |
| --- | --- |
| Root Directory | `frontend` |
| Include source files outside of the Root Directory | Enabled |
| Framework Preset | Vite |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

Set `VITE_API_BASE_URL` to the backend project's origin, for example `https://<backend-project>.vercel.app` (origin only; no `/api` suffix). This is a public build-time URL, not a secret. Use the production frontend URL when configuring backend CORS and Better Auth. Add preview origins only if those deployments should be allowed to sign in.

## Vercel project: backend

Create a second Vercel project from the same repository with:

| Setting | Value |
| --- | --- |
| Root Directory | `backend` |
| Include source files outside of the Root Directory | Enabled |
| Framework Preset | Other |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | Leave unset |
| Node.js Version | 22.x |

The project exposes one catch-all Node.js Function at `backend/api/[...path].ts`. It forwards every existing `/api/*` route to the existing Express app without starting a persistent process. `backend/vercel.json` sets its function duration. MongoDB-backed application state and Better Auth data remain persistent; no production records are stored in function memory.

Configure these variables in the backend Vercel project (Production and any intentionally supported Preview environment):

| Variable | Value |
| --- | --- |
| `MONGODB_URI` | MongoDB Atlas connection string, using the intended `krishibondhu` database |
| `BETTER_AUTH_SECRET` | Private random secret of at least 32 characters |
| `BETTER_AUTH_URL` | Backend origin, e.g. `https://<backend-project>.vercel.app` |
| `FRONTEND_URL` | Comma-separated exact frontend origins, e.g. `https://<frontend-project>.vercel.app,https://www.example.com` |
| `GOOGLE_CLIENT_ID` | Optional Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Optional Google OAuth client secret |
| `GEMINI_API_KEY` | Optional key for Gemini-powered features |

Set Google OAuth's authorized redirect URI to `https://<backend-project>.vercel.app/api/auth/callback/google`. Add the frontend origin as an authorized JavaScript origin if required by the Google OAuth client. The API enables credentialed CORS only for the exact origins in `FRONTEND_URL`; production auth cookies use `SameSite=None; Secure` so browser requests to a separate API origin can include them. For browsers that restrict third-party cookies, use frontend and API custom domains under the same registrable domain.

In MongoDB Atlas, allow network access from Vercel using the access strategy supported by your Atlas plan. Do not put secrets in frontend variables or commit `.env` files. The examples at `frontend/.env.example` and `backend/.env.example` contain placeholders only.

## Deploy and verify

Deploy the backend project first, then set its origin as `VITE_API_BASE_URL` in the frontend project and the frontend origin in backend `FRONTEND_URL`; redeploy both after changing variables. Verify `https://<backend-project>.vercel.app/api/health` returns a successful response, then check `/api/auth/providers`, `/api/locations/all`, and `/api/market-prices`. Test signup/sign-in, logout, Google OAuth (if configured), and authorized admin operations on the live deployment. Deployment is not verified until those production checks pass.

Before either deployment, run `npm run lint`, `npm run build`, and `npm test` from the repository root. The root scripts delegate to the frontend and backend projects.
