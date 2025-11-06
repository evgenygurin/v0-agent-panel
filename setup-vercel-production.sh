#!/bin/bash

# Vercel Production Setup Script
# Автоматизированная настройка production deployment

set -e

echo "🚀 Vercel Production Setup для v0-agent-panel"
echo "=============================================="
echo ""

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Проверка Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI не установлен${NC}"
    echo "Установите: npm install -g vercel"
    exit 1
fi

echo -e "${GREEN}✅ Vercel CLI установлен${NC}"

# Проверка, подключен ли проект
if [ ! -f ".vercel/project.json" ]; then
    echo -e "${YELLOW}⚠️  Проект не подключен к Vercel${NC}"
    echo "Подключаем проект..."
    vercel link --yes
fi

PROJECT_ID=$(jq -r '.projectId' .vercel/project.json)
PROJECT_NAME=$(jq -r '.projectName' .vercel/project.json)

echo -e "${GREEN}✅ Проект подключен: ${PROJECT_NAME}${NC}"
echo "   Project ID: ${PROJECT_ID}"
echo ""

# Проверка environment variables
echo "📋 Проверка environment variables..."
ENV_CHECK=$(vercel env ls 2>&1 || true)

if echo "$ENV_CHECK" | grep -q "ANTHROPIC_API_KEY"; then
    echo -e "${GREEN}✅ ANTHROPIC_API_KEY уже настроен${NC}"
    HAS_API_KEY=true
else
    echo -e "${YELLOW}⚠️  ANTHROPIC_API_KEY не найден${NC}"
    HAS_API_KEY=false
fi

echo ""

# Если API ключ не настроен
if [ "$HAS_API_KEY" = false ]; then
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}   Требуется настройка ANTHROPIC_API_KEY${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Для работы AI Agent в production нужен Anthropic API ключ."
    echo ""
    echo "📝 Шаги:"
    echo "   1. Откройте: https://console.anthropic.com/settings/keys"
    echo "   2. Нажмите 'Create Key'"
    echo "   3. Скопируйте ключ"
    echo ""
    echo "💡 API ключ работает параллельно с вашей подпиской Claude Max"
    echo ""

    read -p "У вас есть API ключ? (y/n): " HAS_KEY

    if [ "$HAS_KEY" = "y" ] || [ "$HAS_KEY" = "Y" ]; then
        echo ""
        echo "Добавляем ANTHROPIC_API_KEY..."
        echo ""
        echo "Введите ваш API ключ (начинается с sk-ant-api03-):"
        vercel env add ANTHROPIC_API_KEY
        echo ""
        echo -e "${GREEN}✅ API ключ добавлен${NC}"
    else
        echo ""
        echo -e "${RED}❌ Невозможно продолжить без API ключа${NC}"
        echo ""
        echo "После получения ключа, запустите:"
        echo "  ./setup-vercel-production.sh"
        echo ""
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   Готово к deployment!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

read -p "Создать production deployment сейчас? (y/n): " DO_DEPLOY

if [ "$DO_DEPLOY" = "y" ] || [ "$DO_DEPLOY" = "Y" ]; then
    echo ""
    echo "🚀 Запуск production deployment..."
    echo ""
    vercel --prod
    echo ""
    echo -e "${GREEN}✅ Deployment завершён!${NC}"
    echo ""
    echo "📊 Посмотреть статус:"
    echo "   vercel ls"
    echo ""
    echo "📝 Посмотреть логи:"
    echo "   vercel logs"
    echo ""
    echo "🌐 Открыть проект:"
    echo "   vercel open"
else
    echo ""
    echo "Deployment отложен. Когда будете готовы:"
    echo "   vercel --prod"
    echo ""
    echo "Или просто:"
    echo "   git push origin main"
    echo ""
    echo "(GitHub автоматически задеплоит в Vercel)"
fi

echo ""
echo -e "${GREEN}🎉 Настройка завершена!${NC}"
