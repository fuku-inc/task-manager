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

// サーバー起動
const port = 3000;
console.log(`MCPサーバーを起動しています: http://localhost:${port}`);
serve({
  fetch: app.fetch,
  port
}); 