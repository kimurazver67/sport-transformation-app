import { CronJob } from 'cron';
import { userService } from './userService';
import { statsService } from './statsService';
import { achievementService } from './achievementService';
import { googleSheetsService } from './googleSheetsService';
import { measurementService } from './measurementService';
import { progressBonusService } from './progressBonusService';
import { sendReminder, broadcastMessage, sendMeasurementReminder } from '../bot';
import { getCurrentWeek, isMeasurementDay, isCourseStarted } from '../config';
import { adminNotifier } from './adminNotifierService';

class SchedulerService {
  private jobs: CronJob[] = [];

  start() {
    console.log('🕐 Запуск планировщика задач...');

    // Ежедневное напоминание о чекине в 20:00
    this.jobs.push(
      new CronJob(
        '0 20 * * *', // 20:00 каждый день
        () => this.sendDailyCheckinReminder(20),
        null,
        true,
        'Europe/Moscow'
      )
    );

    // Второе напоминание о чекине в 22:00 (более настойчивое)
    this.jobs.push(
      new CronJob(
        '0 22 * * *', // 22:00 каждый день
        () => this.sendDailyCheckinReminder(22),
        null,
        true,
        'Europe/Moscow'
      )
    );

    // Воскресенье - ежечасные напоминания о замерах (6:00, 7:00, 8:00, 9:00)
    // Напоминания только в окне замеров
    this.jobs.push(
      new CronJob(
        '0 6 * * 0', // 6:00 каждое воскресенье
        () => this.sendMeasurementReminderHourly(6),
        null,
        true,
        'Europe/Moscow'
      )
    );

    this.jobs.push(
      new CronJob(
        '0 7 * * 0', // 7:00 каждое воскресенье
        () => this.sendMeasurementReminderHourly(7),
        null,
        true,
        'Europe/Moscow'
      )
    );

    this.jobs.push(
      new CronJob(
        '0 8 * * 0', // 8:00 каждое воскресенье
        () => this.sendMeasurementReminderHourly(8),
        null,
        true,
        'Europe/Moscow'
      )
    );

    this.jobs.push(
      new CronJob(
        '0 9 * * 0', // 9:00 каждое воскресенье
        () => this.sendMeasurementReminderHourly(9),
        null,
        true,
        'Europe/Moscow'
      )
    );

    // Воскресенье 10:05 - проверка кто не внёс замеры и нажал "Внёс"
    this.jobs.push(
      new CronJob(
        '5 10 * * 0', // 10:05 каждое воскресенье
        () => this.checkMeasurementLiars(),
        null,
        true,
        'Europe/Moscow'
      )
    );

    // Воскресенье 12:00 - начисление бонусов за еженедельный прогресс
    this.jobs.push(
      new CronJob(
        '0 12 * * 0', // 12:00 каждое воскресенье
        () => this.awardWeeklyProgressBonuses(),
        null,
        true,
        'Europe/Moscow'
      )
    );

    // Понедельник 12:00 - уведомление о новых заданиях
    this.jobs.push(
      new CronJob(
        '0 12 * * 1', // 12:00 каждый понедельник
        () => this.sendNewTasksNotification(),
        null,
        true,
        'Europe/Moscow'
      )
    );

    // Понедельник 00:01 - сброс недельных очков и награждение лидера
    this.jobs.push(
      new CronJob(
        '1 0 * * 1', // 00:01 каждый понедельник
        () => this.weeklyReset(),
        null,
        true,
        'Europe/Moscow'
      )
    );

    // Синхронизация с Google Sheets каждые 30 минут
    this.jobs.push(
      new CronJob(
        '*/30 * * * *', // каждые 30 минут
        () => this.syncGoogleSheets(),
        null,
        true,
        'Europe/Moscow'
      )
    );

    console.log('✅ Планировщик запущен. Активных задач:', this.jobs.length);
  }

  stop() {
    this.jobs.forEach(job => job.stop());
    this.jobs = [];
    console.log('🛑 Планировщик остановлен');
  }

  // Напоминание о чекине (20:00 и 22:00)
  private async sendDailyCheckinReminder(hour: number) {
    console.log(`📬 [${hour}:00] Отправка напоминаний о чекине...`);

    try {
      const usersWithoutCheckin = await userService.getWithoutCheckinToday();

      // Разный текст в зависимости от времени
      const message = hour >= 22
        ? `🚨 *Последний шанс на чекин!*

До конца дня осталось совсем немного.

Не пропусти чекин сегодня:
✅ Тренировка
🥗 Питание
💧 Вода
😴 Сон

Открой приложение и отметь за 30 секунд! ⚡`
        : `⏰ *Напоминание о чекине*

Не забудь отметить сегодняшний день:
✅ Тренировка
🥗 Питание
💧 Вода
😴 Сон

Это займёт всего минуту! 💪`;

      let sent = 0;
      for (const user of usersWithoutCheckin) {
        const success = await sendReminder(user.telegram_id, message);
        if (success) sent++;
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`✅ [${hour}:00] Отправлено напоминаний: ${sent}/${usersWithoutCheckin.length}`);
    } catch (error) {
      console.error('Ошибка при отправке напоминаний о чекине:', error);
    }
  }

  // Ежечасные напоминания о замерах (воскресенье 6:00-9:00)
  private async sendMeasurementReminderHourly(hour: number) {
    // Если курс ещё не начался — не отправляем
    if (!isCourseStarted()) {
      console.log(`⏭️ Курс не начался — пропускаем напоминание о замерах`);
      return;
    }

    console.log(`📬 [${hour}:00] Отправка напоминаний о замерах...`);

    try {
      const weekNumber = getCurrentWeek();
      const usersWithoutMeasurement = await userService.getWithoutMeasurementThisWeek(weekNumber);

      const hoursLeft = 10 - hour;
      const urgency = hour >= 9 ? '🚨 ПОСЛЕДНИЙ ЧАС!' : hour >= 8 ? '⚠️ Осталось мало времени!' : '';

      let sent = 0;
      for (const user of usersWithoutMeasurement) {
        const success = await sendMeasurementReminder(user.telegram_id, weekNumber, hoursLeft, urgency);
        if (success) sent++;
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`✅ [${hour}:00] Отправлено напоминаний: ${sent}/${usersWithoutMeasurement.length}`);
    } catch (error) {
      console.error('Ошибка при отправке напоминаний о замерах:', error);
    }
  }

  // Проверка кто нажал "Внёс" но не внёс замеры
  private async checkMeasurementLiars() {
    // Если курс ещё не начался — не проверяем
    if (!isCourseStarted()) return;

    console.log('🔍 Проверка кто не внёс замеры после обещания...');

    try {
      const weekNumber = getCurrentWeek();
      const liars = await measurementService.getLiars(weekNumber);

      for (const user of liars) {
        const message = `😤 *${user.first_name}, ты обманул!*

Ты нажал "Внёс замеры", но на самом деле данных нет.

Окно замеров закрылось, но я даю тебе *ещё один шанс*.

⚠️ Внеси замеры прямо сейчас, иначе неделя будет без прогресса!`;

        await sendMeasurementReminder(user.telegram_id, weekNumber, 0, '🚨 ПОСЛЕДНИЙ ШАНС!');
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Сбрасываем флаги "claimed" у тех, кто так и не внёс
      await measurementService.resetClaimedFlags(weekNumber);

      console.log(`✅ Проверено обманщиков: ${liars.length}`);
    } catch (error) {
      console.error('Ошибка при проверке обманщиков:', error);
    }
  }

  // Старый метод для совместимости (можно удалить)
  private async sendMeasurementReminder() {
    await this.sendMeasurementReminderHourly(10);
  }

  // Уведомление о новых заданиях (понедельник 12:00)
  private async sendNewTasksNotification() {
    console.log('📬 Отправка уведомления о новых заданиях...');

    try {
      const weekNumber = getCurrentWeek();

      const message = `📋 *Новые задания недели ${weekNumber}*

Доступны новые задания от тренера!

Открой приложение, чтобы посмотреть чеклист и отметить выполнение.

Успехов на этой неделе! 🎯`;

      const result = await broadcastMessage(message, 'participant');
      console.log(`✅ Уведомления отправлены: ${result.sent}, ошибок: ${result.failed}`);
    } catch (error) {
      console.error('Ошибка при отправке уведомлений о заданиях:', error);
    }
  }

  // Сброс недельных очков (понедельник 00:01)
  private async weeklyReset() {
    console.log('🔄 Еженедельный сброс...');

    try {
      // Награждаем лидера недели
      const achievement = await achievementService.unlockWeekLeader();
      if (achievement) {
        console.log('🏆 Награждён лидер недели');
      }

      // Сбрасываем недельные очки
      await statsService.resetWeeklyPoints();
      console.log('✅ Недельные очки сброшены');
    } catch (error) {
      console.error('Ошибка при еженедельном сбросе:', error);
    }
  }

  // Начисление бонусов за еженедельный прогресс (воскресенье 12:00)
  private async awardWeeklyProgressBonuses() {
    if (!isCourseStarted()) {
      console.log('⏭️ Курс не начался — пропускаем начисление бонусов за прогресс');
      return;
    }

    console.log('🏆 Начисление бонусов за еженедельный прогресс...');

    try {
      const currentWeek = getCurrentWeek();
      const result = await progressBonusService.awardProgressBonuses(currentWeek);

      console.log(`✅ Бонусы за прогресс начислены: ${result.awarded} участников, ${result.totalPoints} очков`);

      // Отправляем отчёт тренеру
      if (result.awarded > 0) {
        const detailsText = result.details
          .sort((a, b) => b.percent - a.percent)
          .map((d, i) => `${i + 1}. ${d.name}: ${d.percent.toFixed(1)}% → +${d.points} очков (${d.tier})`)
          .join('\n');

        await adminNotifier.sendToAdmin(
          `🏆 *Бонусы за прогресс недели ${currentWeek}*\n\n` +
          `Награждено: ${result.awarded} участников\n` +
          `Всего очков: ${result.totalPoints}\n\n` +
          `📊 *Детали:*\n${detailsText}`
        );
      }
    } catch (error) {
      console.error('Ошибка при начислении бонусов за прогресс:', error);
    }
  }

  // Синхронизация с Google Sheets
  private async syncGoogleSheets() {
    if (!googleSheetsService.isEnabled()) return;

    console.log('📊 Синхронизация с Google Sheets...');

    try {
      await googleSheetsService.syncAll();
      console.log('✅ Синхронизация завершена');
    } catch (error) {
      console.error('Ошибка синхронизации с Google Sheets:', error);
    }
  }
}

export const schedulerService = new SchedulerService();
