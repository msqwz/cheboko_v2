#!/bin/bash
# =============================================================================
# 🚀 Чебоко Сервис — Скрипт быстрого деплоя на Timeweb Cloud
# =============================================================================
# Использование:
#   chmod +x deploy.sh
#   ./deploy.sh              — первый деплой (полная установка)
#   ./deploy.sh update       — обновление кода (быстрая пересборка)
#   ./deploy.sh rebuild      — полная пересборка без кэша
#   ./deploy.sh logs         — просмотр логов
#   ./deploy.sh status       — статус контейнеров
#   ./deploy.sh stop         — остановить всё
#   ./deploy.sh restart      — перезапустить
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; exit 1; }
info() { echo -e "${BLUE}[→]${NC} $1"; }

COMMAND=${1:-deploy}

# --------------- Проверка Docker ---------------
check_docker() {
    if ! command -v docker &> /dev/null; then
        error "Docker не установлен. Установите: curl -fsSL https://get.docker.com | sh"
    fi
    if ! docker compose version &> /dev/null; then
        error "Docker Compose не установлен. Установите: apt install -y docker-compose-plugin"
    fi
    log "Docker и Docker Compose найдены"
}

# --------------- Подготовка .env ---------------
setup_env() {
    if [ ! -f .env ]; then
        if [ -f .env.production ]; then
            cp .env.production .env
            warn ".env создан из .env.production — проверьте настройки!"
            
            # Генерируем безопасные значения если стоят дефолтные
            if grep -q "CHANGE_ME" .env 2>/dev/null || grep -q "your-domain" .env 2>/dev/null; then
                warn "В .env найдены placeholder-значения. Рекомендуется отредактировать: nano .env"
            fi
        else
            error ".env.production не найден! Создайте файл .env с переменными окружения."
        fi
    else
        log ".env файл найден"
    fi
}

# --------------- Первый деплой ---------------
deploy() {
    echo ""
    echo -e "${BLUE}╔══════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║   🚀 Чебоко Сервис — Деплой на Timeweb  ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════╝${NC}"
    echo ""

    check_docker
    setup_env

    info "Собираю Docker-образы..."
    docker compose build --parallel 2>&1 | tail -5

    info "Запускаю контейнеры..."
    docker compose up -d

    # Ждём пока БД поднимется
    info "Ожидаю готовности PostgreSQL..."
    sleep 5
    
    # Проверяем статус
    echo ""
    docker compose ps
    echo ""

    # Определяем IP
    SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")
    
    log "Деплой завершён!"
    echo ""
    echo -e "${GREEN}┌─────────────────────────────────────────┐${NC}"
    echo -e "${GREEN}│  Сайт доступен: http://${SERVER_IP}      ${NC}"
    echo -e "${GREEN}│  API доступен:  http://${SERVER_IP}:8000  ${NC}"
    echo -e "${GREEN}│                                         │${NC}"
    echo -e "${GREEN}│  Логи:    ./deploy.sh logs              │${NC}"
    echo -e "${GREEN}│  Статус:  ./deploy.sh status            │${NC}"
    echo -e "${GREEN}│  Стоп:    ./deploy.sh stop              │${NC}"
    echo -e "${GREEN}└─────────────────────────────────────────┘${NC}"
}

# --------------- Обновление (быстрая пересборка) ---------------
update() {
    echo -e "${BLUE}[→] Обновление Чебоко Сервис...${NC}"
    
    # Git pull если это git-репо
    if [ -d .git ]; then
        info "Обновляю код из Git..."
        git pull --ff-only || warn "Git pull не удался, продолжаю с локальными файлами"
    fi

    info "Пересобираю образы..."
    docker compose build --parallel

    info "Перезапускаю контейнеры..."
    docker compose up -d

    echo ""
    docker compose ps
    log "Обновление завершено!"
}

# --------------- Полная пересборка ---------------
rebuild() {
    echo -e "${YELLOW}[!] Полная пересборка без кэша...${NC}"
    
    docker compose down
    docker compose build --no-cache --parallel
    docker compose up -d

    echo ""
    docker compose ps
    log "Пересборка завершена!"
}

# --------------- Логи ---------------
logs() {
    SERVICE=${2:-""}
    if [ -n "$SERVICE" ]; then
        docker compose logs -f --tail=100 "$SERVICE"
    else
        docker compose logs -f --tail=100
    fi
}

# --------------- Статус ---------------
status() {
    echo -e "${BLUE}Статус контейнеров:${NC}"
    docker compose ps
    echo ""
    echo -e "${BLUE}Использование ресурсов:${NC}"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" 2>/dev/null || true
}

# --------------- Стоп ---------------
stop() {
    warn "Останавливаю контейнеры..."
    docker compose down
    log "Все контейнеры остановлены"
}

# --------------- Рестарт ---------------
restart() {
    info "Перезапускаю контейнеры..."
    docker compose restart
    docker compose ps
    log "Перезапуск завершён"
}

# --------------- Маршрутизация команд ---------------
case "$COMMAND" in
    deploy)   deploy ;;
    update)   update ;;
    rebuild)  rebuild ;;
    logs)     logs "$@" ;;
    status)   status ;;
    stop)     stop ;;
    restart)  restart ;;
    *)
        echo "Использование: ./deploy.sh [команда]"
        echo ""
        echo "Команды:"
        echo "  deploy    — Первый деплой (по умолчанию)"
        echo "  update    — Обновить код и пересобрать"
        echo "  rebuild   — Полная пересборка без кэша"
        echo "  logs      — Просмотр логов (logs frontend|backend|db)"
        echo "  status    — Статус контейнеров"
        echo "  stop      — Остановить всё"
        echo "  restart   — Перезапустить"
        ;;
esac
