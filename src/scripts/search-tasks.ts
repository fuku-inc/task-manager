#!/usr/bin/env ts-node

import { program } from 'commander';
import { searchTasks } from '../utils/task-utils';
import { TaskInfo, TaskSearchCriteria } from '../types/Task';

// コマンドライン引数の設定
program
  .option('--priority <priority>', '優先度でフィルタリング (high/medium/low)')
  .option('--project <project>', 'プロジェクト名でフィルタリング')
  .option('--tag <tag>', 'タグでフィルタリング')
  .option('--status <status>', 'ステータスでフィルタリング (todo/wip/completed)')
  .option('--due-before <date>', '指定日以前の期限でフィルタリング (YYYY-MM-DD)')
  .option('--due-after <date>', '指定日以降の期限でフィルタリング (YYYY-MM-DD)')
  .option('--text <text>', 'タイトルと説明から検索')
  .option('-g, --group-by-project', 'プロジェクト別にグループ化して表示');

program.parse(process.argv);

const options = program.opts();

/**
 * ステータスを日本語でフォーマットする
 * @param status ステータス
 * @returns フォーマットされたステータス
 */
function formatStatus(status: string): string {
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
    console.log('条件に一致するタスクはありません。');
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
    console.log('条件に一致するタスクはありません。');
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
 * メイン関数
 */
function main() {
  // 検索条件を構築
  const criteria: TaskSearchCriteria = {};
  
  if (options.status) criteria.status = options.status;
  if (options.priority) criteria.priority = options.priority;
  if (options.project) criteria.project = options.project;
  if (options.tag) criteria.tag = options.tag;
  if (options.dueBefore) criteria.due_before = options.dueBefore;
  if (options.dueAfter) criteria.due_after = options.dueAfter;
  if (options.text) criteria.text = options.text;
  
  // 検索実行
  const tasks = searchTasks(criteria);
  
  // 結果表示
  if (options.groupByProject) {
    displayTasksByProject(tasks);
  } else {
    displayTasks(tasks);
  }
}

// スクリプト実行
main(); 