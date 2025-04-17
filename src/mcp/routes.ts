import { Router } from 'express';
import * as taskController from './controllers/taskController';

const router = Router();

// MCP関数ルート
router.post('/task/create', taskController.createTask);
router.post('/task/list', taskController.listTasks);
router.post('/task/complete', taskController.completeTask);
router.post('/task/delete', taskController.deleteTask);
router.post('/task/update', taskController.updateTask);

export { router }; 