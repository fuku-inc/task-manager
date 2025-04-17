/**
 * タスクの優先度
 */
export type TaskPriority = 'high' | 'medium' | 'low';

/**
 * タスクのステータス
 */
export type TaskStatus = 'todo' | 'wip' | 'completed';

/**
 * タスクのメタデータ
 */
export interface TaskMetadata {
  title: string;
  id: string;
  priority: TaskPriority;
  project: string;
  due_date?: string;
  created_at: string;
  tags: string[];
}

/**
 * タスク作成時のデータ
 */
export interface TaskCreateData {
  title: string;
  description?: string;
  priority?: TaskPriority;
  project?: string;
  due_date?: string;
  tags?: string[];
}

/**
 * タスクファイル情報
 */
export interface TaskFile {
  path: string;
  status: TaskStatus;
  completedDate?: string;
}

/**
 * タスク情報（メタデータ + ファイル情報）
 */
export interface TaskInfo extends TaskMetadata {
  status: TaskStatus;
  completedDate?: string;
  path: string;
}

/**
 * タスク検索条件
 */
export interface TaskSearchCriteria {
  status?: TaskStatus;
  priority?: TaskPriority;
  project?: string;
  tag?: string;
  due_before?: string;
  due_after?: string;
  text?: string;
} 