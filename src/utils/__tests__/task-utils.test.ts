import * as fs from 'fs-extra';
import * as path from 'path';
import {
  createTask,
  listTasks,
  changeTaskStatus,
  parseTaskMetadata,
  searchTasks,
  generateTaskId,
  getTodayString
} from '../task-utils';

// テスト用の一時ディレクトリパス
const TEST_TASK_DIR = path.join(process.cwd(), 'tasks-test');
const TEST_TODO_DIR = path.join(TEST_TASK_DIR, 'todo');
const TEST_WIP_DIR = path.join(TEST_TASK_DIR, 'wip');
const TEST_COMPLETED_DIR = path.join(TEST_TASK_DIR, 'completed');

// task-utils内のTASK_DIRパスを上書きするためのモック
jest.mock('path', () => {
  const originalPath = jest.requireActual('path');
  return {
    ...originalPath,
    join: (...args: string[]) => {
      if (args[1] === 'tasks' && args.length === 2) {
        return TEST_TASK_DIR;
      }
      return originalPath.join(...args);
    }
  };
});

describe('Task Utils', () => {
  beforeAll(() => {
    // テスト用ディレクトリを作成
    if (!fs.existsSync(TEST_TASK_DIR)) {
      fs.mkdirSync(TEST_TASK_DIR, { recursive: true });
    }
    if (!fs.existsSync(TEST_TODO_DIR)) {
      fs.mkdirSync(TEST_TODO_DIR, { recursive: true });
    }
    if (!fs.existsSync(TEST_WIP_DIR)) {
      fs.mkdirSync(TEST_WIP_DIR, { recursive: true });
    }
    if (!fs.existsSync(TEST_COMPLETED_DIR)) {
      fs.mkdirSync(TEST_COMPLETED_DIR, { recursive: true });
    }
  });

  afterAll(() => {
    // テスト用ディレクトリを削除
    if (fs.existsSync(TEST_TASK_DIR)) {
      fs.removeSync(TEST_TASK_DIR);
    }
  });

  // 各テスト後にテストディレクトリをクリーンアップ
  afterEach(() => {
    fs.emptyDirSync(TEST_TODO_DIR);
    fs.emptyDirSync(TEST_WIP_DIR);
    fs.emptyDirSync(TEST_COMPLETED_DIR);
  });

  describe('generateTaskId', () => {
    it('ユニークなIDを生成する', () => {
      const id1 = generateTaskId();
      const id2 = generateTaskId();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^task-[a-z0-9]+-[a-f0-9]+$/);
    });
  });

  describe('getTodayString', () => {
    it('YYYY-MM-DD形式の日付を返す', () => {
      const dateStr = getTodayString();
      expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('createTask', () => {
    it('新しいタスクを作成する', () => {
      const taskData = {
        title: 'テストタスク',
        description: 'これはテストです',
        priority: 'high' as const,
        project: 'テストプロジェクト',
        tags: ['test', 'unittest']
      };

      const filePath = createTask(taskData);
      expect(fs.existsSync(filePath)).toBe(true);

      const metadata = parseTaskMetadata(filePath);
      expect(metadata.title).toBe(taskData.title);
      expect(metadata.priority).toBe(taskData.priority);
      expect(metadata.project).toBe(taskData.project);
      expect(metadata.tags).toEqual(taskData.tags);
    });
  });

  describe('listTasks', () => {
    it('タスク一覧を取得する', () => {
      // タスクを3つ作成
      createTask({ title: 'Todo Task' });
      
      const todoTasks = listTasks('todo');
      expect(todoTasks.length).toBe(1);
      expect(todoTasks[0].status).toBe('todo');

      // 1つをWIPに変更
      const wipFilePath = changeTaskStatus(todoTasks[0].path, 'wip');
      
      const wipTasks = listTasks('wip');
      expect(wipTasks.length).toBe(1);
      expect(wipTasks[0].status).toBe('wip');
      
      // 全タスク取得
      const allTasks = listTasks('all');
      expect(allTasks.length).toBe(2);
    });
  });

  describe('changeTaskStatus', () => {
    it('タスクのステータスを未着手から作業中に変更する', () => {
      // タスクを作成
      const filePath = createTask({ title: 'Status Test' });
      
      // WIPに変更
      const wipPath = changeTaskStatus(filePath, 'wip');
      expect(fs.existsSync(filePath)).toBe(false); // 元のファイルは存在しない
      expect(fs.existsSync(wipPath)).toBe(true); // 新しいパスに移動している
      expect(wipPath.includes('wip')).toBe(true);
    });

    it('タスクのステータスを作業中から完了に変更する', () => {
      // タスクを作成
      const todoPath = createTask({ title: 'Complete Test' });
      
      // WIPに変更
      const wipPath = changeTaskStatus(todoPath, 'wip');
      
      // 完了に変更
      const completedPath = changeTaskStatus(wipPath, 'completed');
      expect(fs.existsSync(wipPath)).toBe(false); // 元のファイルは存在しない
      expect(fs.existsSync(completedPath)).toBe(true); // 新しいパスに移動している
      expect(completedPath.includes('completed')).toBe(true);
    });
  });

  describe('searchTasks', () => {
    beforeEach(() => {
      // テスト用タスクを作成
      createTask({
        title: 'High Priority Task',
        priority: 'high',
        project: 'Project A',
        tags: ['important']
      });
      
      createTask({
        title: 'Medium Priority Task',
        priority: 'medium',
        project: 'Project B',
        tags: ['regular']
      });
      
      const lowTask = createTask({
        title: 'Low Priority Task',
        priority: 'low',
        project: 'Project A',
        due_date: '2025-05-01',
        tags: ['later']
      });
      
      // 1つのタスクをWIPに変更
      changeTaskStatus(lowTask, 'wip');
    });

    it('優先度でタスクを検索する', () => {
      const highTasks = searchTasks({ priority: 'high' });
      expect(highTasks.length).toBe(1);
      expect(highTasks[0].title).toBe('High Priority Task');
    });

    it('プロジェクトでタスクを検索する', () => {
      const projectATasks = searchTasks({ project: 'Project A' });
      expect(projectATasks.length).toBe(2);
    });

    it('タグでタスクを検索する', () => {
      const importantTasks = searchTasks({ tag: 'important' });
      expect(importantTasks.length).toBe(1);
      expect(importantTasks[0].title).toBe('High Priority Task');
    });

    it('ステータスでタスクを検索する', () => {
      const wipTasks = searchTasks({ status: 'wip' });
      expect(wipTasks.length).toBe(1);
      expect(wipTasks[0].title).toBe('Low Priority Task');
    });
  });
}); 