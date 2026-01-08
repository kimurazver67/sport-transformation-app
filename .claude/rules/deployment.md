# Deployment Rules

## ВАЖНО: Не мержить без разрешения!
Пока пользователь явно не скажет "мержи в main" или "готово к мержу" - работаем ТОЛЬКО с веткой `develop`.

## Environments

### DEV (develop branch)
- **Backend**: https://backend-dev-production-883e.up.railway.app
- **Frontend**: https://frontend-dev-production-6704.up.railway.app
- **Railway Project**: sport-transformation-dev

### PRODUCTION (main branch)
- **Backend**: https://sport-transformation-app-production.up.railway.app
- **Frontend**: (TBD - использует main branch)
- **Railway Project**: sport-transformation-app

## Workflow

1. Весь код пушится в `develop`
2. Тестируем на DEV окружении
3. Только по команде пользователя мержим в `main`
4. PRODUCTION деплоится автоматически с `main`

## Useful Commands

### Run migration on DEV:
```bash
curl -X POST "https://backend-dev-production-883e.up.railway.app/api/nutrition/debug/fix-duplicates"
```

### Check health:
```bash
curl "https://backend-dev-production-883e.up.railway.app/health"
```
