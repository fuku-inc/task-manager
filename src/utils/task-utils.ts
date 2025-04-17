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
const TASK_DIR = process.env.TASK_DIR || path.join(process.cwd(), 'tasks');
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
  
  // todoディレクトリのタスクを取得
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
  
  // wipディレクトリのタスクを取得
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
  
  // completedディレクトリのタスクを取得
  if (status === 'all' || status === 'completed') {
    if (fs.existsSync(COMPLETED_DIR)) {
      let completedTasks: TaskFile[] = [];
      
      // 日付ディレクトリをスキャン
      const dateDirs = fs.readdirSync(COMPLETED_DIR);
      for (const dateDir of dateDirs) {
        const datePath = path.join(COMPLETED_DIR, dateDir);
        
        if (fs.statSync(datePath).isDirectory()) {
          const dateFiles = fs.readdirSync(datePath)
            .filter(file => file.endsWith('.md'));
          
          const dateTasks = dateFiles.map(file => ({
            path: path.join(datePath, file),
            status: 'completed' as TaskStatus,
            completedDate: dateDir
          }));
          
          completedTasks = completedTasks.concat(dateTasks);
        }
      }
      
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

/**
 * タスクファイルを削除する
 * @param filePath タスクファイルのパス
 */
export function deleteTaskFile(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    throw new Error(`タスクファイル ${filePath} が見つかりません`);
  }
  
  fs.unlinkSync(filePath);
}

/**
 * タスクファイルを更新する
 * @param filePath タスクファイルのパス
 * @param updates 更新内容
 */
export function updateTaskFile(filePath: string, updates: Partial<TaskMetadata & { description?: string }>): void {
  if (!fs.existsSync(filePath)) {
    throw new Error(`タスクファイル ${filePath} が見つかりません`);
  }
  
  // ファイルの内容を読み込む
  const content = fs.readFileSync(filePath, 'utf8');
  
  // メタデータ部分と本文を分離
  const metadataMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!metadataMatch) {
    throw new Error(`タスクファイル ${filePath} の形式が不正です`);
  }
  
  const [, metadataStr, bodyContent] = metadataMatch;
  
  // 現在のメタデータを解析
  const currentMetadata: Record<string, any> = {};
  metadataStr.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      let value = line.substring(colonIndex + 1).trim();
      
      // 配列の処理
      if (key === 'tags' && value.startsWith('[') && value.endsWith(']')) {
        try {
          currentMetadata[key] = JSON.parse(value);
        } catch (e) {
          currentMetadata[key] = value.substring(1, value.length - 1).split(',').map(item => item.trim());
        }
      } else {
        currentMetadata[key] = value;
      }
    }
  });
  
  // 更新内容をマージ
  const updatedMetadata = { ...currentMetadata };
  Object.keys(updates).forEach(key => {
    if (key === 'due_date' || key === 'dueDate') {
      updatedMetadata['due_date'] = updates[key as keyof typeof updates] as string;
    } else if (key !== 'description') {
      updatedMetadata[key] = updates[key as keyof typeof updates];
    }
  });
  
  // メタデータ文字列を生成
  let newMetadataStr = '---\n';
  Object.keys(updatedMetadata).forEach(key => {
    let value = updatedMetadata[key];
    if (key === 'tags') {
      value = JSON.stringify(value);
    }
    newMetadataStr += `${key}: ${value}\n`;
  });
  newMetadataStr += '---\n';
  
  // 本文を更新（説明が指定されている場合）
  let newBodyContent = bodyContent;
  
  if (updates.description) {
    // マークダウンの本文から説明部分を検出して置換
    const titleMatch = bodyContent.match(/^# (.*?)(?:\n|$)/);
    if (titleMatch) {
      const title = titleMatch[1];
      
      // 元の説明部分を探す（「## 備忘録」セクションの内容）
      const descriptionRegex = /## 備忘録\n([\s\S]*?)(?=\n##|$)/;
      const descriptionMatch = bodyContent.match(descriptionRegex);
      
      if (descriptionMatch) {
        // 「## 備忘録」セクションがある場合、その内容を置換
        newBodyContent = bodyContent.replace(
          descriptionRegex, 
          `## 備忘録\n${updates.description}\n\n`
        );
      } else {
        // 「## 備忘録」セクションがない場合、タイトルの後に追加
        newBodyContent = bodyContent.replace(
          /^# .*?\n/, 
          `# ${updatedMetadata.title}\n\n## 備忘録\n${updates.description}\n\n`
        );
      }
    }
  }
  
  // タイトルの更新（タイトルが変更されている場合）
  if (updates.title && updates.title !== currentMetadata.title) {
    newBodyContent = newBodyContent.replace(/^# .*?\n/, `# ${updates.title}\n`);
  }
  
  // 更新内容を追記（進捗セクションがある場合）
  const today = getTodayString();
  const progressRegex = /## 進捗\n([\s\S]*?)(?=\n##|$)/;
  const progressMatch = newBodyContent.match(progressRegex);
  
  if (progressMatch) {
    // 更新内容の説明を生成
    let updateDescription = '';
    if (updates.title && updates.title !== currentMetadata.title) {
      updateDescription += `タイトルを「${currentMetadata.title}」から「${updates.title}」に変更`;
    }
    if (updates.priority && updates.priority !== currentMetadata.priority) {
      if (updateDescription) updateDescription += '、';
      updateDescription += `優先度を「${currentMetadata.priority}」から「${updates.priority}」に変更`;
    }
    if (updates.due_date && updates.due_date !== currentMetadata.due_date) {
      if (updateDescription) updateDescription += '、';
      updateDescription += `期限を${updates.due_date ? `「${updates.due_date}」に` : '削除'}`;
    }
    if (!updateDescription) {
      updateDescription = 'タスクを更新';
    }
    
    // 進捗セクションに追記
    newBodyContent = newBodyContent.replace(
      progressRegex,
      `## 進捗\n${progressMatch[1]}- ${today}: ${updateDescription}\n`
    );
  }
  
  // 更新したファイル内容を書き込む
  fs.writeFileSync(filePath, newMetadataStr + newBodyContent, 'utf8');
} 