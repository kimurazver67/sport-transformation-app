# Claude Skills - Sport Transformation App

## Quick Reference Commands

### 1. Telegram Bot Management

#### Установить URL Mini App
```bash
curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setChatMenuButton" \
  -H "Content-Type: application/json" \
  -d '{
    "menu_button": {
      "type": "web_app",
      "text": "Открыть",
      "web_app": {
        "url": "https://keen-alignment-production.up.railway.app"
      }
    }
  }'
```

#### Отправить сообщение в группу
```bash
curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": "-1003380571535",
    "text": "Your message here",
    "parse_mode": "HTML"
  }'
```

#### Получить информацию о боте
```bash
curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getMe"
curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo"
```

### 2. Railway Deployment

#### Проверить статус деплоя
```bash
gh run list --workflow="Deploy Frontend to Railway" --limit 3
gh run list --workflow="Deploy Backend to Railway" --limit 3
```

#### Запустить деплой вручную
```bash
gh workflow run "Deploy Frontend to Railway"
gh workflow run "Deploy Backend to Railway"
```

#### Проверить версию билда на Railway
```bash
# Frontend version (по timestamp в имени JS файла)
curl -s "https://keen-alignment-production.up.railway.app/" | grep -o 'index-[^"]*\.js'

# Backend health
curl -s "https://sport-transformation-app-production.up.railway.app/health"
```

### 3. Service URLs

| Service | URL |
|---------|-----|
| Frontend | https://keen-alignment-production.up.railway.app |
| Backend | https://sport-transformation-app-production.up.railway.app |
| Bot Token | 8189539417:AAGki4aTKHCxgFpvMxOsDL9zdNcFaO2i6fA |
| Admin Chat ID | -1003380571535 |

### 4. Debug Logging

#### Отправить debug лог в Telegram
```bash
BOT_TOKEN="8189539417:AAGki4aTKHCxgFpvMxOsDL9zdNcFaO2i6fA"
curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
  -H "Content-Type: application/json" \
  -d "{\"chat_id\": \"-1003380571535\", \"text\": \"🔍 Debug: $MESSAGE\", \"parse_mode\": \"HTML\"}"
```

### 5. Common Issues & Solutions

#### Проблема: Бесконечная загрузка
1. Проверить что деплой прошёл: `gh run list --workflow="Deploy Frontend to Railway" --limit 1`
2. Проверить версию билда на сервере (timestamp в имени JS)
3. Проверить URL Mini App через setChatMenuButton
4. Добавить debug логи в код и передеплоить

#### Проблема: Неправильный URL в Telegram
```bash
# Установить правильный URL
curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setChatMenuButton" \
  -H "Content-Type: application/json" \
  -d '{"menu_button":{"type":"web_app","text":"Открыть","web_app":{"url":"https://keen-alignment-production.up.railway.app"}}}'
```

#### Проблема: Backend 502/503
1. Проверить health: `curl https://sport-transformation-app-production.up.railway.app/health`
2. Проверить логи в Railway dashboard
3. Проверить переменные окружения (DATABASE_URL, BOT_TOKEN)

### 6. GitHub Workflows

- `deploy-frontend.yml` - деплоит `frontend/` на `keen-alignment` (Railway)
- `deploy-backend.yml` - деплоит `backend/` на `sport-transformation-app` (Railway)

### 7. Environment Variables (Railway)

#### Backend
- DATABASE_URL - PostgreSQL connection string
- BOT_TOKEN - Telegram bot token
- ADMIN_CHAT_ID - Chat ID для уведомлений
- WEBAPP_URL - URL фронтенда
- FRONTEND_URL - URL фронтенда (альтернатива)

#### Frontend
- VITE_API_URL - URL бэкенда (задаётся при билде в workflow)
