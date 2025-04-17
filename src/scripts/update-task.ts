#!/usr/bin/env node

import { program } from 'commander';
import { updateTask, listTasks } from '../core/tasks';
import { TaskPriority } from '../types/Task';
import chalk from 'chalk';

// コマンドラインオプションの設定
program
  .version('1.0.0')
  .description('タスクを更新します')
  .requiredOption('-i, --id <id>', 'タスクID')
  .option('-t, --title <title>', 'タスクのタイトル')
  .option('-d, --description <description>', 'タスクの説明')
  .option('-p, --priority <priority>', 'タスクの優先度 (high, medium, low)')
  .option('-u, --due <dueDate>', '期限日 (YYYY-MM-DD形式)')
  .option('--tags <tags>', 'タグ (カンマ区切り)')
  .option('--remove-due', '期限を削除する')
  .parse(process.argv);

const options = program.opts();

/**
 * メイン関数
 */
async function main() {
  const { id, title, description, priority, due, tags, removeDue } = options;
  
  try {
    // 更新内容の準備
    const updates: Record<string, any> = {};
    
    if (title) {
      updates.title = title;
    }
    
    if (description) {
      updates.description = description;
    }
    
    if (priority) {
      if (!['high', 'medium', 'low'].includes(priority)) {
        console.error(chalk.red('エラー: 優先度は high, medium, low のいずれかを指定してください'));
        process.exit(1);
      }
      updates.priority = priority as TaskPriority;
    }
    
    if (due) {
      const dueDate = new Date(due);
      if (isNaN(dueDate.getTime())) {
        console.error(chalk.red('エラー: 期限の形式が不正です。YYYY-MM-DD形式で指定してください'));
        process.exit(1);
      }
      updates.dueDate = dueDate;
    } else if (removeDue) {
      updates.dueDate = null;
    }
    
    if (tags) {
      updates.tags = tags.split(',').map((tag: string) => tag.trim());
    }
    
    // 更新内容が指定されていない場合
    if (Object.keys(updates).length === 0) {
      console.error(chalk.red('エラー: 更新内容を少なくとも1つ指定してください'));
      process.exit(1);
    }
    
    // タスクの更新
    await updateTask(id, updates);
    
    console.log(chalk.green(`タスク "${id}" を更新しました`));
    
    // 更新内容を表示
    const updatedTasks = await listTasks({ text: id });
    const updatedTask = updatedTasks.find(task => task.id === id);
    
    if (updatedTask) {
      console.log(chalk.blue('更新後のタスク情報:'));
      console.log(chalk.cyan('  タイトル:'), updatedTask.title);
      console.log(chalk.cyan('  優先度:'), updatedTask.priority);
      console.log(chalk.cyan('  プロジェクト:'), updatedTask.project);
      console.log(chalk.cyan('  期限:'), updatedTask.dueDate ? updatedTask.dueDate.toISOString().split('T')[0] : '未設定');
      console.log(chalk.cyan('  タグ:'), updatedTask.tags.length > 0 ? updatedTask.tags.join(', ') : '未設定');
    }
  } catch (error) {
    console.error(chalk.red('エラー:'), (error as Error).message);
    process.exit(1);
  }
}

// 実行
main(); 