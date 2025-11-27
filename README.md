# Kafel Back-End API

The **Kafel Back-End** is a Node.js/NestJS API that powers the Kafel donation platform.
It manages users, campaigns, donations, wallets, and payouts for donors, beneficiaries,
merchants, and campaign managers.

---

## Features

- 👤 User & role management (admin, donor, merchant, campaign manager, etc.)
- 💸 Donations, withdrawals, and internal transfers
- 📦 Campaign creation, management, and reporting
- 🧾 Transaction history and ledger endpoints
- 🔐 JWT-based authentication and authorization
- 🧮 Statistic/analytics endpoints for the admin dashboard
- 🗄️ Relational database integration (e.g., MySQL / PostgreSQL)

---

## Tech Stack

- **Runtime:** Node.js
- **Framework:** NestJS
- **Database:** MySQL / MariaDB (via TypeORM)
- **Auth:** JWT / Passport
- **Validation:** class-validator / class-transformer

---

## Getting Started

### 1. Prerequisites

- Node.js (LTS)
- npm or yarn
- MySQL (or compatible DB)
- (Optional) Docker & docker-compose

### 2. Installation

```bash
git clone https://github.com/kafel-app-io-org/back-end.git
cd back-end
npm install
# or: yarn install
```

### 3. Environment Variables

Create a `.env` file in the root:

```bash
cp .env.example .env
```

Typical variables (adapt to your actual config):

```env
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=secret
DB_NAME=kafel

JWT_SECRET=super-secret-key
JWT_EXPIRES_IN=1d

# Optional CORS / URLs
FRONTEND_URL=http://localhost:5173
MOBILE_APP_URL=exp://localhost:19000
```

---

## Database Setup

- Ensure the database exists:

```sql
CREATE DATABASE kafel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

- Run migrations (if enabled):

```bash
npm run typeorm:migration:run
```

---

## Scripts

```bash
# Development (watch mode)
npm run start:dev

# Production build & run
npm run build
npm run start:prod

# Testing
npm run test
npm run test:e2e

# Lint
npm run lint
```

---

## API Documentation

If Swagger is enabled:

- Start the server and open:

```text
http://localhost:3000/api/docs
```

to see Swagger UI.

---

## Project Structure (example)

```text
src/
  main.ts
  app.module.ts
  config/
  modules/
    auth/
    users/
    wallets/
    donations/
    campaigns/
    merchants/
    stats/
```

---

## Deployment

For production, you can:

- Build and run with PM2
- Or use Docker / docker-compose
- Or deploy to a cloud provider (AWS, DigitalOcean, etc.)

Example:

```bash
npm run build
NODE_ENV=production node dist/main.js
```

---

## Contributing

1. Fork the repo & clone your fork.
2. Create a feature branch: `git checkout -b feature/my-feature`.
3. Add tests for new features.
4. Submit a Pull Request.

---

## License

Part of the **Kafel** platform. License terms defined by the organization.
