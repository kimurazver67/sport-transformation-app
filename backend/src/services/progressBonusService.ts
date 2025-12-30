import { query } from '../db/postgres';
import { PROGRESS_TIERS } from '../types';
import { statsService } from './statsService';
import { userService } from './userService';
import { sendReminder } from '../bot';

interface WeeklyProgress {
  userId: string;
  telegramId: number;
  firstName: string;
  prevWeekWeight: number;
  currentWeekWeight: number;
  weightChangePercent: number;
  prevWeekVolume: number;
  currentWeekVolume: number;
  volumeChangePercent: number;
  // Абсолютное значение общего изменения (берём максимальное из двух)
  totalProgressPercent: number;
}

interface ProgressTier {
  minPercent: number;
  points: number;
  label: string;
  emoji: string;
}

export const progressBonusService = {
  /**
   * Рассчитать прогресс для всех участников за последнюю неделю
   */
  async calculateWeeklyProgress(currentWeek: number): Promise<WeeklyProgress[]> {
    if (currentWeek < 2) return []; // Нужно минимум 2 недели для сравнения

    const prevWeek = currentWeek - 1;

    // Получаем замеры за текущую и предыдущую неделю для всех участников
    const result = await query<{
      user_id: string;
      telegram_id: number;
      first_name: string;
      prev_weight: string | null;
      curr_weight: string | null;
      prev_chest: string | null;
      curr_chest: string | null;
      prev_waist: string | null;
      curr_waist: string | null;
      prev_hips: string | null;
      curr_hips: string | null;
      prev_bicep_left: string | null;
      curr_bicep_left: string | null;
      prev_bicep_right: string | null;
      curr_bicep_right: string | null;
      prev_thigh_left: string | null;
      curr_thigh_left: string | null;
      prev_thigh_right: string | null;
      curr_thigh_right: string | null;
    }>(`
      SELECT
        u.id as user_id,
        u.telegram_id,
        u.first_name,
        prev.weight as prev_weight,
        curr.weight as curr_weight,
        prev.chest as prev_chest,
        curr.chest as curr_chest,
        prev.waist as prev_waist,
        curr.waist as curr_waist,
        prev.hips as prev_hips,
        curr.hips as curr_hips,
        prev.bicep_left as prev_bicep_left,
        curr.bicep_left as curr_bicep_left,
        prev.bicep_right as prev_bicep_right,
        curr.bicep_right as curr_bicep_right,
        prev.thigh_left as prev_thigh_left,
        curr.thigh_left as curr_thigh_left,
        prev.thigh_right as prev_thigh_right,
        curr.thigh_right as curr_thigh_right
      FROM users u
      JOIN weekly_measurements prev ON prev.user_id = u.id AND prev.week_number = $1
      JOIN weekly_measurements curr ON curr.user_id = u.id AND curr.week_number = $2
      WHERE u.role = 'participant'
    `, [prevWeek, currentWeek]);

    const progressList: WeeklyProgress[] = [];

    for (const row of result.rows) {
      const prevWeight = parseFloat(row.prev_weight || '0');
      const currWeight = parseFloat(row.curr_weight || '0');

      // Рассчитываем объёмы (сумма всех измерений)
      const prevVolume = this.calculateVolume({
        chest: row.prev_chest,
        waist: row.prev_waist,
        hips: row.prev_hips,
        bicep_left: row.prev_bicep_left,
        bicep_right: row.prev_bicep_right,
        thigh_left: row.prev_thigh_left,
        thigh_right: row.prev_thigh_right,
      });

      const currVolume = this.calculateVolume({
        chest: row.curr_chest,
        waist: row.curr_waist,
        hips: row.curr_hips,
        bicep_left: row.curr_bicep_left,
        bicep_right: row.curr_bicep_right,
        thigh_left: row.curr_thigh_left,
        thigh_right: row.curr_thigh_right,
      });

      // Процент изменения (абсолютное значение - и похудение, и набор считаются прогрессом)
      const weightChangePercent = prevWeight > 0
        ? Math.abs((currWeight - prevWeight) / prevWeight) * 100
        : 0;

      const volumeChangePercent = prevVolume > 0
        ? Math.abs((currVolume - prevVolume) / prevVolume) * 100
        : 0;

      // Берём максимальное изменение из двух как общий прогресс
      const totalProgressPercent = Math.max(weightChangePercent, volumeChangePercent);

      if (totalProgressPercent > 0) {
        progressList.push({
          userId: row.user_id,
          telegramId: row.telegram_id,
          firstName: row.first_name,
          prevWeekWeight: prevWeight,
          currentWeekWeight: currWeight,
          weightChangePercent,
          prevWeekVolume: prevVolume,
          currentWeekVolume: currVolume,
          volumeChangePercent,
          totalProgressPercent,
        });
      }
    }

    return progressList;
  },

  /**
   * Рассчитать сумму объёмов тела
   */
  calculateVolume(measurements: Record<string, string | null>): number {
    let total = 0;
    for (const key of Object.keys(measurements)) {
      const value = parseFloat(measurements[key] || '0');
      if (!isNaN(value) && value > 0) {
        total += value;
      }
    }
    return total;
  },

  /**
   * Определить уровень прогресса и количество очков
   */
  getProgressTier(progressPercent: number): ProgressTier | null {
    for (const tier of PROGRESS_TIERS) {
      if (progressPercent >= tier.minPercent) {
        return tier;
      }
    }
    return null;
  },

  /**
   * Начислить бонусные очки за прогресс всем участникам
   */
  async awardProgressBonuses(currentWeek: number): Promise<{
    awarded: number;
    totalPoints: number;
    details: Array<{ name: string; percent: number; points: number; tier: string }>;
  }> {
    const progressList = await this.calculateWeeklyProgress(currentWeek);

    let awarded = 0;
    let totalPoints = 0;
    const details: Array<{ name: string; percent: number; points: number; tier: string }> = [];

    for (const progress of progressList) {
      const tier = this.getProgressTier(progress.totalProgressPercent);

      if (tier) {
        // Начисляем очки
        await statsService.addPoints(progress.userId, tier.points);

        // Отправляем уведомление пользователю
        const weightDirection = progress.currentWeekWeight > progress.prevWeekWeight ? '+' : '';
        const weightChange = (progress.currentWeekWeight - progress.prevWeekWeight).toFixed(1);

        const message = `${tier.emoji} *${tier.label}*

За эту неделю ты показал отличный результат!

📊 Изменение: ${progress.totalProgressPercent.toFixed(1)}%
⚖️ Вес: ${progress.prevWeekWeight.toFixed(1)} → ${progress.currentWeekWeight.toFixed(1)} кг (${weightDirection}${weightChange})

🎁 *+${tier.points} бонусных очков!*

Продолжай в том же духе! 💪`;

        await sendReminder(progress.telegramId, message);

        awarded++;
        totalPoints += tier.points;
        details.push({
          name: progress.firstName,
          percent: progress.totalProgressPercent,
          points: tier.points,
          tier: tier.label,
        });

        // Небольшая задержка между сообщениями
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return { awarded, totalPoints, details };
  },
};
