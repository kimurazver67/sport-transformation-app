# FatSecret API Integration Setup

## Overview

FatSecret API используется для поиска продуктов и автоматического импорта их в локальную базу данных.

## Credentials

- **Client ID**: `54f1eebc60864584bbe6529ff549ed58`
- **Client Secret**: `b596986f18ba469da864c0b37c1c775f`
- **Application Name**: Sport Transformation App
- **Free Tier Limit**: 5,000 requests/day

## IP Whitelist Configuration

⚠️ **ВАЖНО**: FatSecret API требует регистрации IP-адресов в панели управления.

### Шаги:

1. Зайти на https://platform.fatsecret.com/
2. Application Management → **Sport Transformation App**
3. IP Addresses → **Add IP address**

### IP-адреса для регистрации:

**Development (локальный Mac):**
```
89.40.104.2
```

**Production (Railway):**
- Получить IP Railway deployment:
  ```bash
  railway run printenv | grep RAILWAY
  ```
- Или использовать webhook URL и извлечь IP

## Environment Variables

Добавить в `.env`:

```bash
# FatSecret API
FATSECRET_CLIENT_ID=54f1eebc60864584bbe6529ff549ed58
FATSECRET_CLIENT_SECRET=b596986f18ba469da864c0b37c1c775f
FATSECRET_ENABLED=true
```

В Railway Variables добавить те же переменные.

## Testing

### Quick Test (без database):

```bash
cd backend
npx tsx test-fatsecret-simple.ts
```

**Expected output:**
```
🧪 Тестирование FatSecret API

[1/4] Получение access token...
   ✅ Token получен, expires in: 86400 сек
[2/4] Поиск продуктов: "chicken"...
   ✅ Найдено 5 продуктов
```

### Full Test (с database):

```bash
DATABASE_URL="postgresql://..." npx tsx src/test-fatsecret.ts
```

## API Endpoints

### OAuth 2.0 Token:
```
POST https://oauth.fatsecret.com/connect/token
Content-Type: application/x-www-form-urlencoded
Authorization: Basic base64(client_id:client_secret)

grant_type=client_credentials&scope=basic
```

### Search Foods:
```
GET https://platform.fatsecret.com/rest/foods/search/v1
Authorization: Bearer {access_token}

?search_expression=chicken&format=json&max_results=20
```

### Get Food Details:
```
POST https://platform.fatsecret.com/rest/server.api
Authorization: Bearer {access_token}
Content-Type: application/x-www-form-urlencoded

method=food.get.v2&food_id={id}&format=json
```

## Error Codes

| Code | Message | Solution |
|------|---------|----------|
| 21 | Invalid IP address detected | Add IP to whitelist in FatSecret panel |
| 3 | Invalid access token | Regenerate token |
| 2 | Service temporarily unavailable | Wait and retry |

## Rate Limits

- **Free Tier**: 5,000 requests/day
- **Token Expiry**: 24 hours (86400 seconds)
- **Recommendation**: Cache token, cache search results

## Cache Strategy

1. **Access Token**: Кэшируется в памяти на 24 часа
2. **Search Results**: Можно кэшировать в `fatsecret_search_cache` таблице на 7 дней
3. **Imported Products**: Сохраняются в `products` с `fatsecret_id` для дедупликации

## Documentation

- Official Docs: https://platform.fatsecret.com/api/Default.aspx?screen=rapiref2
- OAuth 2.0 Guide: https://platform.fatsecret.com/api/Default.aspx?screen=rapiauth2
