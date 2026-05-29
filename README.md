# dr.Climate — CRM заявок

CRM для ведення заявок: клієнт, майстер, адмін (кондиціонери зараз, інші категорії — у перспективі).

**Мови інтерфейсу:** українська (основна), російська, англійська.

## Стек

| Шар | Технології |
|-----|------------|
| Frontend | Next.js 14, React, TypeScript, TailwindCSS, next-intl |
| Backend | NestJS, JWT, Socket.io |
| Database | PostgreSQL + Prisma |

## Структура проєкту

```
dr.Climat/
├── backend/                 # NestJS API (modular monolith)
│   ├── prisma/
│   │   ├── schema.prisma    # User, MasterProfile, ServiceRequest, Message, Rating
│   │   └── seed.ts
│   └── src/
│       ├── auth/            # JWT register/login
│       ├── users/
│       ├── masters/         # Profile, availability, earnings
│       ├── orders/          # Service requests lifecycle
│       ├── matching/        # Broadcast to masters by city
│       ├── messages/        # Order chat
│       ├── admin/           # Users, orders, ban, manual assign
│       ├── events/          # WebSocket gateway
│       └── common/          # Guards, filters, decorators
├── frontend/                # Next.js App Router
│   ├── messages/            # uk.json, ru.json, en.json
│   └── src/app/[locale]/    # Landing, auth, dashboards
└── docker-compose.yml       # PostgreSQL
```

## Швидкий старт

### 1. База даних

```bash
docker compose up -d
```

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run prisma:seed
npm run start:dev
```

API: `http://localhost:3002/api`  
WebSocket: `http://localhost:3002/events`

> **Примітка:** якщо порт 3001 зайнятий (наприклад, Dolphin Anty), backend автоматично налаштований на **3002**.

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

UI: `http://localhost:3000/uk` (за замовчуванням українська)

## Тестові акаунти (seed)

| Роль | Email | Пароль |
|------|-------|--------|
| Admin | admin@drclimat.ua | admin123 |
| Client | client@example.com | client123 |
| Master | master@example.com | master123 |

## Ролі та функції

### Адмін
- **Створення заявок** від імені клієнта
- Список користувачів і заявок
- Блокування користувачів

### Клієнт
- Перегляд своїх заявок і статусу
- Чат з майстром після призначення

### Майстер
- **Календар тижня** — завантаження по днях (2/3 монтажі)
- **Налаштування**: скільки монтажів на день, робочі години
- Вкладки: Сьогодні · Вхідні · В роботі · Виконані · Всі
- Перенесення дати замовлення, ліміт на день при прийнятті

## Життєвий цикл заявки

```
CREATED → PENDING → ACCEPTED → IN_PROGRESS → COMPLETED
                              ↘ CANCELLED
```

**Matching (MVP):** адмін створює заявку → вона транслюється **всім майстрам**. Хто перший прийме — отримує роботу (транзакція запобігає double booking).

## Розширення на нові категорії

У `schema.prisma` вже є `ServiceCategory` (HVAC, ELECTRICAL, PLUMBING, CLEANING). Для нової категорії:
1. Додати значення в enum `ServiceType`
2. Додати переклади в `frontend/messages/*.json`
3. Оновити UI-селектори

## Змінні оточення

**Backend** (`backend/.env`):
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — секрет для токенів
- `PORT` — порт API (3001)
- `CORS_ORIGIN` — URL фронтенду

**Frontend** (`frontend/.env.local`):
- `NEXT_PUBLIC_API_URL` — URL API
- `NEXT_PUBLIC_WS_URL` — URL WebSocket сервера

## Production notes

- Змініть `JWT_SECRET` на довгий випадковий рядок
- Використовуйте HTTPS і secure cookies для токенів у prod
- Додайте rate limiting та helmet на API
- Налаштуйте CI/CD та міграції Prisma у pipeline
