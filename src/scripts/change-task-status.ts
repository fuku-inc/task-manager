#!/usr/bin/env ts-node

import path from 'path';
import { program } from 'commander';
import { listTasks, changeTaskStatus, parseTaskMetadata } from '../utils/task-utils';
import { TaskFile } from '../types/Task';

// コマンドライン引数の設定
program
  .arguments('<command>')
  .option('-i, --id <id>', 'タスクID')
  .option('-n, --number <number>', 'タスク番号（リストの1始まりの番号）')
  .description('タスクのステータスを変更します。command: start または complete')
  .action(async (command) => {
    const options = program.opts();
    await runCommand(command, options);
  });

program.parse(process.argv);

/**
 * タスクリストを表示する
 * @param tasks タスクリスト
 * @returns タスクIDの配列
 */
function displayTasks(tasks: TaskFile[]): string[] {
  if (tasks.length === 0) {
    console.log('タスクはありません。');
    return [];
  }

  console.log('==================================================');
  console.log('番号\tID\t\t優先度\tタイトル');
  console.log('--------------------------------------------------');
  
  const taskIds: string[] = [];
  
  tasks.forEach((taskFile, index) => {
    try {
      const metadata = parseTaskMetadata(taskFile.path);
      taskIds.push(metadata.id);
      console.log(`${index + 1}\t${metadata.id}\t${metadata.priority}\t${metadata.title}`);
    } catch (error) {
      console.error(`ファイル ${taskFile.path} の解析に失敗しました。`);
    }
  });
  
  console.log('==================================================');
  return taskIds;
}

/**
 * コマンドを実行する
 * @param command コマンド (start または complete)
 * @param options オプション
 */
async function runCommand(command: string, options: any): Promise<void> {
  // コマンドの判定
  const status = command === 'complete' ? 'completed' : 'wip';
  const statusText = status === 'wip' ? '作業中' : '完了';
  
  console.log(`=== タスクを${statusText}に設定 ===`);
  
  // タスクIDまたは番号が指定されている場合
  if (options.id || options.number) {
    const sourceTasks = listTasks(status === 'wip' ? 'todo' : 'wip');
    
    // IDで指定された場合
    if (options.id) {
      const taskId = options.id;
      const taskFile = sourceTasks.find(task => {
        try {
          const metadata = parseTaskMetadata(task.path);
          return metadata.id === taskId;
        } catch {
          return false;
        }
      });
      
      if (!taskFile) {
        console.error(`ID ${taskId} のタスクが見つかりません。`);
        process.exit(1);
      }
      
      try {
        const newPath = changeTaskStatus(taskFile.path, status);
        const metadata = parseTaskMetadata(newPath);
        console.log(`タスクのステータスが「${statusText}」に変更されました: ${metadata.title}`);
        process.exit(0);
      } catch (error) {
        console.error('エラーが発生しました:', error);
        process.exit(1);
      }
    }
    
    // 番号で指定された場合
    if (options.number) {
      const index = parseInt(options.number, 10) - 1;
      if (isNaN(index) || index < 0 || index >= sourceTasks.length) {
        console.error('無効な番号です。');
        process.exit(1);
      }
      
      try {
        const newPath = changeTaskStatus(sourceTasks[index].path, status);
        const metadata = parseTaskMetadata(newPath);
        console.log(`タスクのステータスが「${statusText}」に変更されました: ${metadata.title}`);
        process.exit(0);
      } catch (error) {
        console.error('エラーが発生しました:', error);
        process.exit(1);
      }
    }
  } else {
    // 対話モード
    // todoリストのタスクを表示
    const sourceTasks = listTasks(status === 'wip' ? 'todo' : 'wip');
    
    if (sourceTasks.length === 0) {
      console.log(`${status === 'wip' ? '未着手' : '作業中'}のタスクはありません。`);
      process.exit(0);
    }
    
    displayTasks(sourceTasks);
    
    // 選択肢を表示
    console.log(`上記のどのタスクを${statusText}に設定しますか？`);
    console.log('番号を入力してください（1から始まる番号）または 0 でキャンセル:');
    
    // 標準入力から読み込み
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    process.stdin.on('data', (data) => {
      const input = data.toString().trim();
      const index = parseInt(input, 10);
      
      if (isNaN(index) || index < 0 || index > sourceTasks.length) {
        console.log('無効な番号です。');
        process.exit(1);
      }
      
      if (index === 0) {
        console.log('キャンセルしました。');
        process.exit(0);
      }
      
      const selectedTask = sourceTasks[index - 1];
      
      try {
        const newPath = changeTaskStatus(selectedTask.path, status);
        const metadata = parseTaskMetadata(newPath);
        console.log(`タスクのステータスが「${statusText}」に変更されました: ${metadata.title}`);
      } catch (error) {
        console.error('エラーが発生しました:', error);
        process.exit(1);
      }
      
      process.exit(0);
    });
  }
} 