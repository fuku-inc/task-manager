import * as tasks from '../tasks';
import * as taskUtils from '../../utils/task-utils';

// taskUtilsのモック
jest.mock('../../utils/task-utils');

describe('Core Tasks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTask', () => {
    it('タスクを作成して正しいIDを返す', async () => {
      const mockFilePath = '/tasks/todo/task.md';
      const mockMetadata = { id: 'task-123', title: 'テストタスク' };
      
      (taskUtils.createTask as jest.Mock).mockReturnValue(mockFilePath);
      (taskUtils.parseTaskMetadata as jest.Mock).mockReturnValue(mockMetadata);

      const result = await tasks.createTask({
        title: 'テストタスク',
        description: 'テスト説明',
        dueDate: new Date('2023-12-31')
      });

      expect(taskUtils.createTask).toHaveBeenCalledWith({
        title: 'テストタスク',
        description: 'テスト説明',
        due_date: '2023-12-31'
      });
      
      expect(taskUtils.parseTaskMetadata).toHaveBeenCalledWith(mockFilePath);
      expect(result).toBe('task-123');
    });
  });

  describe('listTasks', () => {
    it('タスク一覧を取得して正しい形式に変換する', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          title: 'タスク1',
          priority: 'high' as const,
          project: 'プロジェクト1',
          due_date: '2023-12-31',
          created_at: '2023-11-01',
          tags: ['タグ1', 'タグ2'],
          status: 'todo' as const,
          path: '/tasks/todo/task1.md'
        },
        {
          id: 'task-2',
          title: 'タスク2',
          priority: 'medium' as const,
          project: 'プロジェクト2',
          created_at: '2023-11-02',
          tags: [],
          status: 'completed' as const,
          completedDate: '2023-11-10',
          path: '/tasks/completed/2023-11-10/task2.md'
        }
      ];
      
      (taskUtils.searchTasks as jest.Mock).mockReturnValue(mockTasks);

      const result = await tasks.listTasks({ status: 'todo' });

      expect(taskUtils.searchTasks).toHaveBeenCalledWith({ status: 'todo' });
      expect(result).toHaveLength(2);
      
      // 最初のタスクの検証
      expect(result[0]).toEqual({
        id: 'task-1',
        title: 'タスク1',
        description: '',
        priority: 'high',
        project: 'プロジェクト1',
        dueDate: expect.any(Date),
        completed: false,
        createdAt: '2023-11-01',
        tags: ['タグ1', 'タグ2'],
        path: '/tasks/todo/task1.md'
      });
      
      // 2番目のタスクの検証
      expect(result[1]).toEqual({
        id: 'task-2',
        title: 'タスク2',
        description: '',
        priority: 'medium',
        project: 'プロジェクト2',
        dueDate: undefined,
        completed: true,
        completedDate: '2023-11-10',
        createdAt: '2023-11-02',
        tags: [],
        path: '/tasks/completed/2023-11-10/task2.md'
      });
    });
  });

  describe('completeTask', () => {
    it('作業中のタスクを完了状態に変更する', async () => {
      const mockTask = {
        path: '/tasks/wip/task.md',
        status: 'wip' as const
      };
      
      const mockTasks = [mockTask];
      const mockMetadata = { id: 'task-123' };
      
      (taskUtils.listTasks as jest.Mock).mockReturnValue(mockTasks);
      (taskUtils.parseTaskMetadata as jest.Mock).mockReturnValue(mockMetadata);
      (taskUtils.changeTaskStatus as jest.Mock).mockReturnValue('/tasks/completed/2023-11-10/task.md');

      await tasks.completeTask('task-123');

      expect(taskUtils.listTasks).toHaveBeenCalledWith('all');
      expect(taskUtils.parseTaskMetadata).toHaveBeenCalledWith(mockTask.path);
      expect(taskUtils.changeTaskStatus).toHaveBeenCalledWith(mockTask.path, 'completed');
    });

    it('タスクが見つからない場合はエラーをスローする', async () => {
      (taskUtils.listTasks as jest.Mock).mockReturnValue([]);

      await expect(tasks.completeTask('non-existent')).rejects.toThrow('タスク "non-existent" が見つかりません');
    });

    it('作業中でないタスクの場合はエラーをスローする', async () => {
      const mockTask = {
        path: '/tasks/todo/task.md',
        status: 'todo' as const
      };
      
      const mockTasks = [mockTask];
      const mockMetadata = { id: 'task-123' };
      
      (taskUtils.listTasks as jest.Mock).mockReturnValue(mockTasks);
      (taskUtils.parseTaskMetadata as jest.Mock).mockReturnValue(mockMetadata);

      await expect(tasks.completeTask('task-123')).rejects.toThrow('タスク "task-123" は作業中ではないため完了にできません');
    });
  });

  describe('deleteTask', () => {
    it('タスクを削除する', async () => {
      const mockTask = {
        path: '/tasks/todo/task.md',
        status: 'todo' as const
      };
      
      const mockTasks = [mockTask];
      const mockMetadata = { id: 'task-123' };
      
      (taskUtils.listTasks as jest.Mock).mockReturnValue(mockTasks);
      (taskUtils.parseTaskMetadata as jest.Mock).mockReturnValue(mockMetadata);
      const deleteTaskFileMock = jest.fn();
      (taskUtils as any).deleteTaskFile = deleteTaskFileMock;

      await tasks.deleteTask('task-123');

      expect(taskUtils.listTasks).toHaveBeenCalledWith('all');
      expect(taskUtils.parseTaskMetadata).toHaveBeenCalledWith(mockTask.path);
      expect(deleteTaskFileMock).toHaveBeenCalledWith(mockTask.path);
    });

    it('タスクが見つからない場合はエラーをスローする', async () => {
      (taskUtils.listTasks as jest.Mock).mockReturnValue([]);

      await expect(tasks.deleteTask('non-existent')).rejects.toThrow('タスク "non-existent" が見つかりません');
    });
  });
}); 