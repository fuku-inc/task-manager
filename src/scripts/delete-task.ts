#!/usr/bin/env ts-node

import path from 'path';
import * as fs from 'fs';
import { program } from 'commander';
import { deleteTaskFile, searchTasks } from '../utils/task-utils';
import * as readline from 'readline';

// コマンドライン引数の設定
program
  .option('-i, --id <taskId>', 'タスクID')
  .option('-f, --force', '確認なしで削除')
  .option('-t, --text <text>', 'テキスト検索でタスクを指定');

program.parse(process.argv);
const options = program.opts();

/**
 * ユーザーに確認を求める
 * @param rl readlineインターフェース
 * @param message 確認メッセージ
 */
async function confirm(rl: readline.Interface, message: string): Promise<boolean> {
  return new Promise((resolve) => {
    rl.question(`${message} (y/N): `, (answer) => {
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

/**
 * タスクの表示
 * @param taskId タスクID
 */
function displayTask(taskId: string): void {
  try {
    const tasks = searchTasks({ text: taskId });
    const task = tasks.find(t => t.id === taskId);
    
    if (task) {
      console.log('\nタスク詳細:');
      console.log(`ID: ${task.id}`);
      console.log(`タイトル: ${task.title}`);
      console.log(`優先度: ${task.priority}`);
      console.log(`ステータス: ${task.status}`);
      console.log(`プロジェクト: ${task.project || 'なし'}`);
      console.log(`期限: ${task.due_date || 'なし'}`);
      if (task.tags && task.tags.length > 0) {
        console.log(`タグ: ${task.tags.join(', ')}`);
      }
    }
  } catch (error) {
    console.error(`タスクの表示中にエラーが発生しました: ${error}`);
  }
}

/**
 * メイン関数
 */
async function main(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    let taskId = options.id;
    let taskPath = '';
    
    // IDが指定されていない場合、テキスト検索を試みる
    if (!taskId && options.text) {
      const tasks = searchTasks({ text: options.text });
      
      if (tasks.length === 0) {
        console.error(`"${options.text}" に一致するタスクは見つかりませんでした。`);
        process.exit(1);
      }
      
      if (tasks.length > 1) {
        console.log(`複数のタスクが "${options.text}" に一致しました：`);
        tasks.forEach((task, index) => {
          console.log(`${index + 1}: ${task.id} - ${task.title}`);
        });
        
        // ユーザーに選択してもらう
        const answer = await new Promise<string>((resolve) => {
          rl.question('削除するタスクの番号を選択してください: ', resolve);
        });
        
        const index = parseInt(answer) - 1;
        if (isNaN(index) || index < 0 || index >= tasks.length) {
          console.error('無効な選択です。');
          process.exit(1);
        }
        
        taskId = tasks[index].id;
        taskPath = tasks[index].path;
      } else {
        // 1つのタスクのみ見つかった場合
        taskId = tasks[0].id;
        taskPath = tasks[0].path;
        console.log(`"${options.text}" に一致するタスクが見つかりました。`);
      }
    } else if (taskId) {
      // IDが指定されている場合
      const tasks = searchTasks({ text: taskId });
      const task = tasks.find(t => t.id === taskId);
      
      if (!task) {
        console.error(`ID "${taskId}" のタスクは見つかりませんでした。`);
        process.exit(1);
      }
      
      taskPath = task.path;
    }
    
    if (!taskId || !taskPath) {
      console.error('タスクIDが指定されていないか、検索条件に一致するタスクがありません。');
      console.error('使用法: delete-task --id <タスクID> または --text <検索テキスト>');
      process.exit(1);
    }
    
    // タスク情報を表示
    displayTask(taskId);
    
    // 強制削除オプションがない場合、ユーザーに確認
    if (!options.force) {
      const confirmed = await confirm(rl, '本当にこのタスクを削除しますか？');
      if (!confirmed) {
        console.log('タスク削除をキャンセルしました。');
        process.exit(0);
      }
    }
    
    // タスクを削除
    deleteTaskFile(taskPath);
    console.log(`タスク ${taskId} が削除されました。`);
  } finally {
    rl.close();
  }
}

// スクリプト実行
main().catch(error => {
  console.error('エラーが発生しました:', error);
  process.exit(1);
}); 