# Pompilo PnL Analytics

Монорепозиторій для обліку та аналітики трейдингового PnL.

У проєкті є:

- `api` — бекенд на NestJS, TypeORM, PostgreSQL, BullMQ і Redis
- `client` — фронтенд на Next.js 16
- `infra/nginx` — reverse proxy для Docker-запуску
- `docker-compose.yaml` — локальна інфраструктура для повного запуску через Docker

## Що вміє проєкт

Фронтенд містить:

- публічні сторінки
- customer-кабінет
- admin-кабінет

Основні клієнтські маршрути:

- `/`
- `/about`
- `/analytics`
- `/login`
- `/register`
- `/admin/login`
- `/admin/dashboard`
- `/customer/dashboard`
- `/customer/api-keys`
- `/customer/trading-account`

Бекенд надає:

- customer auth: `/customer/register`, `/customer/login`, `/customer/logout`, `/customer/refresh`, `/customer/me`
- admin auth: `/admin/login`, `/admin/logout`, `/admin/refresh`, `/admin/me`
- API keys: `/customer/api-key/*`
- trading accounts: `/customer/trading-account/*`
- Swagger: `http://localhost:3000/swagger`

## Архітектура запитів

У Docker-запуску запити працюють так:

1. Браузер відкриває фронтенд через `https://localhost`
2. Браузерні API-запити йдуть на Next route `/api/*`
3. Next.js проксіює ці запити на Nest API через внутрішню Docker-мережу за адресою `http://api:3000`
4. Nginx у контейнері `gateway` приймає зовнішній трафік на `80/443` і проксіює його на `client:3001`

Це означає:

- зовні фронтенд доступний на `https://localhost`
- всередині Docker `client` і `api` спілкуються не через `localhost`, а через Docker network

## Структура репозиторію

```text
.
├── api
├── client
├── infra
│   └── nginx
├── docker-compose.yaml
├── .env
└── README.md
```

## Вимоги

- Node.js 22
- npm
- Docker Engine + Docker Compose

## Env-файли

У репозиторії використовуються три окремі env-файли:

1. `/.env`
   Використовується `docker-compose.yaml` для PostgreSQL і Redis.
2. `/api/.env`
   Використовується NestJS.
3. `/client/.env`
   Використовується Next.js для локального запуску без Docker.

Для Docker-запуску потрібні всі три файли.

### `/.env`

Приклад:

```env
DB_USER=admin
DB_PASSWORD=admin_pass
DB_NAME=pompilo_db
DB_PORT=5432

REDIS_PORT=6379
```

Примітка:

- `DB_HOST` у кореневому `.env` не використовується `docker-compose.yaml`

### `/api/.env`

Мінімально потрібні змінні:

```env
COOKIE_DOMAIN=localhost
NODE_ENV=development

DB_USER=admin
DB_PASSWORD=admin_pass
DB_NAME=pompilo_db
DB_PORT=5432
DB_HOST=localhost

REDIS_PORT=6379
REDIS_HOST=localhost

JWT_SECRET=change_me
JWT_ACCESS_TOKEN_TTL=1d
JWT_REFRESH_TOKEN_TTL=7d

ENCRYPTION_KEY=change_me

BYBIT_URL=https://api.bybit.com
BYBIT_DEMO_URL=https://api-demo.bybit.com
```

У Docker частина значень перевизначається через `docker-compose.yaml`:

- `NODE_ENV=production`
- `PORT=3000`
- `DB_HOST=postgres`
- `DB_PORT=5432`
- `REDIS_HOST=redis`
- `REDIS_PORT=6379`
- `CLIENT_ORIGIN=https://localhost`

### `/client/.env`

Для локального запуску без Docker:

```env
NEXT_PUBLIC_API_URL=http://localhost
NEXT_PUBLIC_API_PORT=3001
NEXTAUTH_SECRET=change_me
API_BASE_URL=http://localhost:3000
```

Що означають ці змінні:

- `NEXT_PUBLIC_API_URL` — базовий origin клієнта для браузерного сценарію без Docker
- `NEXT_PUBLIC_API_PORT` — порт локального Next.js
- `API_BASE_URL` — реальна адреса бекенда, куди Next proxy пересилає `/api/*`

У Docker `client` запускається з іншими значеннями:

```env
NEXT_PUBLIC_API_URL=https://localhost
NEXT_PUBLIC_API_PORT=443
API_BASE_URL=http://api:3000
```

## Запуск через Docker

Це основний і рекомендований спосіб запуску.

1. Створіть `/.env`, `/api/.env`, `/client/.env`
2. Запустіть:

```bash
docker compose up --build
```

Корисні команди:

```bash
docker compose up --build -d
docker compose ps
docker compose logs -f
docker compose down
docker compose down -v
```

Після старту:

- фронтенд: `https://localhost`
- HTTP редірект: `http://localhost` -> `https://localhost`
- API напряму: `http://localhost:3000`
- Swagger: `http://localhost:3000/swagger`

Важливо:

- у Docker використовується self-signed сертифікат
- браузер покаже попередження безпеки для `https://localhost`, це очікувана поведінка локального середовища

## Локальний запуск без Docker

Підійде для розробки окремо від контейнерів.

Перед стартом:

- підніміть PostgreSQL
- підніміть Redis
- підготуйте `api/.env` і `client/.env`

### API

```bash
cd api
npm install
npm run start:dev
```

API буде доступний на `http://localhost:3000`.

### Client

```bash
cd client
npm install
npm run dev -- --port 3001
```

Client буде доступний на `http://localhost:3001`.

## Скрипти

### `api`

```bash
npm run build
npm run start:dev
npm run test
npm run test:unit
npm run test:integration
npm run test:e2e
```

### `client`

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test
```

## Особливості авторизації

- customer login page: `/login`
- customer register page: `/register`
- admin login page: `/admin/login`
- customer protected zone: `/customer/*`
- admin protected zone: `/admin/*`

У проєкті auth працює через cookies.

Важливі деталі:

- бекенд ставить `secure` cookies
- у Docker auth сценарій треба перевіряти через `https://localhost`, не через plain HTTP
- Next.js використовує внутрішній proxy route `client/src/app/api/[...slug]/route.ts`
- middleware `client/src/proxy.ts` перевіряє сесію і робить auth redirects

## Що перевіряти при проблемах

Якщо щось не працює в Docker:

1. Перевірте статус контейнерів:

```bash
docker compose ps
```

2. Подивіться логи:

```bash
docker compose logs --tail=200 api client gateway
```

3. Переконайтесь, що відкриваєте саме `https://localhost`

4. Перевірте Swagger:

```text
http://localhost:3000/swagger
```

## Поточний рекомендований сценарій використання

- для повного запуску проєкту використовуйте Docker
- для розробки окремих частин використовуйте локальний запуск `api` і `client`
- для auth-перевірок у Docker використовуйте тільки `https://localhost`
