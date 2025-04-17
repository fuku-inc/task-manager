#!/usr/bin/env ts-node

import path from 'path';
import { searchTasks } from '../utils/task-utils';
import { TaskStatus, TaskInfo, TaskSearchCriteria } from '../types/Task';

/**
 * ステータスを日本語でフォーマットする
 * @param status ステータス
 * @returns フォーマットされたステータス
 */
function formatStatus(status: TaskStatus): string {
  switch (status) {
    case 'todo': return '未着手';
    case 'wip': return '進行中';
    case 'completed': return '完了';
    default: return status;
  }
}

/**
 * 優先度を記号でフォーマットする
 * @param priority 優先度
 * @returns フォーマットされた優先度
 */
function formatPriority(priority: string): string {
  switch (priority) {
    case 'high': return '高';
    case 'medium': return '中';
    case 'low': return '低';
    default: return priority;
  }
}

/**
 * タスクのリストを表示する
 * @param tasks タスクリスト
 */
function displayTasks(tasks: TaskInfo[]): void {
  if (tasks.length === 0) {
    console.log('タスクはありません。');
    return;
  }

  console.log('==================================================');
  console.log('ID\t優先度\tステータス\t期限\t\tタイトル');
  console.log('--------------------------------------------------');
  
  tasks.forEach(task => {
    const dueDate = task.due_date ? task.due_date : '未設定';
    const status = formatStatus(task.status);
    const priority = formatPriority(task.priority);
    
    console.log(`${task.id.substr(0, 8)}\t${priority}\t${status}\t${dueDate}\t${task.title}`);
  });
  
  console.log('==================================================');
  console.log(`合計: ${tasks.length}件のタスク`);
}

/**
 * タスクをプロジェクト別にグループ化して表示する
 * @param tasks タスクリスト
 */
function displayTasksByProject(tasks: TaskInfo[]): void {
  if (tasks.length === 0) {
    console.log('タスクはありません。');
    return;
  }

  // プロジェクト別にグループ化
  const groupedTasks: Record<string, TaskInfo[]> = {};
  tasks.forEach(task => {
    const project = task.project || 'その他';
    if (!groupedTasks[project]) {
      groupedTasks[project] = [];
    }
    groupedTasks[project].push(task);
  });

  // プロジェクト別に表示
  Object.keys(groupedTasks).sort().forEach(project => {
    console.log(`\n【${project}】 (${groupedTasks[project].length}件)`);
    console.log('--------------------------------------------------');
    
    groupedTasks[project].forEach(task => {
      const status = formatStatus(task.status);
      const priority = formatPriority(task.priority);
      const dueDate = task.due_date ? ` (期限: ${task.due_date})` : '';
      console.log(`[${priority}][${status}] ${task.title}${dueDate}`);
    });
  });
  
  console.log('\n==================================================');
  console.log(`合計: ${tasks.length}件のタスク`);
}

/**
 * コマンドライン引数をパースする
 */
function parseArgs(): TaskSearchCriteria {
  const args = process.argv.slice(2);
  const criteria: TaskSearchCriteria = {};
  
  args.forEach(arg => {
    if (arg === 'todo' || arg === '--todo') {
      criteria.status = 'todo';
    } else if (arg === 'wip' || arg === '--wip') {
      criteria.status = 'wip';
    } else if (arg === 'completed' || arg === '--completed') {
      criteria.status = 'completed';
    } else if (arg.startsWith('--priority=')) {
      criteria.priority = arg.split('=')[1] as any;
    } else if (arg.startsWith('--project=')) {
      criteria.project = arg.split('=')[1];
    } else if (arg.startsWith('--tag=')) {
      criteria.tag = arg.split('=')[1];
    } else if (arg.startsWith('--due-before=')) {
      criteria.due_before = arg.split('=')[1];
    } else if (arg.startsWith('--due-after=')) {
      criteria.due_after = arg.split('=')[1];
    } else if (arg.startsWith('--text=')) {
      criteria.text = arg.split('=')[1];
    } else if (arg === '--group-by-project' || arg === '-g') {
      // これは検索条件ではなく表示オプションとして後で使用
    }
  });
  
  return criteria;
}

/**
 * 表示オプションをパースする
 */
function parseDisplayOptions(): { groupByProject: boolean } {
  const args = process.argv.slice(2);
  const options = {
    groupByProject: args.includes('--group-by-project') || args.includes('-g')
  };
  return options;
}

/**
 * メイン関数
 */
function main() {
  const criteria = parseArgs();
  const displayOptions = parseDisplayOptions();
  
  const tasks = searchTasks(criteria);
  
  if (displayOptions.groupByProject) {
    displayTasksByProject(tasks);
  } else {
    displayTasks(tasks);
  }
}

// スクリプト実行
main(); 