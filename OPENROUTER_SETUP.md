# Настройка OpenRouter API для AI Психолога

## Добавление переменных в Railway

Зайдите в проект **sport-transformation-dev** на Railway и добавьте следующие переменные окружения:

```bash
OPENROUTER_API_KEY=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
AI_PSYCHOLOGIST_ENABLED=true
AI_PSYCHOLOGIST_MODEL=anthropic/claude-sonnet-4-5:beta
AI_PSYCHOLOGIST_MAX_TOKENS=4000
AI_PSYCHOLOGIST_TEMPERATURE=0.7
MIN_CHECKINS_FOR_ANALYSIS=3
MIN_MINDFULNESS_FOR_ANALYSIS=2
```

## Как добавить:

1. Открыть https://railway.app/
2. Выбрать проект **sport-transformation-dev**
3. Выбрать сервис **backend-dev**
4. Перейти на вкладку **Variables**
5. Нажать **+ New Variable**
6. Добавить каждую переменную по очереди
7. После добавления всех переменных backend автоматически передеплоится

## Доступные модели через OpenRouter:

- `anthropic/claude-sonnet-4-5:beta` (рекомендуется, $3/$15 за 1M токенов)
- `anthropic/claude-opus-4` ($15/$75 за 1M токенов, лучшее качество)
- `anthropic/claude-3.5-sonnet` ($3/$15 за 1M токенов)
- `anthropic/claude-3-haiku` ($0.25/$1.25 за 1M токенов, быстрая и дешевая)

## Тестирование

После деплоя проверить:

```bash
curl https://backend-dev-production-883e.up.railway.app/health
```

Должно вернуть `{"status":"ok"}`

## Использование

AI Психолог будет автоматически генерировать анализ для пользователей каждую неделю, если у них есть:
- Минимум 3 чекина
- Минимум 2 записи в дневнике осознанности

Анализ доступен через эндпоинт:
```
GET /api/psychology/analysis/:userId/:weekNumber
```
