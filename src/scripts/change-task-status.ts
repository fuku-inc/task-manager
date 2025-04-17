#!/usr/bin/env ts-node

import path from 'path';
import { listTasks, changeTaskStatus, parseTaskMetadata } from '../utils/task-utils';
import { TaskFile } from '../types/Task';

/**
 * タスクリストを表示する
 * @param tasks タスクリスト
 */
function displayTasks(tasks: TaskFile[]): void {
  if (tasks.length === 0) {
    console.log('タスクはありません。');
    return;
  }

  console.log('==================================================');
  console.log('ID\t優先度\tタイトル\t\t\tファイル名');
  console.log('--------------------------------------------------');
  
  tasks.forEach((taskFile, index) => {
    try {
      const metadata = parseTaskMetadata(taskFile.path);
      const fileName = path.basename(taskFile.path);
      console.log(`${index + 1}\t${metadata.priority}\t${metadata.title.slice(0, 20).padEnd(20)}\t${fileName}`);
    } catch (error) {
      console.error(`ファイル ${taskFile.path} の解析に失敗しました。`);
    }
  });
  
  console.log('==================================================');
}

/**
 * コマンドライン引数をパースする
 */
function parseArgs(): { status: 'wip' | 'completed' } {
  const args = process.argv.slice(2);
  const status = args[0] === 'complete' ? 'completed' : 'wip';
  return { status };
}

/**
 * メイン関数
 */
async function main() {
  const { status } = parseArgs();
  const statusText = status === 'wip' ? '作業中' : '完了';
  
  console.log(`=== タスクを${statusText}に設定 ===`);
  
  // todoリストのタスクを表示
  const todoTasks = listTasks(status === 'wip' ? 'todo' : 'wip');
  
  if (todoTasks.length === 0) {
    console.log(`${status === 'wip' ? '未着手' : '作業中'}のタスクはありません。`);
    return;
  }
  
  displayTasks(todoTasks);
  
  // 選択肢を表示
  console.log(`上記のどのタスクを${statusText}に設定しますか？`);
  console.log('番号を入力してください（1から始まる番号）または 0 でキャンセル:');
  
  // 標準入力から読み込み
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  
  process.stdin.on('data', (data) => {
    const input = data.toString().trim();
    const index = parseInt(input, 10);
    
    if (isNaN(index) || index < 0 || index > todoTasks.length) {
      console.log('無効な番号です。');
      process.exit(1);
    }
    
    if (index === 0) {
      console.log('キャンセルしました。');
      process.exit(0);
    }
    
    const selectedTask = todoTasks[index - 1];
    
    try {
      const newPath = changeTaskStatus(selectedTask.path, status);
      const metadata = parseTaskMetadata(newPath);
      console.log(`タスク "${metadata.title}" を${statusText}に設定しました。`);
    } catch (error) {
      console.error('エラーが発生しました:', error);
    }
    
    process.exit(0);
  });
}

// スクリプト実行
main(); 