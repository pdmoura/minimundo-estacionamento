# Minimundo Estacionamento

## Banco de dados

```bash
docker compose up -d
```

### Migrations

Desenvolvimento local:

```bash
docker compose up -d
cd backend
npx prisma migrate dev
```

Banco remoto/Neon:

```text
Definir DATABASE_URL com a URL fornecida pelo Neon.
```

```bash
cd backend
npx prisma migrate deploy
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

## Backend

```bash
cd backend
npm install
npm run start:dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- PostgreSQL: localhost:5432
