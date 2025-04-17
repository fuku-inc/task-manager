import * as taskUtils from '../utils/task-utils';
import { TaskPriority, TaskStatus, TaskInfo, TaskSearchCriteria } from '../types/Task';

// タスクインターフェース
export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  project: string;
  dueDate?: Date;
  completed: boolean;
  completedDate?: string;
  createdAt: string;
  tags: string[];
  path: string;
}

// タスク検索条件
export type TaskFilter = TaskSearchCriteria;

/**
 * 新しいタスクを作成する
 * @param taskData タスクデータ
 * @returns 作成されたタスクのID
 */
export async function createTask(taskData: {
  title: string;
  description?: string;
  priority?: TaskPriority;
  project?: string;
  dueDate?: Date;
  completed?: boolean;
  tags?: string[];
}): Promise<string> {
  // タスクユーティリティに渡すためにデータを変換
  const utilTaskData = {
    title: taskData.title,
    description: taskData.description,
    priority: taskData.priority,
    project: taskData.project,
    due_date: taskData.dueDate ? taskData.dueDate.toISOString().split('T')[0] : undefined,
    tags: taskData.tags
  };
  
  // タスクを作成
  const filePath = taskUtils.createTask(utilTaskData);
  
  // 作成されたタスクのメタデータを取得
  const metadata = taskUtils.parseTaskMetadata(filePath);
  
  return metadata.id;
}

/**
 * タスク一覧を取得する
 * @param filter 検索条件
 * @returns タスク一覧
 */
export async function listTasks(filter?: TaskFilter): Promise<Task[]> {
  const tasks = taskUtils.searchTasks(filter);
  
  // タスク情報をAPIフォーマットに変換
  return tasks.map(task => ({
    id: task.id,
    title: task.title,
    description: '', // ファイルの内容から取得する必要がある
    priority: task.priority,
    project: task.project,
    dueDate: task.due_date ? new Date(task.due_date) : undefined,
    completed: task.status === 'completed',
    completedDate: task.completedDate,
    createdAt: task.created_at,
    tags: task.tags,
    path: task.path
  }));
}

/**
 * タスクを完了にする
 * @param id タスクID
 */
export async function completeTask(id: string): Promise<void> {
  const allTasks = taskUtils.listTasks('all');
  const targetTask = allTasks.find(task => {
    try {
      const metadata = taskUtils.parseTaskMetadata(task.path);
      return metadata.id === id;
    } catch {
      return false;
    }
  });

  if (!targetTask) {
    throw new Error(`タスク "${id}" が見つかりません`);
  }

  if (targetTask.status !== 'wip') {
    throw new Error(`タスク "${id}" は作業中ではないため完了にできません`);
  }

  taskUtils.changeTaskStatus(targetTask.path, 'completed');
}

/**
 * タスクを削除する
 * @param id タスクID
 */
export async function deleteTask(id: string): Promise<void> {
  // 全タスクを取得
  const allTasks = taskUtils.listTasks('all');
  
  // 指定されたIDのタスクを検索
  const targetTask = allTasks.find(task => {
    try {
      const metadata = taskUtils.parseTaskMetadata(task.path);
      return metadata.id === id;
    } catch {
      return false;
    }
  });

  // タスクが見つからない場合はエラー
  if (!targetTask) {
    throw new Error(`タスク "${id}" が見つかりません`);
  }

  // タスクファイルを削除
  taskUtils.deleteTaskFile(targetTask.path);
}

/**
 * タスクを更新する
 * @param id タスクID
 * @param updates 更新内容
 */
export async function updateTask(id: string, updates: {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: Date;
  tags?: string[];
}): Promise<void> {
  // 更新内容が空の場合はエラー
  if (Object.keys(updates).length === 0) {
    throw new Error('更新内容が指定されていません');
  }
  
  // 全タスクを取得
  const allTasks = taskUtils.listTasks('all');
  
  // 指定されたIDのタスクを検索
  const targetTask = allTasks.find(task => {
    try {
      const metadata = taskUtils.parseTaskMetadata(task.path);
      return metadata.id === id;
    } catch {
      return false;
    }
  });

  // タスクが見つからない場合はエラー
  if (!targetTask) {
    throw new Error(`タスク "${id}" が見つかりません`);
  }
  
  // 更新データを準備
  const updateData: Record<string, any> = {};
  
  // 各フィールドの処理
  if (updates.title) {
    updateData.title = updates.title;
  }
  
  if (updates.description) {
    updateData.description = updates.description;
  }
  
  if (updates.priority) {
    updateData.priority = updates.priority;
  }
  
  if (updates.tags) {
    updateData.tags = updates.tags;
  }
  
  if (updates.dueDate !== undefined) {
    updateData.due_date = updates.dueDate ? updates.dueDate.toISOString().split('T')[0] : '';
  }
  
  // タスクファイルを更新
  taskUtils.updateTaskFile(targetTask.path, updateData);
} 