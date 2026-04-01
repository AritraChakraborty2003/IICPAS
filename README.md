# IICPAS Docker Setup

## Development mode

Runs the full stack with bind mounts and hot reload.

```bash
docker compose up --build
```

## Production-style mode

Builds optimized images without source mounts.

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

To stop the production stack:

```bash
docker compose -f docker-compose.prod.yml down
```

## Service URLs

- Client: `http://localhost:3000`
- Backend API: `http://localhost:8080`
- Static upload API: `http://localhost:3001`
- MongoDB: `mongodb://localhost:27017`

## Notes

- Development mode uses `Dockerfile.dev` files and live reload.
- Production mode uses the new `Dockerfile` files in `client`, `backend`, and `static-backend`.
- Client Docker env defaults live in `client/.env.docker`.
- If you change dependencies (`package.json` / `package-lock.json`), rebuild the affected images with `--build`.
