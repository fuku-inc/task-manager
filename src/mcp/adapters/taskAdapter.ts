import { 
  createTask, 
  listTasks, 
  completeTask, 
  deleteTask, 
  updateTask, 
  Task, 
  TaskFilter 
} from '../../core/tasks';

/**
 * 新しいタスクを作成する
 */
export async function mcp_task_create(args: { 
  title: string; 
  description?: string; 
  dueDate?: string; 
}): Promise<{ id: string }> {
  const { title, description, dueDate } = args;
  const taskId = await createTask({
    title,
    description: description || '',
    dueDate: dueDate ? new Date(dueDate) : undefined,
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
}): Promise<{ success: boolean }> {
  const { id, title, description, dueDate } = args;
  
  await updateTask(id, {
    title,
    description,
    dueDate: dueDate ? new Date(dueDate) : undefined,
  });
  
  return { success: true };
} 