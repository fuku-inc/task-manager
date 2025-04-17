import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import * as taskAdapter from './adapters/taskAdapter';

// MCPサーバーの設定
export const app = new Hono();
app.use(logger());
app.use(cors());

// タスク関連のMCP関数を登録
app.post('/mcp/task_create', async (c) => {
  const args = await c.req.json();
  const result = await taskAdapter.mcp_task_create(args);
  return c.json(result);
});

app.post('/mcp/task_list', async (c) => {
  const args = await c.req.json();
  const result = await taskAdapter.mcp_task_list(args);
  return c.json(result);
});

app.post('/mcp/task_complete', async (c) => {
  const args = await c.req.json();
  const result = await taskAdapter.mcp_task_complete(args);
  return c.json(result);
});

app.post('/mcp/task_delete', async (c) => {
  const args = await c.req.json();
  const result = await taskAdapter.mcp_task_delete(args);
  return c.json(result);
});

app.post('/mcp/task_update', async (c) => {
  const args = await c.req.json();
  const result = await taskAdapter.mcp_task_update(args);
  return c.json(result);
});

// 新しいエンドポイント: タスクステータス変更
app.post('/mcp/task_change_status', async (c) => {
  const args = await c.req.json();
  const result = await taskAdapter.mcp_task_change_status(args);
  return c.json(result);
});

// MCPスキーマの定義
app.get('/mcp-schema', async (c) => {
  const schema = {
    functions: [
      {
        name: 'mcp_task_create',
        description: 'Create a new task',
        parameters: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Task title'
            },
            description: {
              type: 'string',
              description: 'Task description'
            },
            dueDate: {
              type: 'string',
              description: 'Due date in YYYY-MM-DD format'
            },
            priority: {
              type: 'string',
              enum: ['high', 'medium', 'low'],
              description: 'Task priority'
            },
            project: {
              type: 'string',
              description: 'Project name'
            },
            tags: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Task tags'
            }
          },
          required: ['title']
        }
      },
      {
        name: 'mcp_task_list',
        description: 'Get task list with optional filter',
        parameters: {
          type: 'object',
          properties: {
            filter: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  enum: ['todo', 'wip', 'completed', 'all'],
                  description: 'Filter by task status'
                },
                priority: {
                  type: 'string',
                  enum: ['high', 'medium', 'low'],
                  description: 'Filter by priority'
                },
                project: {
                  type: 'string',
                  description: 'Filter by project name'
                },
                tag: {
                  type: 'string',
                  description: 'Filter by tag'
                }
              }
            }
          }
        }
      },
      {
        name: 'mcp_task_update',
        description: 'Update an existing task',
        parameters: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Task ID'
            },
            title: {
              type: 'string',
              description: 'New task title'
            },
            description: {
              type: 'string',
              description: 'New task description'
            },
            dueDate: {
              type: 'string',
              description: 'New due date in YYYY-MM-DD format'
            },
            priority: {
              type: 'string',
              enum: ['high', 'medium', 'low'],
              description: 'New task priority'
            },
            tags: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'New task tags'
            }
          },
          required: ['id']
        }
      },
      {
        name: 'mcp_task_delete',
        description: 'Delete a task',
        parameters: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Task ID to delete'
            }
          },
          required: ['id']
        }
      },
      {
        name: 'mcp_task_complete',
        description: 'Mark a task as completed',
        parameters: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Task ID to complete'
            }
          },
          required: ['id']
        }
      },
      {
        name: 'mcp_task_change_status',
        description: 'Change task status',
        parameters: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Task ID'
            },
            status: {
              type: 'string',
              enum: ['todo', 'wip', 'completed'],
              description: 'New status for the task'
            }
          },
          required: ['id', 'status']
        }
      }
    ]
  };
  
  return c.json(schema);
});

// サーバー起動
const port = 3000;
console.log(`MCPサーバーを起動しています: http://localhost:${port}`);
serve({
  fetch: app.fetch,
  port
}); 