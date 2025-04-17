import express from 'express';
import bodyParser from 'body-parser';
import { TaskService } from './task-service';
import { 
  CreateTaskArgs, 
  ChangeTaskStatusArgs,
  SearchTasksArgs,
  GetTaskArgs,
  GetTodayTasksArgs
} from './types';

/**
 * MCPサーバークラス
 */
export class MCPServer {
  private app: express.Application;
  private taskService: TaskService;
  private port: number;

  constructor(port: number = 3000) {
    this.app = express();
    this.taskService = new TaskService();
    this.port = port;
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * ミドルウェアの設定
   */
  private setupMiddleware(): void {
    this.app.use(bodyParser.json());
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      next();
    });
  }

  /**
   * ルーティングの設定
   */
  private setupRoutes(): void {
    this.app.post('/mcp_tasks_create_task', (req, res) => {
      const args: CreateTaskArgs = req.body;
      const result = this.taskService.createTask(args);
      res.json(result);
    });

    this.app.post('/mcp_tasks_change_status', (req, res) => {
      const args: ChangeTaskStatusArgs = req.body;
      const result = this.taskService.changeTaskStatus(args);
      res.json(result);
    });

    this.app.post('/mcp_tasks_search_tasks', (req, res) => {
      const args: SearchTasksArgs = req.body;
      const result = this.taskService.searchTasks(args);
      res.json(result);
    });

    this.app.post('/mcp_tasks_get_task', (req, res) => {
      const args: GetTaskArgs = req.body;
      const result = this.taskService.getTask(args);
      res.json(result);
    });

    this.app.post('/mcp_tasks_get_today_tasks', (req, res) => {
      const args: GetTodayTasksArgs = req.body;
      const result = this.taskService.getTodayTasks(args);
      res.json(result);
    });

    this.app.post('/mcp_tasks_get_all_tasks', (req, res) => {
      const result = this.taskService.getAllTasks();
      res.json(result);
    });

    // MCP関数のスキーマを提供するエンドポイント
    this.app.get('/mcp-schema', (req, res) => {
      const schema = this.getMCPSchema();
      res.json(schema);
    });
  }

  /**
   * MCP関数のスキーマを取得する
   */
  private getMCPSchema(): any {
    return {
      functions: [
        {
          name: "mcp_tasks_create_task",
          description: "新しいタスクを作成します",
          parameters: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "タスクのタイトル"
              },
              description: {
                type: "string",
                description: "タスクの説明"
              },
              priority: {
                type: "string",
                enum: ["high", "medium", "low"],
                description: "タスクの優先度"
              },
              project: {
                type: "string",
                description: "タスクの関連プロジェクト"
              },
              due_date: {
                type: "string",
                description: "タスクの期限（YYYY-MM-DD形式）"
              },
              tags: {
                type: "array",
                items: {
                  type: "string"
                },
                description: "タスクに付けるタグ"
              }
            },
            required: ["title"]
          }
        },
        {
          name: "mcp_tasks_change_status",
          description: "タスクのステータスを変更します",
          parameters: {
            type: "object",
            properties: {
              task_id: {
                type: "string",
                description: "変更するタスクのID"
              },
              new_status: {
                type: "string",
                enum: ["wip", "completed"],
                description: "新しいステータス。'wip'（作業中）または'completed'（完了）"
              }
            },
            required: ["task_id", "new_status"]
          }
        },
        {
          name: "mcp_tasks_search_tasks",
          description: "条件に一致するタスクを検索します",
          parameters: {
            type: "object",
            properties: {
              status: {
                type: "string",
                enum: ["todo", "wip", "completed"],
                description: "タスクのステータス"
              },
              priority: {
                type: "string",
                enum: ["high", "medium", "low"],
                description: "タスクの優先度"
              },
              project: {
                type: "string",
                description: "タスクの関連プロジェクト"
              },
              tag: {
                type: "string",
                description: "タスクに付けられたタグ"
              },
              due_before: {
                type: "string",
                description: "この日付より前に期限があるタスク（YYYY-MM-DD形式）"
              },
              due_after: {
                type: "string",
                description: "この日付より後に期限があるタスク（YYYY-MM-DD形式）"
              },
              text: {
                type: "string",
                description: "タスクのタイトルや説明に含まれるテキスト"
              }
            }
          }
        },
        {
          name: "mcp_tasks_get_task",
          description: "特定のIDを持つタスクを取得します",
          parameters: {
            type: "object",
            properties: {
              task_id: {
                type: "string",
                description: "取得するタスクのID"
              }
            },
            required: ["task_id"]
          }
        },
        {
          name: "mcp_tasks_get_today_tasks",
          description: "今日のタスク（今日が期限のタスクと作業中のタスク）を取得します",
          parameters: {
            type: "object",
            properties: {
              include_overdue: {
                type: "boolean",
                description: "期限切れのタスクも含めるかどうか"
              }
            }
          }
        },
        {
          name: "mcp_tasks_get_all_tasks",
          description: "すべてのタスクを取得します",
          parameters: {
            type: "object",
            properties: {}
          }
        }
      ]
    };
  }

  /**
   * サーバーを起動する
   */
  start(): void {
    this.app.listen(this.port, () => {
      console.log(`MCPサーバーが起動しました: http://localhost:${this.port}`);
      console.log(`MCP関数スキーマ: http://localhost:${this.port}/mcp-schema`);
    });
  }
} 