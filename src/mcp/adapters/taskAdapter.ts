import { 
  createTask, 
  listTasks, 
  completeTask, 
  deleteTask, 
  updateTask, 
  Task, 
  TaskFilter 
} from '../../core/tasks';
import { TaskPriority } from '../../types/Task';

/**
 * 新しいタスクを作成する
 */
export async function mcp_task_create(args: { 
  title: string; 
  description?: string; 
  dueDate?: string;
  priority?: TaskPriority;
  project?: string;
  tags?: string[];
}): Promise<{ id: string }> {
  const { title, description, dueDate, priority, project, tags } = args;
  const taskId = await createTask({
    title,
    description: description || '',
    dueDate: dueDate ? new Date(dueDate) : undefined,
    priority,
    project,
    tags,
    completed: false,
  });
  
  return { id: taskId };
}

/**
 * タスク一覧を取得する
 */
export async function mcp_task_list(args: { 
  filter?: TaskFilter 
} = {}): Promise<{ tasks: Task[] }> {
  const { filter } = args;
  const tasks = await listTasks(filter);
  
  return { tasks };
}

/**
 * タスクを完了済みにする
 */
export async function mcp_task_complete(args: { 
  id: string 
}): Promise<{ success: boolean }> {
  const { id } = args;
  await completeTask(id);
  
  return { success: true };
}

/**
 * タスクを削除する
 */
export async function mcp_task_delete(args: { 
  id: string 
}): Promise<{ success: boolean }> {
  const { id } = args;
  await deleteTask(id);
  
  return { success: true };
}

/**
 * タスクを更新する
 */
export async function mcp_task_update(args: { 
  id: string; 
  title?: string; 
  description?: string; 
  dueDate?: string;
  priority?: TaskPriority;
  tags?: string[];
}): Promise<{ success: boolean }> {
  const { id, title, description, dueDate, priority, tags } = args;
  
  await updateTask(id, {
    title,
    description,
    dueDate: dueDate ? new Date(dueDate) : undefined,
    priority,
    tags
  });
  
  return { success: true };
}

/**
 * タスクのステータスを変更する
 */
export async function mcp_task_change_status(args: {
  id: string;
  status: 'todo' | 'wip' | 'completed';
}): Promise<{ success: boolean }> {
  const { id, status } = args;
  
  // 全タスクを取得して対象のタスクを探す
  const tasks = await listTasks();
  const targetTask = tasks.find(task => task.id === id);
  
  if (!targetTask) {
    throw new Error(`タスク "${id}" が見つかりません`);
  }
  
  // 現在のステータスを確認
  const currentStatus = targetTask.completed ? 'completed' : 'todo'; // 簡略化
  
  // 同じステータスならスキップ
  if (currentStatus === status) {
    return { success: true };
  }
  
  // 完了に変更
  if (status === 'completed') {
    await completeTask(id);
    return { success: true };
  }
  
  // TODO: 作業中、未着手への変更はまだサポートされていない
  // 将来的に実装予定
  throw new Error(`ステータス "${status}" への変更はまだサポートされていません`);
} 