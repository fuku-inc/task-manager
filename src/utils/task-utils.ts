import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import { 
  TaskMetadata,
  TaskCreateData,
  TaskFile,
  TaskInfo,
  TaskSearchCriteria,
  TaskStatus 
} from '../types/Task';

// ディレクトリパス
const TASK_DIR = path.join(process.cwd(), 'tasks');
const TODO_DIR = path.join(TASK_DIR, 'todo');
const WIP_DIR = path.join(TASK_DIR, 'wip');
const COMPLETED_DIR = path.join(TASK_DIR, 'completed');

/**
 * 一意のIDを生成する
 * @returns 生成されたID
 */
export function generateTaskId(): string {
  return `task-${Date.now().toString(36)}-${crypto.randomBytes(2).toString('hex')}`;
}

/**
 * 今日の日付を YYYY-MM-DD 形式で取得する
 * @returns 今日の日付
 */
export function getTodayString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

/**
 * 新しいタスクを作成する
 * @param taskData タスクデータ
 * @returns 作成されたファイルのパス
 */
export function createTask(taskData: TaskCreateData): string {
  // ディレクトリの存在確認
  if (!fs.existsSync(TODO_DIR)) {
    fs.mkdirSync(TODO_DIR, { recursive: true });
  }

  // IDとデータの準備
  const id = generateTaskId();
  const today = getTodayString();
  const title = taskData.title || 'Untitled Task';
  
  // デフォルト値でデータを補完
  const data: TaskMetadata = {
    title: title,
    id: id,
    priority: taskData.priority || 'medium',
    project: taskData.project || 'default',
    due_date: taskData.due_date || '',
    created_at: today,
    tags: taskData.tags || []
  };
  
  // ファイル名の作成
  const fileName = `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${today}.md`;
  const filePath = path.join(TODO_DIR, fileName);
  
  // テンプレートの読み込み
  const templatePath = path.join(process.cwd(), 'docs', 'templates', 'task_template.md');
  let template = '';
  
  if (fs.existsSync(templatePath)) {
    template = fs.readFileSync(templatePath, 'utf8');
  } else {
    template = `---
title: "{title}"
id: "{id}"
priority: "{priority}"
project: "{project}"
due_date: "{due_date}"
created_at: "{created_at}"
tags: {tags}
---

# {title}

## 備忘録
${taskData.description || 'タスクの詳細な内容や実行中のメモをここに記載します。'}

## 参考リンク

## 進捗
- {created_at}: 初期作成
`;
  }
  
  // テンプレート内の変数を置換
  let content = template;
  Object.keys(data).forEach(key => {
    const value = key === 'tags' ? JSON.stringify(data[key as keyof TaskMetadata]) : data[key as keyof TaskMetadata];
    content = content.replace(new RegExp(`{${key}}`, 'g'), value as string);
  });
  
  // ファイルへの書き込み
  fs.writeFileSync(filePath, content, 'utf8');
  
  return filePath;
}

/**
 * タスクのステータスを変更する
 * @param taskFilePath タスクファイルのパス
 * @param newStatus 新しいステータス ('wip' or 'completed')
 * @returns 移動後のファイルパス
 */
export function changeTaskStatus(taskFilePath: string, newStatus: 'wip' | 'completed'): string {
  if (!fs.existsSync(taskFilePath)) {
    throw new Error(`タスクファイル ${taskFilePath} が見つかりません`);
  }
  
  const fileName = path.basename(taskFilePath);
  let targetDir: string;
  
  if (newStatus === 'wip') {
    targetDir = WIP_DIR;
  } else if (newStatus === 'completed') {
    const today = getTodayString();
    targetDir = path.join(COMPLETED_DIR, today);
  } else {
    throw new Error(`不明なステータス: ${newStatus}`);
  }
  
  // ターゲットディレクトリの存在確認と作成
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  const targetPath = path.join(targetDir, fileName);
  
  // ファイルを移動
  fs.renameSync(taskFilePath, targetPath);
  
  return targetPath;
}

/**
 * タスク一覧を取得する
 * @param status タスクのステータス ('todo', 'wip', 'completed', 'all')
 * @returns タスクファイルのリスト
 */
export function listTasks(status: TaskStatus | 'all' = 'all'): TaskFile[] {
  let tasks: TaskFile[] = [];
  
  if (status === 'all' || status === 'todo') {
    if (fs.existsSync(TODO_DIR)) {
      const todoTasks = fs.readdirSync(TODO_DIR)
        .filter(file => file.endsWith('.md'))
        .map(file => ({ 
          path: path.join(TODO_DIR, file),
          status: 'todo' as TaskStatus
        }));
      tasks = tasks.concat(todoTasks);
    }
  }
  
  if (status === 'all' || status === 'wip') {
    if (fs.existsSync(WIP_DIR)) {
      const wipTasks = fs.readdirSync(WIP_DIR)
        .filter(file => file.endsWith('.md'))
        .map(file => ({ 
          path: path.join(WIP_DIR, file),
          status: 'wip' as TaskStatus
        }));
      tasks = tasks.concat(wipTasks);
    }
  }
  
  if (status === 'all' || status === 'completed') {
    if (fs.existsSync(COMPLETED_DIR)) {
      let completedTasks: TaskFile[] = [];
      
      // 日付ディレクトリをスキャン
      fs.readdirSync(COMPLETED_DIR).forEach(dateDir => {
        const datePath = path.join(COMPLETED_DIR, dateDir);
        if (fs.statSync(datePath).isDirectory()) {
          const dateTasks = fs.readdirSync(datePath)
            .filter(file => file.endsWith('.md'))
            .map(file => ({ 
              path: path.join(datePath, file),
              status: 'completed' as TaskStatus,
              completedDate: dateDir
            }));
          completedTasks = completedTasks.concat(dateTasks);
        }
      });
      
      tasks = tasks.concat(completedTasks);
    }
  }
  
  return tasks;
}

/**
 * タスクのメタデータを解析する
 * @param filePath タスクファイルのパス
 * @returns タスクのメタデータ
 */
export function parseTaskMetadata(filePath: string): TaskMetadata {
  if (!fs.existsSync(filePath)) {
    throw new Error(`ファイル ${filePath} が見つかりません`);
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  
  if (!match) {
    return { 
      title: path.basename(filePath, '.md'),
      id: 'unknown',
      priority: 'medium',
      project: 'default',
      created_at: '',
      tags: []
    };
  }
  
  const metadataStr = match[1];
  const metadata: Partial<TaskMetadata> = {};
  
  metadataStr.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      let value = line.substring(colonIndex + 1).trim();
      
      // 引用符を削除
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      
      // 配列の処理
      if (key === 'tags' && value.startsWith('[') && value.endsWith(']')) {
        try {
          (metadata as any)[key] = JSON.parse(value);
        } catch (e) {
          (metadata as any)[key] = value.substring(1, value.length - 1).split(',').map(item => item.trim());
        }
      } else {
        (metadata as any)[key] = value;
      }
    }
  });
  
  return {
    title: metadata.title || path.basename(filePath, '.md'),
    id: metadata.id || 'unknown',
    priority: metadata.priority || 'medium',
    project: metadata.project || 'default',
    due_date: metadata.due_date,
    created_at: metadata.created_at || '',
    tags: metadata.tags || []
  };
}

/**
 * タスクを検索する
 * @param criteria 検索条件
 * @returns 該当するタスクのリスト
 */
export function searchTasks(criteria: TaskSearchCriteria = {}): TaskInfo[] {
  const allTasks = listTasks('all');
  
  return allTasks.filter(taskFile => {
    try {
      const metadata = parseTaskMetadata(taskFile.path);
      
      // ステータスでフィルタリング
      if (criteria.status && taskFile.status !== criteria.status) {
        return false;
      }
      
      // 優先度でフィルタリング
      if (criteria.priority && metadata.priority !== criteria.priority) {
        return false;
      }
      
      // プロジェクトでフィルタリング
      if (criteria.project && metadata.project !== criteria.project) {
        return false;
      }
      
      // タグでフィルタリング
      if (criteria.tag && (!metadata.tags || !metadata.tags.includes(criteria.tag))) {
        return false;
      }
      
      // 期限でフィルタリング
      if (criteria.due_before && metadata.due_date) {
        const dueDate = new Date(metadata.due_date);
        const beforeDate = new Date(criteria.due_before);
        if (dueDate > beforeDate) {
          return false;
        }
      }
      
      if (criteria.due_after && metadata.due_date) {
        const dueDate = new Date(metadata.due_date);
        const afterDate = new Date(criteria.due_after);
        if (dueDate < afterDate) {
          return false;
        }
      }
      
      // テキスト検索
      if (criteria.text) {
        const content = fs.readFileSync(taskFile.path, 'utf8');
        return content.toLowerCase().includes(criteria.text.toLowerCase());
      }
      
      return true;
    } catch (e) {
      console.error(`タスク ${taskFile.path} の解析中にエラーが発生しました:`, e);
      return false;
    }
  }).map(taskFile => {
    const metadata = parseTaskMetadata(taskFile.path);
    return {
      ...metadata,
      status: taskFile.status,
      completedDate: taskFile.completedDate,
      path: taskFile.path
    };
  });
} 