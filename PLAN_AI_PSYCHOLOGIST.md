# План реализации AI-психолога на базе Claude Sonnet 4.5

## 📋 Обзор фичи

**Цель**: Еженедельный психологический анализ поведения пользователя на основе данных из дневника, чекинов, замеров и импульсов.

**Роль AI**: Психолог-консультант, который анализирует паттерны поведения, выявляет проблемы и даёт рекомендации.

---

## 🗄️ 1. Структура данных

### Существующие данные для анализа:

#### 1.1 Daily Checkins (ежедневные чекины)
- `workout` - тренировка (да/нет)
- `workout_type` - тип тренировки (strength/cardio/rest)
- `nutrition` - питание (да/нет)
- `water` - вода (да/нет)
- `water_liters` - количество литров
- `sleep_hours` - часы сна
- `mood` - настроение (1-5)
- `steps` - количество шагов

#### 1.2 Mindfulness Entries (дневник осознанности)
- `gratitude` - благодарность
- `wins` - маленькие победы
- `challenges` - трудности
- `lessons` - уроки
- `mood_note` - заметка о настроении

#### 1.3 Impulse Logs (трекер импульсов)
- `trigger_type` - триггер (stress/boredom/social/emotional/habitual)
- `intensity` - интенсивность (1-10)
- `action_taken` - действие (resisted/gave_in/alternative)
- `notes` - заметки

#### 1.4 Task Completions (выполнение заданий)
- Количество выполненных заданий
- Паттерн выполнения (какие задания пропускаются)

#### 1.5 Weekly Measurements (еженедельные замеры)
- `weight` - вес
- Объёмы тела
- Динамика изменений

---

## 🏗️ 2. Архитектура системы

### 2.1 Backend компоненты

```
/backend/src/
├── services/
│   ├── aiPsychologistService.ts    # Основной сервис AI-психолога
│   ├── weeklyDataService.ts        # Сбор недельных данных пользователя
│   └── claudeService.ts            # Интеграция с Claude API
├── routes/
│   └── api.ts                      # Добавить endpoint: /api/psychology/weekly-analysis/:userId
├── db/migrations/
│   └── 013_psychology_analyses.sql # Таблица для хранения анализов
└── types/
    └── index.ts                    # Типы для психологического анализа
```

### 2.2 Frontend компоненты

```
/frontend/src/
├── components/
│   ├── PsychologyInsight.tsx       # Карточка психологического инсайта
│   └── PsychologyAnalysis.tsx      # Полный анализ
├── pages/
│   └── PsychologyPage.tsx          # Страница с историей анализов
└── store/
    └── index.ts                    # Добавить состояние для психологии
```

---

## 📊 3. База данных

### 3.1 Новая таблица: psychology_analyses

```sql
CREATE TABLE psychology_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,

  -- AI анализ (JSON структура)
  analysis JSONB NOT NULL,

  -- Метаданные
  data_summary JSONB NOT NULL,  -- Сводка данных за неделю
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, week_number)
);

CREATE INDEX idx_psychology_user_week ON psychology_analyses(user_id, week_number DESC);
```

### 3.2 Структура analysis JSONB

```typescript
{
  "behavioral_patterns": {
    "consistency": {
      "score": 7,  // 1-10
      "observation": "Заметна высокая дисциплина в тренировках...",
      "evidence": ["6 из 7 дней тренировки", "...]
    },
    "sleep": {
      "score": 4,
      "observation": "Недостаток сна влияет на восстановление...",
      "evidence": ["Средний сон 5.5 часов", "...]
    },
    "nutrition": {
      "score": 8,
      "observation": "Отличная приверженность плану питания...",
      "evidence": [...]
    },
    "emotional_state": {
      "score": 5,
      "observation": "Эмоциональные колебания в середине недели...",
      "evidence": ["Настроение 2/5 в среду", "Импульс уровня 8", ...]
    }
  },

  "key_insights": [
    {
      "type": "warning",  // warning | positive | neutral
      "title": "Хронический недосып влияет на прогресс",
      "description": "Анализ показывает связь между недостатком сна и эмоциональными срывами...",
      "priority": "high"  // high | medium | low
    },
    {
      "type": "positive",
      "title": "Успешное управление импульсами",
      "description": "4 из 5 импульсов успешно преодолены...",
      "priority": "medium"
    }
  ],

  "identified_problems": [
    {
      "problem": "Недостаток сна компенсируется кофеином",
      "root_cause": "Стресс на работе + поздние тренировки",
      "impact": "Снижение качества восстановления, эмоциональная нестабильность",
      "evidence": ["Записи в дневнике о стрессе", "Среднее время сна 5.5 часов", ...]
    }
  ],

  "recommendations": [
    {
      "category": "sleep",  // sleep | nutrition | training | mindset | stress
      "priority": "high",
      "action": "Перенести тренировки на утро или обеденное время",
      "why": "Поздние тренировки (после 19:00) активируют нервную систему...",
      "how": [
        "Попробуй утреннюю силовую на 3 дня на этой неделе",
        "Используй вечером только лёгкую растяжку или прогулку"
      ],
      "expected_result": "Улучшение качества сна, стабилизация настроения"
    },
    {
      "category": "mindset",
      "priority": "medium",
      "action": "Практика благодарности перед сном",
      "why": "Твои записи показывают фокус на проблемах...",
      "how": [
        "Каждый вечер записывай 3 вещи, за которые благодарен",
        "Фокусируйся на маленьких победах, а не на недостатках"
      ],
      "expected_result": "Улучшение эмоционального фона"
    }
  ],

  "progress_recognition": {
    "wins": [
      "Успешно устоял перед 4 импульсами к перееданию",
      "Впервые выполнил все задания недели",
      "Вес снизился на 0.8 кг"
    ],
    "growth_areas": [
      "Улучшение качества сна",
      "Управление стрессом"
    ]
  },

  "next_week_focus": [
    "Эксперимент с временем тренировок",
    "Практика благодарности",
    "Отслеживание связи стресс → импульсы"
  ]
}
```

---

## 🤖 4. Prompt Engineering

### 4.1 System Prompt для Claude

```
Ты — профессиональный психолог-консультант, специализирующийся на поведенческих паттернах
в контексте фитнеса и трансформации тела.

ТВОЯ РОЛЬ:
- Анализировать поведенческие данные пользователя за неделю
- Выявлять паттерны, проблемы и их глубинные причины
- Давать практичные, конкретные рекомендации
- Поддерживать мотивацию через признание прогресса

ПРИНЦИПЫ АНАЛИЗА:
1. Evidence-based: Каждое утверждение подкрепляй конкретными данными
2. Compassionate: Будь эмпатичным, не осуждай
3. Actionable: Рекомендации должны быть конкретными и выполнимыми
4. Holistic: Учитывай взаимосвязь физического и эмоционального
5. Growth-oriented: Фокусируйся на развитии, а не на неудачах

ФОРМАТ ОТВЕТА:
Строго JSON структура (без markdown, без комментариев):
{
  "behavioral_patterns": { ... },
  "key_insights": [ ... ],
  "identified_problems": [ ... ],
  "recommendations": [ ... ],
  "progress_recognition": { ... },
  "next_week_focus": [ ... ]
}

ВАЖНО:
- Ищи связи между данными (например: плохой сон → плохое настроение → импульсы)
- Обращай внимание на отклонения от паттерна (почему в среду был срыв?)
- Признавай успехи, даже маленькие
- Рекомендации должны быть SMART (конкретные, измеримые, достижимые)
```

### 4.2 User Prompt (данные недели)

```
Проанализируй неделю пользователя ${userName} (неделя ${weekNumber}):

ЦЕЛЬ: ${userGoal === 'weight_loss' ? 'Похудение' : 'Набор массы'}

=== ЕЖЕДНЕВНЫЕ ЧЕКИНЫ ===
${checkinsData}

=== ДНЕВНИК ОСОЗНАННОСТИ ===
${mindfulnessData}

=== ИМПУЛЬСЫ И СРЫВЫ ===
${impulsesData}

=== ВЫПОЛНЕНИЕ ЗАДАНИЙ ===
${tasksData}

=== ЗАМЕРЫ ===
${measurementsData}

Дай глубокий психологический анализ с конкретными рекомендациями.
```

---

## 💻 5. Реализация Backend

### 5.1 Service: weeklyDataService.ts

```typescript
export const weeklyDataService = {
  async collectWeeklyData(userId: string, weekNumber: number) {
    // Определяем диапазон дат для недели
    const { startDate, endDate } = getWeekDateRange(weekNumber);

    // Собираем все данные параллельно
    const [checkins, mindfulness, impulses, tasks, measurements] =
      await Promise.all([
        getDailyCheckins(userId, startDate, endDate),
        getMindfulnessEntries(userId, startDate, endDate),
        getImpulseLogs(userId, startDate, endDate),
        getTaskCompletions(userId, weekNumber),
        getWeeklyMeasurement(userId, weekNumber)
      ]);

    return {
      checkins,
      mindfulness,
      impulses,
      tasks,
      measurements,
      summary: generateDataSummary(...)  // Статистика
    };
  }
};
```

### 5.2 Service: claudeService.ts

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const claudeService = {
  async analyzeWeeklyBehavior(
    weeklyData: WeeklyData,
    user: User
  ): Promise<PsychologyAnalysis> {

    const systemPrompt = PSYCHOLOGY_SYSTEM_PROMPT;
    const userPrompt = buildUserPrompt(weeklyData, user);

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ]
    });

    const analysisText = response.content[0].text;
    const analysis = JSON.parse(analysisText);

    return analysis;
  }
};
```

### 5.3 Service: aiPsychologistService.ts

```typescript
export const aiPsychologistService = {

  async generateWeeklyAnalysis(userId: string, weekNumber: number) {
    // 1. Собираем данные
    const weeklyData = await weeklyDataService.collectWeeklyData(
      userId,
      weekNumber
    );

    // 2. Проверяем достаточно ли данных
    if (!hasEnoughData(weeklyData)) {
      throw new Error('Недостаточно данных для анализа');
    }

    // 3. Получаем пользователя
    const user = await userService.findById(userId);

    // 4. Генерируем анализ через Claude
    const analysis = await claudeService.analyzeWeeklyBehavior(
      weeklyData,
      user
    );

    // 5. Сохраняем в БД
    const saved = await savePsychologyAnalysis({
      user_id: userId,
      week_number: weekNumber,
      analysis,
      data_summary: weeklyData.summary
    });

    return saved;
  },

  async getAnalysis(userId: string, weekNumber: number) {
    // Проверяем есть ли уже анализ
    const existing = await query(
      'SELECT * FROM psychology_analyses WHERE user_id = $1 AND week_number = $2',
      [userId, weekNumber]
    );

    if (existing.rows[0]) {
      return existing.rows[0];
    }

    // Генерируем новый
    return this.generateWeeklyAnalysis(userId, weekNumber);
  },

  async getAnalysisHistory(userId: string, limit = 10) {
    const result = await query(
      `SELECT * FROM psychology_analyses
       WHERE user_id = $1
       ORDER BY week_number DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  }
};
```

### 5.4 API Routes

```typescript
// GET /api/psychology/analysis/:userId/:weekNumber
router.get('/psychology/analysis/:userId/:weekNumber',
  requireAuth,
  requireSelfOrTrainer,
  async (req: Request, res: Response) => {
    const { userId, weekNumber } = req.params;

    try {
      const analysis = await aiPsychologistService.getAnalysis(
        userId,
        parseInt(weekNumber)
      );

      res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// GET /api/psychology/history/:userId
router.get('/psychology/history/:userId',
  requireAuth,
  requireSelfOrTrainer,
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    const history = await aiPsychologistService.getAnalysisHistory(
      userId,
      limit
    );

    res.json({
      success: true,
      data: history
    });
  }
);

// POST /api/psychology/regenerate/:userId/:weekNumber
// Для тренера - принудительная регенерация анализа
router.post('/psychology/regenerate/:userId/:weekNumber',
  requireAuth,
  trainerOnly,
  async (req: Request, res: Response) => {
    // Удаляем старый анализ и генерируем новый
  }
);
```

---

## 🎨 6. Реализация Frontend

### 6.1 Component: PsychologyInsight.tsx

Компактная карточка на главной странице с кратким инсайтом:

```tsx
export function PsychologyInsight() {
  const { user, courseWeek } = useStore();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAnalysis();
  }, [courseWeek]);

  const loadAnalysis = async () => {
    setLoading(true);
    const data = await api.getPsychologyAnalysis(user.id, courseWeek);
    setAnalysis(data);
    setLoading(false);
  };

  if (!analysis) return null;

  const topInsight = analysis.key_insights[0];

  return (
    <motion.div className="brutal-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🧠</span>
        <h3 className="font-display font-bold text-steel-100 uppercase">
          Психолог
        </h3>
      </div>

      <div className={`border-l-4 pl-3 ${
        topInsight.type === 'warning' ? 'border-neon-magenta' :
        topInsight.type === 'positive' ? 'border-neon-lime' :
        'border-neon-cyan'
      }`}>
        <h4 className="font-display font-bold text-sm mb-1">
          {topInsight.title}
        </h4>
        <p className="text-xs text-steel-400 line-clamp-2">
          {topInsight.description}
        </p>
      </div>

      <Link to="/psychology" className="mt-3 block">
        <button className="w-full brutal-button text-xs py-2">
          Полный анализ →
        </button>
      </Link>
    </motion.div>
  );
}
```

### 6.2 Page: PsychologyPage.tsx

Полная страница с детальным анализом:

```tsx
export default function PsychologyPage() {
  const { user, courseWeek } = useStore();
  const [analysis, setAnalysis] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(courseWeek);
  const [loading, setLoading] = useState(true);

  return (
    <div className="min-h-screen bg-void-100 pb-20">
      {/* Header */}
      <header className="brutal-header">
        <h1>🧠 Психологический анализ</h1>
      </header>

      {/* Week Selector */}
      <section className="px-4 py-4">
        <select value={selectedWeek} onChange={...}>
          <option value={courseWeek}>Текущая неделя ({courseWeek})</option>
          {/* Прошлые недели */}
        </select>
      </section>

      {/* Behavioral Patterns */}
      <section className="px-4 mb-6">
        <h2 className="font-display text-lg mb-3">Паттерны поведения</h2>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(analysis.behavioral_patterns).map(([key, pattern]) => (
            <PatternCard key={key} pattern={pattern} />
          ))}
        </div>
      </section>

      {/* Key Insights */}
      <section className="px-4 mb-6">
        <h2 className="font-display text-lg mb-3">Ключевые инсайты</h2>
        {analysis.key_insights.map((insight, i) => (
          <InsightCard key={i} insight={insight} />
        ))}
      </section>

      {/* Problems & Recommendations */}
      <section className="px-4 mb-6">
        <h2 className="font-display text-lg mb-3">Рекомендации</h2>
        {analysis.recommendations.map((rec, i) => (
          <RecommendationCard key={i} recommendation={rec} />
        ))}
      </section>

      {/* Progress Recognition */}
      <section className="px-4 mb-6">
        <h2 className="font-display text-lg mb-3">Твои победы</h2>
        <div className="brutal-card p-4">
          {analysis.progress_recognition.wins.map((win, i) => (
            <div key={i} className="flex items-start gap-2 mb-2">
              <span className="text-neon-lime">✓</span>
              <p className="text-sm text-steel-300">{win}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
```

---

## 🔧 7. Конфигурация и Environment Variables

### 7.1 Backend .env

```env
# Anthropic Claude API
ANTHROPIC_API_KEY=sk-ant-...

# Настройки AI психолога
AI_PSYCHOLOGIST_ENABLED=true
AI_PSYCHOLOGIST_MODEL=claude-sonnet-4-5-20250929
AI_PSYCHOLOGIST_MAX_TOKENS=4000
AI_PSYCHOLOGIST_TEMPERATURE=0.7

# Минимум данных для анализа
MIN_CHECKINS_FOR_ANALYSIS=3  # минимум 3 чекина за неделю
MIN_MINDFULNESS_FOR_ANALYSIS=2
```

### 7.2 config.ts

```typescript
export const config = {
  // ... existing config

  ai: {
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    psychologist: {
      enabled: process.env.AI_PSYCHOLOGIST_ENABLED === 'true',
      model: process.env.AI_PSYCHOLOGIST_MODEL || 'claude-sonnet-4-5-20250929',
      maxTokens: parseInt(process.env.AI_PSYCHOLOGIST_MAX_TOKENS || '4000'),
      temperature: parseFloat(process.env.AI_PSYCHOLOGIST_TEMPERATURE || '0.7'),
      minCheckinsForAnalysis: parseInt(process.env.MIN_CHECKINS_FOR_ANALYSIS || '3'),
      minMindfulnessForAnalysis: parseInt(process.env.MIN_MINDFULNESS_FOR_ANALYSIS || '2')
    }
  }
};
```

---

## 🧪 8. Тестирование

### 8.1 Unit тесты

```typescript
describe('weeklyDataService', () => {
  it('should collect all weekly data', async () => {
    const data = await weeklyDataService.collectWeeklyData(userId, 1);
    expect(data).toHaveProperty('checkins');
    expect(data).toHaveProperty('mindfulness');
    expect(data).toHaveProperty('impulses');
  });

  it('should throw error if insufficient data', async () => {
    await expect(
      weeklyDataService.collectWeeklyData(emptyUserId, 1)
    ).rejects.toThrow('Недостаточно данных');
  });
});

describe('claudeService', () => {
  it('should return valid JSON analysis', async () => {
    const analysis = await claudeService.analyzeWeeklyBehavior(mockData, mockUser);
    expect(analysis).toHaveProperty('behavioral_patterns');
    expect(analysis).toHaveProperty('recommendations');
  });
});
```

### 8.2 Integration тесты

```typescript
describe('Psychology API', () => {
  it('GET /api/psychology/analysis/:userId/:weekNumber', async () => {
    const response = await request(app)
      .get(`/api/psychology/analysis/${userId}/1`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('analysis');
  });
});
```

---

## 📈 9. Мониторинг и оптимизация

### 9.1 Метрики

- **Latency**: Время генерации анализа (цель: < 10 сек)
- **Cost**: Стоимость API вызовов Claude (мониторинг расходов)
- **Cache hit rate**: % кешированных анализов
- **User satisfaction**: Feedback от пользователей

### 9.2 Кеширование

```typescript
// Кешируем готовый анализ в БД
// Регенерация только по запросу тренера или при появлении новых данных
const CACHE_TTL = 7 * 24 * 60 * 60; // 7 дней
```

### 9.3 Rate Limiting

```typescript
// Ограничение генерации анализов
const RATE_LIMIT = {
  perUser: 5,  // 5 анализов в день на пользователя
  perDay: 1000 // 1000 анализов в день всего
};
```

---

## 🚀 10. План внедрения (поэтапный)

### Phase 1: MVP (Неделя 1)
✅ **Backend**:
- Миграция БД (psychology_analyses)
- weeklyDataService (сбор данных)
- claudeService (базовая интеграция)
- aiPsychologistService (основная логика)
- API endpoints

✅ **Frontend**:
- Базовый компонент PsychologyInsight (карточка)
- API интеграция в store

✅ **Testing**:
- Unit тесты сервисов
- Manual testing с реальными данными

### Phase 2: Enhancement (Неделя 2)
🔧 **Улучшения**:
- Полная страница PsychologyPage
- История анализов
- Улучшенный промпт на основе фидбека
- Error handling & edge cases

### Phase 3: Polish (Неделя 3)
✨ **Доработка**:
- Notifications (новый анализ доступен)
- Export в PDF
- Тренерская панель (просмотр анализов всех участников)
- A/B тесты промптов

---

## 💰 11. Оценка стоимости

### Claude API Pricing (Sonnet 4.5)
- Input: $3 / 1M tokens
- Output: $15 / 1M tokens

### Расчёт на 1 анализ:
- Input prompt: ~2000 tokens (данные недели)
- Output: ~2500 tokens (JSON анализ)
- **Стоимость**: ~$0.04 за анализ

### Месячные расходы (100 пользователей):
- 100 пользователей × 4 анализа/месяц = 400 анализов
- **$16/месяц**

---

## ✅ 12. Чеклист готовности

### Backend
- [ ] Миграция 013_psychology_analyses.sql
- [ ] weeklyDataService.ts
- [ ] claudeService.ts
- [ ] aiPsychologistService.ts
- [ ] API routes добавлены
- [ ] Types обновлены
- [ ] .env переменные настроены
- [ ] Unit тесты написаны

### Frontend
- [ ] PsychologyInsight компонент
- [ ] PsychologyPage страница
- [ ] API клиент обновлён
- [ ] Store расширен
- [ ] Routing добавлен

### DevOps
- [ ] ANTHROPIC_API_KEY в Railway secrets
- [ ] Environment variables настроены
- [ ] Мониторинг API usage

### Documentation
- [ ] API документация
- [ ] Prompt engineering guide
- [ ] User guide (как читать анализ)

---

## 🎯 Критерии успеха

1. ✅ **Функциональность**: Анализ генерируется корректно на основе данных
2. ✅ **UX**: Пользователи находят инсайты полезными и действенными
3. ✅ **Performance**: < 10 сек на генерацию анализа
4. ✅ **Cost**: < $50/месяц на AI для 100+ пользователей
5. ✅ **Quality**: Рекомендации специфичны и применимы

---

## 📝 Примечания

- **Privacy**: Данные не покидают систему, кроме вызовов Claude API (encrypted)
- **Personalization**: Анализ учитывает цель пользователя (похудение vs набор массы)
- **Language**: Весь анализ на русском языке
- **Tone**: Поддерживающий, не осуждающий, мотивирующий

---

**Автор**: Claude Code
**Дата**: 2026-01-06
**Версия**: 1.0
