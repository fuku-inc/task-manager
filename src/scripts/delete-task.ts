#!/usr/bin/env node

import { program } from 'commander';
import { deleteTask } from '../core/tasks';
import chalk from 'chalk';

// コマンドラインオプションの設定
program
  .version('1.0.0')
  .description('タスクを削除します')
  .requiredOption('-i, --id <id>', 'タスクID')
  .parse(process.argv);

const options = program.opts();

/**
 * メイン関数
 */
async function main() {
  const { id } = options;
  
  try {
    // タスクを削除
    await deleteTask(id);
    console.log(chalk.green(`タスク "${id}" を削除しました`));
  } catch (error) {
    console.error(chalk.red('エラー:'), (error as Error).message);
    process.exit(1);
  }
}

// 実行
main(); 