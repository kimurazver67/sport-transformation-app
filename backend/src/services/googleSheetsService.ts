import { google } from 'googleapis';
import { config, getCurrentWeek } from '../config';
import { userService } from './userService';
import { checkinService } from './checkinService';
import { measurementService } from './measurementService';
import { statsService } from './statsService';
import { taskService } from './taskService';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

class GoogleSheetsService {
  private sheets: any;
  private auth: any;

  constructor() {
    this.initAuth();
  }

  private async initAuth() {
    if (!config.google.serviceAccountEmail || !config.google.privateKey) {
      console.log('Google Sheets integration disabled: missing credentials');
      return;
    }

    try {
      this.auth = new google.auth.JWT(
        config.google.serviceAccountEmail,
        undefined,
        config.google.privateKey,
        SCOPES
      );

      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      console.log('Google Sheets API initialized');
    } catch (error) {
      console.error('Failed to initialize Google Sheets:', error);
    }
  }

  isEnabled(): boolean {
    return !!this.sheets && !!config.google.spreadsheetId;
  }

  getSpreadsheetUrl(): string | null {
    if (!config.google.spreadsheetId) return null;
    return `https://docs.google.com/spreadsheets/d/${config.google.spreadsheetId}`;
  }

  // Синхронизация всех данных
  async syncAll(): Promise<void> {
    if (!this.isEnabled()) {
      throw new Error('Google Sheets integration not configured');
    }

    await this.syncParticipants();
    await this.syncMeasurements();
    await this.syncCheckins();
    await this.syncLeaderboard();
    await this.syncTasks();
  }

  // Синхронизация участников
  async syncParticipants(): Promise<void> {
    const participants = await userService.getAllParticipants();

    const rows = [['Telegram ID', 'Имя', 'Дата старта', 'Вес старт', 'Вес текущий', 'Изменение', 'Streak', 'Очки']];

    for (const p of participants) {
      const stats = await statsService.getUserStats(p.id);
      const comparison = await measurementService.getProgressComparison(p.id);

      rows.push([
        p.telegram_id.toString(),
        `${p.first_name} ${p.last_name || ''}`.trim(),
        new Date(p.created_at).toLocaleDateString('ru-RU'),
        comparison.start?.weight?.toString() || '-',
        comparison.current?.weight?.toString() || '-',
        comparison.weightChange !== null ? `${comparison.weightChange > 0 ? '+' : ''}${comparison.weightChange.toFixed(1)}` : '-',
        stats?.current_streak?.toString() || '0',
        stats?.total_points?.toString() || '0',
      ]);
    }

    await this.updateSheet('Участники', rows);
  }

  // Синхронизация замеров
  async syncMeasurements(): Promise<void> {
    const participants = await userService.getAllParticipants();

    const rows = [['Дата', 'Участник', 'Неделя', 'Вес', 'Грудь', 'Талия', 'Бёдра', 'Бицепс Л', 'Бицепс П', 'Бедро Л', 'Бедро П', '% жира', 'Ссылки на фото']];

    for (const p of participants) {
      const measurements = await measurementService.getAllByUser(p.id);

      for (const m of measurements) {
        const photos = [m.photo_front_file_id, m.photo_side_file_id, m.photo_back_file_id]
          .filter(Boolean)
          .map(id => `tg://file_id/${id}`)
          .join('\n');

        rows.push([
          new Date(m.date).toLocaleDateString('ru-RU'),
          `${p.first_name} ${p.last_name || ''}`.trim(),
          m.week_number.toString(),
          m.weight.toString(),
          m.chest?.toString() || '-',
          m.waist?.toString() || '-',
          m.hips?.toString() || '-',
          m.bicep_left?.toString() || '-',
          m.bicep_right?.toString() || '-',
          m.thigh_left?.toString() || '-',
          m.thigh_right?.toString() || '-',
          m.body_fat_percent?.toString() || '-',
          photos || '-',
        ]);
      }
    }

    await this.updateSheet('Еженедельные замеры', rows);
  }

  // Синхронизация чекинов
  async syncCheckins(): Promise<void> {
    const participants = await userService.getAllParticipants();

    const rows = [['Дата', 'Участник', 'Тренировка', 'Тип', 'Питание', 'Вода', 'Сон', 'Самочувствие']];

    const workoutTypes: Record<string, string> = {
      strength: 'Силовая',
      cardio: 'Кардио',
      rest: 'Отдых',
    };

    const moodEmojis = ['😢', '😕', '😐', '🙂', '😃'];

    for (const p of participants) {
      const checkins = await checkinService.getAllByUser(p.id);

      for (const c of checkins) {
        rows.push([
          new Date(c.date).toLocaleDateString('ru-RU'),
          `${p.first_name} ${p.last_name || ''}`.trim(),
          c.workout ? 'Да' : 'Нет',
          c.workout_type ? workoutTypes[c.workout_type] : '-',
          c.nutrition ? 'Да' : 'Нет',
          c.water ? 'Да' : 'Нет',
          `${c.sleep_hours} ч`,
          moodEmojis[c.mood - 1] || c.mood.toString(),
        ]);
      }
    }

    await this.updateSheet('Ежедневные чекины', rows);
  }

  // Синхронизация рейтинга
  async syncLeaderboard(): Promise<void> {
    const leaderboard = await statsService.getLeaderboard(100);

    const rows = [['Место', 'Участник', 'Очки за неделю', 'Очки всего', 'Streak']];

    leaderboard.forEach((entry, index) => {
      rows.push([
        (index + 1).toString(),
        `${entry.user.first_name} ${entry.user.last_name || ''}`.trim(),
        entry.weekly_points.toString(),
        entry.total_points.toString(),
        entry.current_streak.toString(),
      ]);
    });

    await this.updateSheet('Рейтинг', rows);
  }

  // Синхронизация заданий
  async syncTasks(): Promise<void> {
    const participants = await userService.getAllParticipants();
    const currentWeek = getCurrentWeek();

    const rows = [['Неделя', 'Задание', 'Участник', 'Выполнено', 'Дата выполнения']];

    // Для каждой недели до текущей
    for (let week = 1; week <= currentWeek; week++) {
      for (const p of participants) {
        const tasks = await taskService.getTasksWithProgress(p.id, week);

        for (const task of tasks) {
          rows.push([
            week.toString(),
            task.title,
            `${p.first_name} ${p.last_name || ''}`.trim(),
            task.completed ? 'Да' : 'Нет',
            task.completed ? new Date().toLocaleDateString('ru-RU') : '-',
          ]);
        }
      }
    }

    await this.updateSheet('Задания', rows);
  }

  // Обновление листа в таблице
  private async updateSheet(sheetName: string, rows: string[][]): Promise<void> {
    if (!this.isEnabled()) return;

    try {
      // Проверяем существование листа
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: config.google.spreadsheetId,
      });

      const sheetExists = spreadsheet.data.sheets?.some(
        (s: any) => s.properties?.title === sheetName
      );

      // Создаём лист, если его нет
      if (!sheetExists) {
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: config.google.spreadsheetId,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: { title: sheetName },
                },
              },
            ],
          },
        });
      }

      // Очищаем лист
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: config.google.spreadsheetId,
        range: `${sheetName}!A:Z`,
      });

      // Записываем данные
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: config.google.spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: rows },
      });

      console.log(`Synced sheet: ${sheetName}`);
    } catch (error) {
      console.error(`Failed to sync sheet ${sheetName}:`, error);
      throw error;
    }
  }
}

export const googleSheetsService = new GoogleSheetsService();
