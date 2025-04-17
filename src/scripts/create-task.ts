#!/usr/bin/env ts-node

import * as readline from 'readline';
import { createTask } from '../utils/task-utils';
import { TaskPriority, TaskCreateData } from '../types/Task';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * ユーザー入力を取得する
 * @param prompt プロンプト
 * @returns ユーザー入力
 */
function askQuestion(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * メイン関数
 */
async function main() {
  console.log('=== 新規タスク作成 ===');
  
  // タスク情報の入力
  const title = await askQuestion('タイトル: ');
  if (!title) {
    console.error('タイトルは必須です');
    rl.close();
    return;
  }
  
  const description = await askQuestion('説明 (省略可): ');
  
  const priorityInput = await askQuestion('優先度 (high/medium/low, デフォルト: medium): ');
  const priority = ['high', 'medium', 'low'].includes(priorityInput) 
    ? priorityInput as TaskPriority 
    : 'medium';
  
  const projectInput = await askQuestion('プロジェクト名 (省略可): ');
  const project = projectInput || 'default';
  
  const dueDateInput = await askQuestion('期限 (YYYY-MM-DD, 省略可): ');
  let dueDate = '';
  if (dueDateInput) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dateRegex.test(dueDateInput)) {
      dueDate = dueDateInput;
    } else {
      console.log('期限の形式が正しくないため、空白として設定します');
    }
  }
  
  const tagsInput = await askQuestion('タグ (カンマ区切り, 省略可): ');
  const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()) : [];
  
  // タスクの作成
  const taskData: TaskCreateData = {
    title,
    description,
    priority,
    project,
    due_date: dueDate,
    tags
  };
  
  try {
    const filePath = createTask(taskData);
    console.log(`タスクが作成されました: ${filePath}`);
  } catch (error) {
    console.error('タスク作成中にエラーが発生しました:', error);
  }
  
  rl.close();
}

// スクリプト実行
main(); 