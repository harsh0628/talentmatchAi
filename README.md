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

## MongoDB Setup
Use one of these options:
- Local MongoDB: install MongoDB Community Server, start the service, and keep `MONGODB_URI=mongodb://127.0.0.1:27017/talentmatch`.
- MongoDB Atlas free tier: create an M0 cluster, create a database user, allow your IP address, and copy the connection string into `apps/api/.env`.
- If your MongoDB password contains special characters such as `@`, `:`, or `/`, URL-encode the password before placing it in the connection string.

The API expects `MONGODB_URI` and `CLIENT_URL` in `apps/api/.env`. A working local example is already in [apps/api/.env.example](apps/api/.env.example).

## Recommended Azure Plan
For the deployment you described, a VM-based setup is the simplest fit:
- Host the backend on an Azure Linux VM with Node.js and a process manager such as PM2.
- Host the built frontend on the same VM with Nginx, or on a second VM if you want cleaner separation.
- Use MongoDB Atlas free tier for the database instead of Cosmos DB.
- Put Nginx in front as the reverse proxy and terminate TLS there.

## Main Pieces
- `apps/api`: Node.js + Express API with MongoDB/Mongoose and Prometheus metrics.
- `apps/web`: React + Vite frontend.
- `infrastructure/azure`: Azure infrastructure notes and deployment references.

## Notes
The repository is intentionally kept to a single top-level project document here in [README.md](README.md).
