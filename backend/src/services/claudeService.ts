import { config } from '../config';
import { createAIClient } from './aiClient';
import {
  WeeklyData,
  User,
  PsychologyAnalysis,
  DailyCheckin,
  MindfulnessEntry,
  ImpulseLog,
} from '../types';

/**
 * Сервис для интеграции с AI (Anthropic Claude или OpenRouter)
 *
 * Spec:
 * - Генерирует психологический анализ на основе недельных данных
 * - Использует промпт-инженерию для роли психолога
 * - Возвращает строго типизированный JSON
 * - Обрабатывает ошибки AI
 * - Поддерживает Anthropic API и OpenRouter API
 */

// Инициализация AI клиента (OpenRouter приоритет > Anthropic)
const aiClient = createAIClient();

/**
 * System Prompt для Claude - роль психолога-консультанта
 */
const PSYCHOLOGY_SYSTEM_PROMPT = `Ты — профессиональный психолог-консультант, специализирующийся на поведенческих паттернах в контексте фитнеса и трансформации тела.

ТВОЯ РОЛЬ:
- Анализировать поведенческие данные пользователя за неделю
- Выявлять паттерны, проблемы и их глубинные причины
- Давать практичные, конкретные рекомендации
- Поддерживать мотивацию через признание прогресса

ПРИНЦИПЫ АНАЛИЗА:
1. **Evidence-based**: Каждое утверждение подкрепляй конкретными данными
2. **Compassionate**: Будь эмпатичным, не осуждай. Люди борются с трудностями
3. **Actionable**: Рекомендации должны быть конкретными и выполнимыми
4. **Holistic**: Учитывай взаимосвязь физического и эмоционального
5. **Growth-oriented**: Фокусируйся на развитии, а не на неудачах

ФОРМАТ ОТВЕТА:
Строго JSON структура (без markdown блоков, без комментариев):
{
  "behavioral_patterns": {
    "consistency": { "score": 1-10, "observation": "...", "evidence": [...] },
    "sleep": { "score": 1-10, "observation": "...", "evidence": [...] },
    "nutrition": { "score": 1-10, "observation": "...", "evidence": [...] },
    "emotional_state": { "score": 1-10, "observation": "...", "evidence": [...] },
    "stress_management": { "score": 1-10, "observation": "...", "evidence": [...] },
    "discipline": { "score": 1-10, "observation": "...", "evidence": [...] }
  },
  "key_insights": [
    {
      "type": "warning" | "positive" | "neutral",
      "title": "Краткий заголовок",
      "description": "Подробное описание инсайта",
      "priority": "high" | "medium" | "low"
    }
  ],
  "identified_problems": [
    {
      "problem": "Что именно является проблемой",
      "root_cause": "Глубинная причина",
      "impact": "Как это влияет на прогресс",
      "evidence": ["Конкретные данные"]
    }
  ],
  "recommendations": [
    {
      "category": "sleep" | "nutrition" | "training" | "mindset" | "stress" | "recovery",
      "priority": "high" | "medium" | "low",
      "action": "Что нужно сделать",
      "why": "Почему это важно",
      "how": ["Конкретные шаги"],
      "expected_result": "Ожидаемый результат"
    }
  ],
  "progress_recognition": {
    "wins": ["Успех 1", "Успех 2"],
    "growth_areas": ["Область роста 1", "Область роста 2"]
  },
  "next_week_focus": ["Фокус 1", "Фокус 2", "Фокус 3"]
}

ВАЖНО:
- Ищи связи между данными (плохой сон → плохое настроение → импульсы)
- Обращай внимание на отклонения от паттерна (почему в среду был срыв?)
- Признавай успехи, даже маленькие
- Рекомендации должны быть SMART (конкретные, измеримые, достижимые)
- Пиши на русском языке, дружелюбно но профессионально
- Используй "ты" обращение, будь как наставник-друг`;

/**
 * Форматирует чекины для промпта
 */
function formatCheckins(checkins: DailyCheckin[]): string {
  if (checkins.length === 0) return 'Нет чекинов';

  return checkins.map(c => {
    const date = new Date(c.date).toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });
    const workout = c.workout ? `✓ ${c.workout_type || 'тренировка'}` : '✗ нет тренировки';
    const nutrition = c.nutrition ? '✓ питание' : '✗ питание';
    const water = c.water ? `✓ вода ${c.water_liters || '?'}л` : '✗ вода';
    const sleep = `сон: ${c.sleep_hours}ч`;
    const mood = `настроение: ${c.mood}/5`;
    const steps = c.steps ? `шаги: ${c.steps}` : '';

    return `${date}: ${workout}, ${nutrition}, ${water}, ${sleep}, ${mood}${steps ? ', ' + steps : ''}`;
  }).join('\n');
}

/**
 * Форматирует дневник осознанности для промпта
 */
function formatMindfulness(entries: MindfulnessEntry[]): string {
  if (entries.length === 0) return 'Нет записей в дневнике';

  return entries.map(e => {
    const date = new Date(e.date).toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric' });
    const parts: string[] = [];

    if (e.gratitude) parts.push(`Благодарность: "${e.gratitude}"`);
    if (e.wins) parts.push(`Победы: "${e.wins}"`);
    if (e.challenges) parts.push(`Трудности: "${e.challenges}"`);
    if (e.lessons) parts.push(`Уроки: "${e.lessons}"`);
    if (e.mood_note) parts.push(`Настроение: "${e.mood_note}"`);

    return `${date}:\n${parts.join('\n')}`;
  }).join('\n\n');
}

/**
 * Форматирует импульсы для промпта
 */
function formatImpulses(impulses: ImpulseLog[]): string {
  if (impulses.length === 0) return 'Нет зарегистрированных импульсов (отлично!)';

  return impulses.map(i => {
    const date = new Date(i.logged_at).toLocaleDateString('ru-RU', {
      weekday: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const triggerLabels: Record<string, string> = {
      stress: 'стресс',
      boredom: 'скука',
      social: 'социальное давление',
      emotional: 'эмоции',
      habitual: 'привычка'
    };

    const actionLabels: Record<string, string> = {
      resisted: 'устоял ✓',
      gave_in: 'сдался ✗',
      alternative: 'нашёл альтернативу ✓'
    };

    const trigger = triggerLabels[i.trigger_type] || i.trigger_type;
    const action = actionLabels[i.action_taken] || i.action_taken;
    const notes = i.notes ? ` - "${i.notes}"` : '';

    return `${date}: Триггер: ${trigger}, Интенсивность: ${i.intensity}/10, Действие: ${action}${notes}`;
  }).join('\n');
}

/**
 * Формирует User Prompt с данными недели
 */
function buildUserPrompt(weeklyData: WeeklyData, user: User): string {
  const goalLabel = user.goal === 'weight_loss' ? '🔥 Похудение' : '💪 Набор массы';
  const userName = user.first_name;

  const { summary } = weeklyData;

  let prompt = `Проанализируй неделю пользователя ${userName}.

ЦЕЛЬ: ${goalLabel}

=== СТАТИСТИКА НЕДЕЛИ ===
• Чекины: ${summary.total_checkins}/7 дней
• Тренировки: ${summary.total_workouts} раз
• Средний сон: ${summary.avg_sleep_hours} часов
• Среднее настроение: ${summary.avg_mood}/5
• Приверженность питанию: ${summary.nutrition_adherence}%
• Вода: ${summary.avg_water_liters} л/день
• Импульсы: ${summary.total_impulses} (устоял: ${summary.impulses_resisted}, сдался: ${summary.impulses_gave_in})
• Задания: ${summary.tasks_completed}/${summary.tasks_total} выполнено
• Дневник осознанности: ${summary.mindfulness_entries} записей
`;

  if (summary.weight_change !== undefined) {
    const change = summary.weight_change > 0 ? `+${summary.weight_change}` : summary.weight_change;
    prompt += `• Изменение веса: ${change} кг\n`;
  }

  prompt += `\n=== ЕЖЕДНЕВНЫЕ ЧЕКИНЫ ===\n${formatCheckins(weeklyData.checkins)}\n`;
  prompt += `\n=== ДНЕВНИК ОСОЗНАННОСТИ ===\n${formatMindfulness(weeklyData.mindfulness)}\n`;
  prompt += `\n=== ИМПУЛЬСЫ И СРЫВЫ ===\n${formatImpulses(weeklyData.impulses)}\n`;

  if (weeklyData.tasks.available.length > 0) {
    const tasksList = weeklyData.tasks.available.map(t => `- ${t.title}`).join('\n');
    const completedIds = new Set(weeklyData.tasks.completed.map(c => c.task_id));
    const completedList = weeklyData.tasks.available
      .filter(t => completedIds.has(t.id))
      .map(t => `✓ ${t.title}`)
      .join('\n');

    prompt += `\n=== ЗАДАНИЯ НЕДЕЛИ ===\nДоступно:\n${tasksList}\n\nВыполнено:\n${completedList || 'Ничего'}\n`;
  }

  if (weeklyData.measurement) {
    const m = weeklyData.measurement;
    prompt += `\n=== ЗАМЕРЫ ===\nВес: ${m.weight} кг`;

    if (weeklyData.previous_measurement && summary.weight_change !== undefined) {
      prompt += ` (${summary.weight_change > 0 ? '+' : ''}${summary.weight_change} кг)`;
    }

    if (m.chest) prompt += `\nГрудь: ${m.chest} см`;
    if (m.waist) prompt += `\nТалия: ${m.waist} см`;
    if (m.hips) prompt += `\nБёдра: ${m.hips} см`;

    prompt += '\n';
  }

  prompt += `\nДай глубокий психологический анализ с конкретными рекомендациями.`;

  return prompt;
}

/**
 * Парсит JSON ответ от Claude, обрабатывая возможные markdown блоки
 */
function parseAIResponse(responseText: string): PsychologyAnalysis {
  // Удаляем возможные markdown блоки
  let cleanedText = responseText.trim();

  // Если ответ обёрнут в ```json ... ```, извлекаем содержимое
  const jsonBlockMatch = cleanedText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (jsonBlockMatch) {
    cleanedText = jsonBlockMatch[1].trim();
  }

  try {
    const parsed = JSON.parse(cleanedText);
    return parsed as PsychologyAnalysis;
  } catch (error) {
    console.error('Failed to parse AI response:', responseText);
    throw new Error(`Invalid JSON response from AI: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Основной экспорт: сервис для работы с Claude AI
 */
export const claudeService = {
  /**
   * Проверяет доступность API
   */
  isAvailable(): boolean {
    return !!aiClient && !!config.ai?.psychologist?.enabled;
  },

  /**
   * Генерирует психологический анализ на основе недельных данных
   *
   * @param weeklyData - Данные пользователя за неделю
   * @param user - Информация о пользователе
   * @returns Психологический анализ
   * @throws Error если API недоступен или произошла ошибка
   */
  async analyzeWeeklyBehavior(
    weeklyData: WeeklyData,
    user: User
  ): Promise<PsychologyAnalysis> {
    if (!this.isAvailable()) {
      throw new Error('AI is not configured or disabled');
    }

    if (!aiClient) {
      throw new Error('AI client is not initialized');
    }

    const systemPrompt = PSYCHOLOGY_SYSTEM_PROMPT;
    const userPrompt = buildUserPrompt(weeklyData, user);

    const provider = config.ai!.openrouterApiKey ? 'OpenRouter' : 'Anthropic';
    console.log(`Generating psychology analysis via ${provider} API...`);
    console.log('Model:', config.ai!.psychologist!.model);
    console.log('Max tokens:', config.ai!.psychologist!.maxTokens);

    try {
      const response = await aiClient.messages.create({
        model: config.ai!.psychologist!.model!,
        max_tokens: config.ai!.psychologist!.maxTokens!,
        temperature: config.ai!.psychologist!.temperature,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ]
      });

      // Извлекаем текст ответа
      const firstContent = response.content[0];
      if (firstContent.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      const analysisText = firstContent.text;
      console.log('Claude API response received, parsing...');

      // Парсим JSON
      const analysis = parseAIResponse(analysisText);

      console.log('Psychology analysis generated successfully');
      return analysis;

    } catch (error) {
      console.error('AI API error:', error);
      throw error;
    }
  },

  /**
   * Тестовый метод для проверки подключения к API
   */
  async healthCheck(): Promise<{ ok: boolean; model?: string; provider?: string; error?: string }> {
    if (!this.isAvailable()) {
      return {
        ok: false,
        error: 'AI is not configured or disabled'
      };
    }

    try {
      if (!aiClient) throw new Error('Client not initialized');

      const response = await aiClient.messages.create({
        model: config.ai!.psychologist!.model!,
        max_tokens: 50,
        messages: [
          { role: 'user', content: 'Ответь просто: "OK"' }
        ]
      });

      const provider = config.ai!.openrouterApiKey ? 'OpenRouter' : 'Anthropic';

      return {
        ok: true,
        model: config.ai!.psychologist!.model,
        provider
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};
