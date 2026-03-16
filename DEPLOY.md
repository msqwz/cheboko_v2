# 🚀 Деплой Чебоко Сервис на Timeweb Cloud

## Архитектура

```
┌─────────────────────────────────────────┐
│           Timeweb Cloud VPS             │
│                                         │
│  ┌──────────┐  ┌──────────┐  ┌───────┐ │
│  │  Nginx   │──│  FastAPI  │──│ Postgres│ │
│  │ (фронт)  │  │ (бэкенд) │  │  (БД)  │ │
│  │  :80     │  │  :8000   │  │ :5432  │ │
│  └──────────┘  └──────────┘  └───────┘ │
│       ↑                                 │
│    Интернет                             │
└─────────────────────────────────────────┘
```

## Требования

- **Timeweb Cloud VPS** — минимум 1 vCPU, 1 GB RAM, 20 GB SSD
- **ОС**: Ubuntu 22.04 / 24.04
- **Docker** + **Docker Compose** установлены

---

## Шаг 1: Подготовка сервера

Подключитесь к серверу по SSH:

```bash
ssh root@YOUR_SERVER_IP
```

Установите Docker (если ещё не установлен):

```bash
curl -fsSL https://get.docker.com | sh
apt install -y docker-compose-plugin
```

## Шаг 2: Загрузка проекта

**Вариант A — через Git:**
```bash
cd /opt
git clone https://github.com/YOUR_REPO/cheboko_v2.git
cd cheboko_v2
```

**Вариант B — через SCP (без Git):**
```bash
# На локальной машине:
scp -r ./cheboko_v2 root@YOUR_SERVER_IP:/opt/cheboko_v2

# На сервере:
cd /opt/cheboko_v2
```

## Шаг 3: Настройка переменных окружения

```bash
cp .env.production .env
nano .env
```

**Обязательно** замените:
- `POSTGRES_PASSWORD` — сложный пароль (минимум 16 символов)
- `JWT_SECRET` — случайная строка (можно сгенерировать: `openssl rand -hex 32`)
- `CORS_ORIGINS` — ваш домен (например, `https://cheboko.tw1.ru`)

## Шаг 4: Запуск

```bash
docker compose up -d --build
```

Проверьте, что всё запустилось:

```bash
docker compose ps
docker compose logs -f
```

Сайт будет доступен по адресу: `http://YOUR_SERVER_IP`

## Шаг 5: Привязка домена (опционально)

1. В панели Timeweb → DNS → добавьте A-запись: `cheboko.tw1.ru → YOUR_SERVER_IP`
2. Установите SSL (Let's Encrypt):

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d cheboko.tw1.ru
```

Или через Timeweb панель → SSL-сертификаты.

---

## Полезные команды

```bash
# Просмотр логов
docker compose logs -f frontend
docker compose logs -f backend
docker compose logs -f db

# Перезапуск
docker compose restart

# Обновление (после git pull)
docker compose up -d --build

# Остановка
docker compose down

# Полная очистка (УДАЛИТ ДАННЫЕ!)
docker compose down -v
```

## Структура файлов деплоя

```
cheboko_v2/
├── .env.production      # Шаблон переменных окружения
├── .dockerignore        # Файлы, игнорируемые Docker (фронт)
├── Dockerfile           # Multi-stage build: Node → Nginx
├── nginx.conf           # Конфигурация Nginx (SPA + proxy)
├── docker-compose.yml   # Оркестрация: Frontend + Backend + DB
│
├── backend/
│   ├── .dockerignore    # Файлы, игнорируемые Docker (бэк)
│   ├── Dockerfile       # Python 3.12 + FastAPI
│   └── ...
│
├── src/                 # React исходники
└── ...
```

## Решение проблем

| Проблема | Решение |
|----------|---------|
| `502 Bad Gateway` | `docker compose logs backend` — проверьте подключение к БД |
| Белый экран | `docker compose logs frontend` — проверьте сборку |
| Порт 80 занят | `systemctl stop apache2` или `nginx` — остановите конфликтующий сервис |
| БД не запускается | Проверьте `POSTGRES_PASSWORD` в `.env` |
