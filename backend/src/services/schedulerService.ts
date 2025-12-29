import { CronJob } from 'cron';
import { userService } from './userService';
import { statsService } from './statsService';
import { achievementService } from './achievementService';
import { googleSheetsService } from './googleSheetsService';
import { sendReminder, broadcastMessage } from '../bot';
import { getCurrentWeek, isMeasurementDay } from '../config';

class SchedulerService {
  private jobs: CronJob[] = [];

  start() {
    console.log('🕐 Запуск планировщика задач...');

    // Ежедневное напоминание о чекине в 20:00
    this.jobs.push(
      new CronJob(
        '0 20 * * *', // 20:00 каждый день
        () => this.sendDailyCheckinReminder(),
        null,
        true,
        'Europe/Moscow'
      )
    );

    // Воскресенье 10:00 - напоминание о замерах
    this.jobs.push(
      new CronJob(
        '0 10 * * 0', // 10:00 каждое воскресенье
        () => this.sendMeasurementReminder(),
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

  // Напоминание о чекине (20:00)
  private async sendDailyCheckinReminder() {
    console.log('📬 Отправка напоминаний о чекине...');

    try {
      const usersWithoutCheckin = await userService.getWithoutCheckinToday();

      const message = `⏰ *Напоминание о чекине*

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

      console.log(`✅ Отправлено напоминаний: ${sent}/${usersWithoutCheckin.length}`);
    } catch (error) {
      console.error('Ошибка при отправке напоминаний о чекине:', error);
    }
  }

  // Напоминание о замерах (воскресенье 10:00)
  private async sendMeasurementReminder() {
    console.log('📬 Отправка напоминаний о замерах...');

    try {
      const weekNumber = getCurrentWeek();
      const usersWithoutMeasurement = await userService.getWithoutMeasurementThisWeek(weekNumber);

      const message = `📏 *Пора внести замеры недели ${weekNumber}!*

Сегодня воскресенье — день взвешивания и обхватов.

Что нужно записать:
⚖️ Вес
📐 Обхваты (грудь, талия, бёдра, бицепсы, бёдра)
📸 3 фото прогресса (фронт, бок, спина)

Открой приложение и внеси данные!`;

      let sent = 0;
      for (const user of usersWithoutMeasurement) {
        const success = await sendReminder(user.telegram_id, message);
        if (success) sent++;
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`✅ Отправлено напоминаний о замерах: ${sent}/${usersWithoutMeasurement.length}`);
    } catch (error) {
      console.error('Ошибка при отправке напоминаний о замерах:', error);
    }
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
