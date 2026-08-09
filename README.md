# AcademiaPro - College Management System / College ERP

A production-grade, full-stack College ERP solution built with React, TypeScript, Express, PostgreSQL / SQLite, and Prisma ORM.

## Tech Stack

### Frontend
- **Framework:** React 18 with TypeScript & Vite
- **Styling:** Tailwind CSS, Lucide Icons, Glassmorphism design system
- **State & Routing:** React Router v6, Axios with JWT interceptors
- **Forms & Validation:** React Hook Form + Zod
- **Analytics & Data Vis:** Recharts

### Backend
- **Runtime:** Node.js + Express with TypeScript
- **Database:** Prisma ORM with SQLite (Local Dev) / PostgreSQL (Production)
- **Auth:** JWT Authentication & bcryptjs password hashing
- **Validation:** Zod Schema Validation

---

## Project Structure

```
college-management-system/
  frontend/          # Vite React + TypeScript Frontend
  backend/           # Express + Prisma + TypeScript Backend
  package.json       # Monorepo management scripts
  README.md
```

---

## Quick Start (Local Development)

### 1. Backend Setup
```bash
cd backend
npm install
npm run db:push
npm run db:generate
npm run dev
```
Backend runs at: `http://localhost:5000`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at: `http://localhost:5173`

---

## Database Configuration

By default, the backend uses **SQLite** for instant, zero-dependency local execution (`file:./dev.db`).

To switch to **PostgreSQL**:
1. Update `DATABASE_URL` in `backend/.env`:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/college_erp?schema=public"
   ```
2. Update provider in `backend/prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Run `npm run db:push` in `backend/`.
