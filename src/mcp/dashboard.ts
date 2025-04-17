import * as fs from 'fs-extra';
import * as path from 'path';
import { TASK_DIR, TODO_DIR, WIP_DIR, COMPLETED_DIR } from './config';
import { parseTaskFile } from './utils/taskParser';

// ダッシュボードデータの型定義
export interface DashboardData {
  taskCounts: {
    todo: number;
    wip: number;
    completed: number;
    total: number;
  };
  priorityCounts: {
    high: number;
    medium: number;
    low: number;
  };
  projectCounts: Record<string, number>;
  overdueTasksCount: number;
  dueTodayTasksCount: number;
  recentlyCompletedTasks: Array<{
    title: string;
    completedDate: Date;
  }>;
}

/**
 * ダッシュボード用のデータを収集して返す
 */
export async function getDashboardData(): Promise<DashboardData> {
  // デバッグモード
  const DEBUG = process.env.NODE_ENV === 'test';
  
  // 各ディレクトリからタスクファイルを読み込む
  const todoFiles = fs.existsSync(TODO_DIR) ? fs.readdirSync(TODO_DIR).filter(file => file.endsWith('.md')) : [];
  const wipFiles = fs.existsSync(WIP_DIR) ? fs.readdirSync(WIP_DIR).filter(file => file.endsWith('.md')) : [];
  const completedFiles = fs.existsSync(COMPLETED_DIR) ? fs.readdirSync(COMPLETED_DIR).filter(file => file.endsWith('.md')) : [];

  // タスク数のカウント
  const taskCounts = {
    todo: todoFiles.length,
    wip: wipFiles.length,
    completed: completedFiles.length,
    total: todoFiles.length + wipFiles.length + completedFiles.length
  };

  // 優先度別のカウント
  const priorityCounts = {
    high: 0,
    medium: 0,
    low: 0
  };

  // プロジェクト別のカウント
  const projectCounts: Record<string, number> = {};

  // 期限切れタスクのカウント
  let overdueTasksCount = 0;
  let dueTodayTasksCount = 0;

  // 最近完了したタスク
  const recentlyCompletedTasks: Array<{ title: string; completedDate: Date }> = [];

  // 今日の日付を取得
  const todayDate = new Date();
  const todayString = formatDateToString(todayDate);
  
  if (DEBUG) {
    console.log(`Dashboard internal - Today date: ${todayDate.toISOString()}`);
    console.log(`Dashboard internal - Today string: ${todayString}`);
  }

  // Todoタスクを処理
  for (const file of todoFiles) {
    const taskPath = path.join(TODO_DIR, file);
    const content = fs.readFileSync(taskPath, 'utf8');
    const taskData = parseTaskFile(content);

    // 優先度カウント
    if (taskData.priority) {
      priorityCounts[taskData.priority as keyof typeof priorityCounts]++;
    }

    // プロジェクトカウント
    if (taskData.project) {
      projectCounts[taskData.project] = (projectCounts[taskData.project] || 0) + 1;
    }

    // 期限チェック
    if (taskData.due_date) {
      const dueDateString = taskData.due_date;
      
      // 文字列比較による期限チェック
      const isOverdue = dueDateString < todayString;
      const isDueToday = dueDateString === todayString;
      
      if (DEBUG) {
        console.log(`Check due date - File: ${file}, Due date: ${dueDateString}, Today: ${todayString}`);
        console.log(`                 Is overdue: ${isOverdue}, Is today: ${isDueToday}`);
      }
      
      if (isOverdue) {
        overdueTasksCount++;
        if (DEBUG) console.log(`Incrementing overdue count to ${overdueTasksCount}`);
      } else if (isDueToday) {
        dueTodayTasksCount++;
        if (DEBUG) console.log(`Incrementing due today count to ${dueTodayTasksCount}`);
      }
    }
  }

  // WIPタスクを処理
  for (const file of wipFiles) {
    const taskPath = path.join(WIP_DIR, file);
    const content = fs.readFileSync(taskPath, 'utf8');
    const taskData = parseTaskFile(content);

    // 優先度カウント
    if (taskData.priority) {
      priorityCounts[taskData.priority as keyof typeof priorityCounts]++;
    }

    // プロジェクトカウント
    if (taskData.project) {
      projectCounts[taskData.project] = (projectCounts[taskData.project] || 0) + 1;
    }
  }

  // 完了タスクを処理
  for (const file of completedFiles) {
    const taskPath = path.join(COMPLETED_DIR, file);
    const content = fs.readFileSync(taskPath, 'utf8');
    const taskData = parseTaskFile(content);

    // 優先度カウント
    if (taskData.priority) {
      priorityCounts[taskData.priority as keyof typeof priorityCounts]++;
    }

    // プロジェクトカウント
    if (taskData.project) {
      projectCounts[taskData.project] = (projectCounts[taskData.project] || 0) + 1;
    }

    // 最近完了したタスクを追加
    if (taskData.completed_date) {
      const completedDate = new Date(taskData.completed_date);
      recentlyCompletedTasks.push({
        title: taskData.title || 'タイトルなし',
        completedDate
      });
    }
  }

  // 最近完了したタスクを日付の新しい順にソート（最大5件）
  recentlyCompletedTasks.sort((a, b) => b.completedDate.getTime() - a.completedDate.getTime());
  const recentTasks = recentlyCompletedTasks.slice(0, 5);

  return {
    taskCounts,
    priorityCounts,
    projectCounts,
    overdueTasksCount,
    dueTodayTasksCount,
    recentlyCompletedTasks: recentTasks
  };
}

/**
 * 日付を YYYY-MM-DD 形式の文字列に変換する
 */
function formatDateToString(date: Date): string {
  return date.toISOString().split('T')[0];
} 