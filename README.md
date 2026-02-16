# IICPAS Development (Docker)

## Run full local stack

```bash
docker compose up --build
```

## Service URLs

- Client: `http://localhost:3000`
- Backend API: `http://localhost:8080`
- Static upload API: `http://localhost:3001`
- MongoDB: `mongodb://localhost:27017`

## Hot reload behavior

- Source code changes in `client`, `backend`, and `static-backend` reflect automatically.
- You do not need to restart Docker containers for normal file edits.

## When rebuild is required

- If you change dependencies (`package.json` / `package-lock.json`), rebuild:

```bash
docker compose up --build
```
