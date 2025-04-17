import * as path from 'path';

// タスク管理のベースディレクトリ
export const TASK_DIR = path.join(process.cwd(), 'tasks');

// 各ステータスのディレクトリ
export const TODO_DIR = path.join(TASK_DIR, 'todo');
export const WIP_DIR = path.join(TASK_DIR, 'wip');
export const COMPLETED_DIR = path.join(TASK_DIR, 'completed'); 