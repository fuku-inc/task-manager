import { TaskPriority, TaskStatus, TaskInfo, TaskSearchCriteria } from '../types/Task';

/**
 * MCPサーバー用タスク作成関数の引数
 */
export interface CreateTaskArgs {
  title: string;
  description?: string;
  priority?: TaskPriority;
  project?: string;
  due_date?: string;
  tags?: string[];
}

/**
 * MCPサーバー用タスクステータス変更関数の引数
 */
export interface ChangeTaskStatusArgs {
  task_id: string;
  new_status: 'wip' | 'completed';
}

/**
 * MCPサーバー用タスク検索関数の引数
 */
export interface SearchTasksArgs {
  status?: TaskStatus;
  priority?: TaskPriority;
  project?: string;
  tag?: string;
  due_before?: string;
  due_after?: string;
  text?: string;
}

/**
 * MCPサーバー用タスク取得関数の引数
 */
export interface GetTaskArgs {
  task_id: string;
}

/**
 * MCPサーバー用今日のタスク取得関数の引数
 */
export interface GetTodayTasksArgs {
  include_overdue?: boolean;
}

/**
 * タスク操作結果
 */
export interface TaskOperationResult {
  success: boolean;
  message: string;
  task?: TaskInfo;
}

/**
 * タスク検索結果
 */
export interface TaskSearchResult {
  success: boolean;
  message: string;
  tasks: TaskInfo[];
} 