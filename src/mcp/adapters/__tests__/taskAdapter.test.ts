import * as taskAdapter from '../taskAdapter';
import * as coreTasks from '../../../core/tasks';

// coreTasks のモック
jest.mock('../../../core/tasks');

describe('Task MCPアダプター', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('mcp_task_create', () => {
    it('タスクを作成して成功する', async () => {
      const mockTaskId = 'task-123';
      (coreTasks.createTask as jest.Mock).mockResolvedValue(mockTaskId);

      const result = await taskAdapter.mcp_task_create({
        title: 'テストタスク',
        description: 'テスト説明'
      });

      expect(coreTasks.createTask).toHaveBeenCalledWith({
        title: 'テストタスク',
        description: 'テスト説明',
        completed: false,
        dueDate: undefined
      });
      expect(result).toEqual({ id: mockTaskId });
    });
  });

  describe('mcp_task_list', () => {
    it('タスク一覧を取得する', async () => {
      const mockTasks = [
        {
          id: 'task-1',
          title: 'タスク1',
          completed: false
        },
        {
          id: 'task-2',
          title: 'タスク2',
          completed: true
        }
      ];
      (coreTasks.listTasks as jest.Mock).mockResolvedValue(mockTasks);

      const result = await taskAdapter.mcp_task_list({
        filter: { status: 'todo' }
      });

      expect(coreTasks.listTasks).toHaveBeenCalledWith({ status: 'todo' });
      expect(result).toEqual({ tasks: mockTasks });
    });
  });

  describe('mcp_task_complete', () => {
    it('タスクを完了に設定する', async () => {
      (coreTasks.completeTask as jest.Mock).mockResolvedValue(undefined);

      const result = await taskAdapter.mcp_task_complete({
        id: 'task-123'
      });

      expect(coreTasks.completeTask).toHaveBeenCalledWith('task-123');
      expect(result).toEqual({ success: true });
    });
  });

  describe('mcp_task_delete', () => {
    it('タスクを削除する', async () => {
      (coreTasks.deleteTask as jest.Mock).mockResolvedValue(undefined);

      const result = await taskAdapter.mcp_task_delete({
        id: 'task-123'
      });

      expect(coreTasks.deleteTask).toHaveBeenCalledWith('task-123');
      expect(result).toEqual({ success: true });
    });
  });

  describe('mcp_task_update', () => {
    it('タスクを更新する', async () => {
      (coreTasks.updateTask as jest.Mock).mockResolvedValue(undefined);

      const result = await taskAdapter.mcp_task_update({
        id: 'task-123',
        title: '更新タイトル',
        description: '更新説明',
        dueDate: '2023-12-31'
      });

      expect(coreTasks.updateTask).toHaveBeenCalledWith('task-123', {
        title: '更新タイトル',
        description: '更新説明',
        dueDate: expect.any(Date)
      });
      expect(result).toEqual({ success: true });
    });
  });
}); 