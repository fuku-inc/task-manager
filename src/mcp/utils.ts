import * as fs from 'fs-extra';
import * as path from 'path';

// タスクの優先度
export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

// タスクの型定義
export interface Task {
  id: string;
  title: string;
  description: string;
  created: Date;
  updated?: Date;
  due?: Date;
  priority: Priority;
  project?: string;
  tags?: string[];
  status: 'todo' | 'wip' | 'completed';
  completedAt?: Date;
}

// タスクをJSONからロードする関数
export function loadTaskFromFile(filePath: string): Task {
  const data = fs.readJSONSync(filePath);
  
  // 日付のフィールドをDate型に変換
  const task: Task = {
    ...data,
    created: new Date(data.created),
    due: data.due ? new Date(data.due) : undefined,
    updated: data.updated ? new Date(data.updated) : undefined,
    completedAt: data.completedAt ? new Date(data.completedAt) : undefined
  };
  
  return task;
}

// ディレクトリからすべてのタスクをロードする関数
export async function loadTasksFromDirectory(directory: string): Promise<Task[]> {
  try {
    // ディレクトリが存在しない場合は空の配列を返す
    if (!fs.existsSync(directory)) {
      return [];
    }
    
    const files = await fs.readdir(directory);
    const jsonFiles = files.filter(file => path.extname(file) === '.json');
    
    const tasks = await Promise.all(
      jsonFiles.map(async file => {
        const filePath = path.join(directory, file);
        return loadTaskFromFile(filePath);
      })
    );
    
    return tasks;
  } catch (error) {
    console.error(`ディレクトリ ${directory} からタスクをロードできませんでした:`, error);
    return [];
  }
} 