import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import { app } from '../index';
import * as taskAdapter from '../adapters/taskAdapter';

// アダプターのモック
jest.mock('../adapters/taskAdapter');

describe('MCPサーバー', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /mcp/task_create', () => {
    it('タスク作成エンドポイントが正しく動作する', async () => {
      const mockResult = { id: 'task-123' };
      (taskAdapter.mcp_task_create as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app.fetch as any)
        .post('/mcp/task_create')
        .send({ title: 'テストタスク' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResult);
      expect(taskAdapter.mcp_task_create).toHaveBeenCalledWith({ title: 'テストタスク' });
    });
  });

  describe('POST /mcp/task_list', () => {
    it('タスク一覧エンドポイントが正しく動作する', async () => {
      const mockTasks = { tasks: [{ id: 'task-1', title: 'タスク1' }] };
      (taskAdapter.mcp_task_list as jest.Mock).mockResolvedValue(mockTasks);

      const response = await request(app.fetch as any)
        .post('/mcp/task_list')
        .send({ filter: { status: 'todo' } });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockTasks);
      expect(taskAdapter.mcp_task_list).toHaveBeenCalledWith({ filter: { status: 'todo' } });
    });
  });

  describe('POST /mcp/task_complete', () => {
    it('タスク完了エンドポイントが正しく動作する', async () => {
      const mockResult = { success: true };
      (taskAdapter.mcp_task_complete as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app.fetch as any)
        .post('/mcp/task_complete')
        .send({ id: 'task-123' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResult);
      expect(taskAdapter.mcp_task_complete).toHaveBeenCalledWith({ id: 'task-123' });
    });
  });

  describe('POST /mcp/task_delete', () => {
    it('タスク削除エンドポイントが正しく動作する', async () => {
      const mockResult = { success: true };
      (taskAdapter.mcp_task_delete as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app.fetch as any)
        .post('/mcp/task_delete')
        .send({ id: 'task-123' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResult);
      expect(taskAdapter.mcp_task_delete).toHaveBeenCalledWith({ id: 'task-123' });
    });
  });

  describe('POST /mcp/task_update', () => {
    it('タスク更新エンドポイントが正しく動作する', async () => {
      const mockResult = { success: true };
      (taskAdapter.mcp_task_update as jest.Mock).mockResolvedValue(mockResult);

      const updateData = {
        id: 'task-123',
        title: '更新タイトル',
        description: '更新説明'
      };

      const response = await request(app.fetch as any)
        .post('/mcp/task_update')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResult);
      expect(taskAdapter.mcp_task_update).toHaveBeenCalledWith(updateData);
    });
  });
}); 