import * as taskUtils from '../utils/task-utils';
import { 
  TaskInfo, 
  TaskSearchCriteria,
  TaskStatus
} from '../types/Task';
import {
  CreateTaskArgs,
  ChangeTaskStatusArgs,
  SearchTasksArgs,
  GetTaskArgs,
  GetTodayTasksArgs,
  TaskOperationResult,
  TaskSearchResult
} from './types';
import path from 'path';

/**
 * MCP用タスク管理サービス
 */
export class TaskService {
  /**
   * 新しいタスクを作成する
   */
  createTask(args: CreateTaskArgs): TaskOperationResult {
    try {
      if (!args.title) {
        return {
          success: false,
          message: 'タイトルは必須です'
        };
      }

      const filePath = taskUtils.createTask({
        title: args.title,
        description: args.description,
        priority: args.priority,
        project: args.project,
        due_date: args.due_date,
        tags: args.tags
      });

      const taskId = path.basename(filePath, '.md');
      const allTasks = taskUtils.searchTasks();
      const createdTask = allTasks.find(task => task.path === filePath);

      return {
        success: true,
        message: `タスク "${args.title}" が作成されました`,
        task: createdTask
      };
    } catch (error) {
      return {
        success: false,
        message: `タスク作成中にエラーが発生しました: ${error}`
      };
    }
  }

  /**
   * タスクのステータスを変更する
   */
  changeTaskStatus(args: ChangeTaskStatusArgs): TaskOperationResult {
    try {
      const allTasks = taskUtils.listTasks('all');
      const targetTask = allTasks.find(task => {
        try {
          const metadata = taskUtils.parseTaskMetadata(task.path);
          return metadata.id === args.task_id;
        } catch {
          return false;
        }
      });

      if (!targetTask) {
        return {
          success: false,
          message: `ID: ${args.task_id} のタスクが見つかりません`
        };
      }

      // 既に目的のステータスになっている場合はスキップ
      if (
        (args.new_status === 'wip' && targetTask.status === 'wip') ||
        (args.new_status === 'completed' && targetTask.status === 'completed')
      ) {
        const metadata = taskUtils.parseTaskMetadata(targetTask.path);
        return {
          success: true,
          message: `タスク "${metadata.title}" は既に${args.new_status === 'wip' ? '作業中' : '完了'}です`,
          task: { ...metadata, ...targetTask }
        };
      }

      // todo → wip または wip → completed のみ許可
      if (
        (args.new_status === 'wip' && targetTask.status !== 'todo') ||
        (args.new_status === 'completed' && targetTask.status !== 'wip')
      ) {
        return {
          success: false,
          message: `不正なステータス変更: ${targetTask.status} → ${args.new_status}`
        };
      }

      const newPath = taskUtils.changeTaskStatus(targetTask.path, args.new_status);
      const metadata = taskUtils.parseTaskMetadata(newPath);

      return {
        success: true,
        message: `タスク "${metadata.title}" を${args.new_status === 'wip' ? '作業中' : '完了'}に設定しました`,
        task: {
          ...metadata,
          status: args.new_status,
          path: newPath,
          completedDate: args.new_status === 'completed' ? taskUtils.getTodayString() : undefined
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `タスクステータス変更中にエラーが発生しました: ${error}`
      };
    }
  }

  /**
   * タスクを検索する
   */
  searchTasks(args: SearchTasksArgs): TaskSearchResult {
    try {
      const criteria: TaskSearchCriteria = { ...args };
      const tasks = taskUtils.searchTasks(criteria);

      return {
        success: true,
        message: `${tasks.length}件のタスクが見つかりました`,
        tasks
      };
    } catch (error) {
      return {
        success: false,
        message: `タスク検索中にエラーが発生しました: ${error}`,
        tasks: []
      };
    }
  }

  /**
   * 特定のタスクを取得する
   */
  getTask(args: GetTaskArgs): TaskOperationResult {
    try {
      const allTasks = taskUtils.searchTasks();
      const task = allTasks.find(t => t.id === args.task_id);

      if (!task) {
        return {
          success: false,
          message: `ID: ${args.task_id} のタスクが見つかりません`
        };
      }

      return {
        success: true,
        message: 'タスクが見つかりました',
        task
      };
    } catch (error) {
      return {
        success: false,
        message: `タスク取得中にエラーが発生しました: ${error}`
      };
    }
  }

  /**
   * 今日のタスクを取得する
   */
  getTodayTasks(args: GetTodayTasksArgs = {}): TaskSearchResult {
    try {
      const today = taskUtils.getTodayString();
      const dueTodayTasks = taskUtils.searchTasks({
        due_after: today,
        status: 'todo'
      });

      const wipTasks = taskUtils.searchTasks({
        status: 'wip'
      });

      let tasks = [...dueTodayTasks, ...wipTasks];

      // 期限切れのタスクを含める場合
      if (args.include_overdue) {
        const overdueTasks = taskUtils.searchTasks();
        const filteredOverdue = overdueTasks.filter(task => {
          if (!task.due_date || task.status !== 'todo') return false;
          const dueDate = new Date(task.due_date);
          const todayDate = new Date(today);
          return dueDate < todayDate;
        });
        
        tasks = [...tasks, ...filteredOverdue];
      }

      // 重複を削除
      const uniqueTasks = Array.from(new Set(tasks.map(t => t.id)))
        .map(id => tasks.find(t => t.id === id)!);

      return {
        success: true,
        message: `${uniqueTasks.length}件の今日のタスクが見つかりました`,
        tasks: uniqueTasks
      };
    } catch (error) {
      return {
        success: false,
        message: `今日のタスク取得中にエラーが発生しました: ${error}`,
        tasks: []
      };
    }
  }

  /**
   * すべてのステータスのタスクを取得する
   */
  getAllTasks(): TaskSearchResult {
    try {
      const tasks = taskUtils.searchTasks();
      
      return {
        success: true,
        message: `${tasks.length}件のタスクが見つかりました`,
        tasks
      };
    } catch (error) {
      return {
        success: false,
        message: `タスク取得中にエラーが発生しました: ${error}`,
        tasks: []
      };
    }
  }
} 