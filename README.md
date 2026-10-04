# TalentMatch AI

TalentMatch AI is a full-stack hiring platform with a React + Vite frontend, a Node.js + Express backend, and MongoDB persistence through Mongoose.

## Local Setup
Prerequisite: install Node.js 20+ so `node` and `npm` are available on PATH.

Install dependencies once, then run both apps together:

```bash
npm install
npm run dev
```

To build the frontend, use:

```bash
npm run build
```

Then open:
- Frontend: `http://localhost:5173`
- API: `http://localhost:5000`

The API reads `MONGODB_URI` from `.env`. For local development use a local MongoDB instance or a MongoDB Atlas free tier cluster.

## Docker Compose

Docker Desktop is required. Start the complete application, including MongoDB, with:

```bash
docker compose up --build
```

Open the frontend at `http://localhost:5173`. The API is available at `http://localhost:5000`, and its health check is `http://localhost:5000/health`.

Stop the containers with:

```bash
docker compose down
```

The MongoDB data is stored in the `mongodb-data` Docker volume. To remove the containers and demo database completely, run `docker compose down -v`.

## MongoDB Setup
Use one of these options:
- Local MongoDB: install MongoDB Community Server, start the service, and keep `MONGODB_URI=mongodb://127.0.0.1:27017/talentmatch`.
- MongoDB Atlas free tier: create an M0 cluster, create a database user, allow your IP address, and copy the connection string into `apps/api/.env`.
- If your MongoDB password contains special characters such as `@`, `:`, or `/`, URL-encode the password before placing it in the connection string.

The API expects `MONGODB_URI` and `CLIENT_URL` in `apps/api/.env`. A working local example is already in [apps/api/.env.example](apps/api/.env.example). Authentication uses a simple server-side session stored in an HTTP-only cookie; no JWT configuration is required.

## Recommended Azure Plan
For the deployment you described, a VM-based setup is the simplest fit:
- Host the backend on an Azure Linux VM with Node.js and a process manager such as PM2.
- Host the built frontend on the same VM with Nginx, or on a second VM if you want cleaner separation.
- Use MongoDB Atlas free tier for the database instead of Cosmos DB.
- Put Nginx in front as the reverse proxy and terminate TLS there.

## Main Pieces
- `apps/api`: Node.js + Express API with MongoDB/Mongoose and Prometheus metrics.
- `apps/web`: React + Vite frontend.
- Azure infrastructure and CI/CD deployment are managed separately from this application repository.

## Notes
The running deployment history and next steps are documented in [DEPLOYMENT-NOTES.md](DEPLOYMENT-NOTES.md).
