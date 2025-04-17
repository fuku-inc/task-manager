#!/usr/bin/env ts-node

import path from 'path';
import { createTask } from '../utils/task-utils';
import * as readline from 'readline';
import * as fs from 'fs';
import { program } from 'commander';

// コマンドライン引数の設定
program
  .option('-t, --title <title>', 'タスクのタイトル')
  .option('-d, --description <description>', 'タスクの詳細説明')
  .option('-p, --priority <priority>', 'タスクの優先度 (high/medium/low)', 'medium')
  .option('--project <project>', 'プロジェクト名')
  .option('--tags <tags>', 'カンマ区切りのタグリスト')
  .option('--due-date <due-date>', '期限日 (YYYY-MM-DD)')
  .option('-i, --interactive', 'インタラクティブモードで実行');

program.parse(process.argv);

const options = program.opts();

/**
 * インタラクティブモードでの入力プロンプト
 * @param rl readlineインターフェース
 * @param prompt 表示するプロンプト
 * @param defaultValue デフォルト値
 */
async function prompt(rl: readline.Interface, prompt: string, defaultValue: string = ''): Promise<string> {
  return new Promise((resolve) => {
    rl.question(`${prompt}${defaultValue ? ` (${defaultValue})` : ''}: `, (answer) => {
      resolve(answer || defaultValue);
    });
  });
}

/**
 * インタラクティブモードでタスクを作成
 */
async function createTaskInteractively(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    const title = await prompt(rl, 'タスクのタイトル');
    if (!title) {
      console.error('タイトルは必須です');
      process.exit(1);
    }

    const description = await prompt(rl, 'タスクの詳細説明 (省略可)');
    const priority = await prompt(rl, '優先度 (high/medium/low)', 'medium');
    const project = await prompt(rl, 'プロジェクト名 (省略可)');
    const tagsInput = await prompt(rl, 'タグ (カンマ区切り、省略可)');
    const due_date = await prompt(rl, '期限日 (YYYY-MM-DD形式、省略可)');

    const tags = tagsInput ? tagsInput.split(',').map((tag: string) => tag.trim()) : [];

    const taskId = createTask({
      title,
      description,
      priority: priority as 'high' | 'medium' | 'low',
      project,
      tags,
      due_date
    });

    console.log(`タスクが作成されました: ${taskId}`);
  } finally {
    rl.close();
  }
}

/**
 * コマンドライン引数からタスクを作成
 */
function createTaskFromArgs(): void {
  const { title, description, priority, project, tags, dueDate } = options;

  if (!title) {
    console.error('タイトルは必須です。--title オプションを指定してください。');
    process.exit(1);
  }

  const tagsArray = tags ? tags.split(',').map((tag: string) => tag.trim()) : [];

  const taskId = createTask({
    title,
    description: description || '',
    priority: (priority || 'medium') as 'high' | 'medium' | 'low',
    project: project || '',
    tags: tagsArray,
    due_date: dueDate || ''
  });

  console.log(`タスクが作成されました: ${taskId}`);
}

/**
 * メイン関数
 */
async function main(): Promise<void> {
  if (options.interactive || Object.keys(options).length <= 1) {
    // interactiveオプションが指定されているか、他のオプションが指定されていない場合
    await createTaskInteractively();
  } else {
    // コマンドラインオプションからタスクを作成
    createTaskFromArgs();
  }
}

// スクリプト実行
main().catch(error => {
  console.error('エラーが発生しました:', error);
  process.exit(1);
}); 