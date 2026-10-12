# AcraPath Server

> **Lead Developer**: **Prashant Kumar** | **Stack**: Node.js, Express 5, TypeScript, MongoDB Atlas

---

## 📌 Overview & Architecture

**AcraPath Server** is the REST API backend powering the AcraPath recruitment platform. It manages user authentication, role separation, structured job posting, fire-and-forget dictionary synchronization, and an intelligent fallback search engine.

```
[ Client / Mobile ] ──( HTTP / JWT )──> [ Express 5 Router ]
                                               │
               ┌───────────────────────────────┴───────────────────────────────┐
               ▼                                                               ▼
     [ Controllers & Middleware ]                                  [ Dictionary Service ]
     (Auth, Jobs, Smart Search)                                    (Async Fire-and-Forget)
               │                                                               │
               └───────────────────────► [ MongoDB Atlas ] ◄───────────────────┘
```

---

## ⚙️ How It Works

1. **Authentication & Security**:
   - Implements salted password hashing (`bcrypt`) and stateless JWT authorization tokens (`/api/auth/register`, `/api/auth/login`).
   - Protected routes use `requireAuth` middleware to validate tokens and attach `req.user`.

2. **Job Post Lifecycle & Self-Learning Dictionaries**:
   - Recruiters create listings via `POST /api/jobs` tied to their `posted_by` ID.
   - On creation, a non-blocking background worker (`dictionary_service.ts`) extracts unique skills, locations, and designations, upserting them into dedicated collections without delaying client response time.

3. **Smart Search & Fallback Logic (`GET /api/jobs`)**:
   - Handles multi-param queries (`skills`, `location`, `job_type`, `experience`, `salary`).
   - **Strict AND Search**: Matches all combined parameters.
   - **Smart Fallback**: If 0 results are returned, dynamically executes an **OR** query so candidates still receive relevant suggestions.

4. **Fuzzy Autocomplete Dictionaries**:
   - Endpoints `/api/locations/suggest` & `/api/keywords/suggest` run fuzzy regex queries.
   - Queries `SkillModel` and `DesignationModel` concurrently via `Promise.all` for sub-millisecond responses.

5. **Data Seeding (`seed_jobs.ts`)**:
   - Ingests `25_tech_jobs.json`, populates dictionaries, and bulk-inserts jobs while skipping duplicates.

---

## 🚀 Setup & Execution

### Environment Variables (`.env`)
```env
PORT=3005
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/acrapath
JWT_SECRET=your_jwt_secret_key
```

### Run Commands
```bash
npm install                     # Install server dependencies
npm run dev                     # Start development server with tsx watch
npm start                       # Start production server (tsx main.ts)
npx tsx seed_jobs.ts            # Seed initial tech jobs & dictionaries
pm2 start ecosystem.config.cjs    # Run under PM2 process manager
```

---

## 🤖 Multi-Agent Run Workflow

AcraPath Server supports autonomous multi-agent development. Agents operate within defined boundaries:

| Agent Domain | File Scope | Focus & Constraints |
| :--- | :--- | :--- |
| **API / Route Agent** | `src/routes/`, `src/controllers/` | Request validation, status codes, route orchestration. |
| **Data / Model Agent** | `src/models/`, `db/` | Mongoose schemas, indexes, relations, strict typings. |
| **Service Agent** | `src/services/` | Async dictionary workers, background sync, search algorithms. |

### Quality Gate for Agents
Run before merging changes:
```bash
npx tsc --noEmit                # Validate TypeScript types across project
```

---

## 📡 Core Endpoints

- **Auth**: `POST /api/auth/register`, `POST /api/auth/login`
- **Jobs**: `POST /api/jobs` (Auth required), `GET /api/jobs` (Paginated search), `GET /api/jobs/:id`
- **Search**: `GET /api/locations/suggest?q=...`, `GET /api/keywords/suggest?q=...`

---

## 👨‍💻 Author

- **Developer**: **Prashant Kumar**
- **Project**: AcraPath Server
