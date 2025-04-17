#!/usr/bin/env ts-node

import fs from 'fs-extra';
import path from 'path';
import * as taskUtils from './utils/task-utils';
import { TaskStatus, TaskSearchCriteria } from './types/Task';

function showHelp(): void {
  console.log(`
タスク管理ツール - コマンド一覧

使用方法:
  task [コマンド] [オプション]

コマンド:
  create                タスクを新規作成します
  start                 タスクを作業中に設定します
  complete              タスクを完了に設定します
  list [オプション]      タスク一覧を表示します
  help                  このヘルプを表示します

list コマンドのオプション:
  todo                  未着手のタスクのみ表示
  wip                   作業中のタスクのみ表示
  completed             完了したタスクのみ表示
  --priority=<優先度>    指定した優先度のタスクのみ表示 (high/medium/low)
  --project=<プロジェクト> 指定したプロジェクトのタスクのみ表示
  --tag=<タグ>           指定したタグを持つタスクのみ表示
  --due-before=<日付>    指定した日付より前に期限があるタスクのみ表示 (YYYY-MM-DD)
  --due-after=<日付>     指定した日付より後に期限があるタスクのみ表示 (YYYY-MM-DD)
  --text=<テキスト>       指定したテキストを含むタスクのみ表示
  --group-by-project, -g プロジェクト別にグループ化して表示
  `);
}

function executeScript(scriptName: string, args: string[] = []): void {
  const scriptPath = path.join(__dirname, 'scripts', `${scriptName}.js`);
  
  // ESMモジュールでの動的インポートができないため、子プロセスで実行
  const { spawnSync } = require('child_process');
  const result = spawnSync('node', [scriptPath, ...args], {
    stdio: 'inherit',
    env: process.env
  });
  
  process.exit(result.status || 0);
}

function main(): void {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  
  switch (command) {
    case 'create':
      executeScript('create-task');
      break;
      
    case 'start':
      executeScript('change-task-status', ['start']);
      break;
      
    case 'complete':
      executeScript('change-task-status', ['complete']);
      break;
      
    case 'list':
      executeScript('list-tasks', args.slice(1));
      break;
      
    case 'help':
    default:
      showHelp();
      break;
  }
}

// スクリプト実行
main(); 