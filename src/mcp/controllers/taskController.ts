import { Request, Response } from 'express';
import { createTask as coreCreateTask, listTasks as coreListTasks, completeTask as coreCompleteTask, deleteTask as coreDeleteTask, updateTask as coreUpdateTask } from '../../core/tasks';

// タスク作成
export const createTask = async (req: Request, res: Response) => {
  try {
    const { title, description, dueDate } = req.body;
    const task = await coreCreateTask({
      title,
      description,
      dueDate: dueDate ? new Date(dueDate) : undefined
    });
    res.json({
      success: true,
      data: task
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// タスク一覧取得
export const listTasks = async (req: Request, res: Response) => {
  try {
    const tasks = await coreListTasks(req.body.filter);
    res.json({
      success: true,
      data: tasks
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// タスク完了
export const completeTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    const task = await coreCompleteTask(id);
    res.json({
      success: true,
      data: task
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// タスク削除
export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    await coreDeleteTask(id);
    res.json({
      success: true
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// タスク更新
export const updateTask = async (req: Request, res: Response) => {
  try {
    const { id, title, description, dueDate } = req.body;
    const task = await coreUpdateTask(id, { title, description, dueDate });
    res.json({
      success: true,
      data: task
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}; 