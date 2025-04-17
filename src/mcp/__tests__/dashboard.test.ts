// @ts-nocheck
import * as fs from 'fs-extra';
import * as path from 'path';
import { getDashboardData } from '../dashboard';

// タスクディレクトリのモック
jest.mock('../config', () => ({
  TASK_DIR: '/mock/tasks',
  TODO_DIR: '/mock/tasks/todo',
  WIP_DIR: '/mock/tasks/wip',
  COMPLETED_DIR: '/mock/tasks/completed'
}));

// fsモジュールをモック
jest.mock('fs-extra');
const mockedFs = fs as jest.Mocked<typeof fs>;

// 日付のモック用のスパイを管理
let dateToISOStringSpy;

describe('ダッシュボード機能テスト', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // existsSyncのデフォルト動作を設定
    mockedFs.existsSync.mockReturnValue(true);
    
    // モックをリストア
    if (dateToISOStringSpy) {
      dateToISOStringSpy.mockRestore();
    }
  });

  it('タスク数の集計が正しく行われることをテスト', async () => {
    // モックデータの設定（.md拡張子付きに修正）
    const todoTasks = [
      'task-abc.md',
      'task-def.md',
      'task-ghi.md'
    ];
    
    const wipTasks = [
      'task-jkl.md',
      'task-mno.md'
    ];
    
    const completedTasks = [
      'task-pqr.md',
      'task-stu.md',
      'task-vwx.md',
      'task-yz1.md'
    ];

    // モックタスクのコンテンツ
    const mockTaskContent = (title: string, priority: string, project?: string) => `---
title: ${title}
priority: ${priority}
${project ? `project: ${project}` : ''}
---

タスクの詳細説明`;

    // fsモジュールの関数をモック
    mockedFs.readdirSync.mockImplementation((dirPath) => {
      if (dirPath.toString().includes('todo')) return todoTasks;
      if (dirPath.toString().includes('wip')) return wipTasks;
      if (dirPath.toString().includes('completed')) return completedTasks;
      return [];
    });

    mockedFs.readFileSync.mockImplementation((filePath) => {
      const fileName = path.basename(filePath.toString());
      
      if (fileName === 'task-abc.md') {
        return mockTaskContent('高優先度タスク', 'high', 'プロジェクトA');
      } else if (fileName === 'task-def.md') {
        return mockTaskContent('中優先度タスク', 'medium', 'プロジェクトB');
      } else if (fileName === 'task-ghi.md') {
        return mockTaskContent('低優先度タスク', 'low', 'プロジェクトA');
      } else if (fileName === 'task-jkl.md') {
        return mockTaskContent('作業中タスク1', 'high', 'プロジェクトA');
      } else if (fileName === 'task-mno.md') {
        return mockTaskContent('作業中タスク2', 'medium', 'プロジェクトC');
      } else if (fileName === 'task-pqr.md') {
        return mockTaskContent('完了タスク1', 'high', 'プロジェクトA');
      } else {
        return mockTaskContent('その他のタスク', 'low');
      }
    });

    // ダッシュボードデータを取得
    const dashboardData = await getDashboardData();
    
    // タスク数の検証
    expect(dashboardData.taskCounts.todo).toBe(3);
    expect(dashboardData.taskCounts.wip).toBe(2);
    expect(dashboardData.taskCounts.completed).toBe(4);
    expect(dashboardData.taskCounts.total).toBe(9);
    
    // 優先度別の集計検証
    expect(dashboardData.priorityCounts.high).toBe(3);
    expect(dashboardData.priorityCounts.medium).toBe(2);
    expect(dashboardData.priorityCounts.low).toBeGreaterThanOrEqual(2);
    
    // プロジェクト別の集計検証
    expect(dashboardData.projectCounts['プロジェクトA']).toBe(4);
    expect(dashboardData.projectCounts['プロジェクトB']).toBe(1);
    expect(dashboardData.projectCounts['プロジェクトC']).toBe(1);
  });

  it('期限切れタスクが正しく識別されることをテスト', async () => {
    // 固定の日付を設定
    const TODAY_DATE_STRING = '2023-12-15';
    console.log('Test using fixed today date:', TODAY_DATE_STRING);
    
    // Date.prototype.toISOStringをモック
    dateToISOStringSpy = jest.spyOn(Date.prototype, 'toISOString').mockImplementation(function() {
      // 日付の変換時にYYYY-MM-DD部分だけ固定する
      return `${TODAY_DATE_STRING}T00:00:00.000Z`;
    });
    
    // タスクファイルの設定
    const todoFiles = ['task-abc.md', 'task-def.md', 'task-ghi.md'];
    
    // readdirSyncのモック
    mockedFs.readdirSync.mockImplementation((dirPath) => {
      return dirPath.toString().includes('todo') ? todoFiles : [];
    });
    
    // readFileSyncのモック - 期限日の設定
    mockedFs.readFileSync.mockImplementation((filePath) => {
      const fileName = path.basename(filePath.toString());
      
      if (fileName === 'task-abc.md') {
        return `---
title: 期限切れタスク
priority: high
due_date: 2023-12-14
---

期限切れ`;
      } else if (fileName === 'task-def.md') {
        return `---
title: 今日が期限のタスク
priority: medium
due_date: ${TODAY_DATE_STRING}
---

今日が期限`;
      } else if (fileName === 'task-ghi.md') {
        return `---
title: 期限内タスク
priority: low
due_date: 2023-12-20
---

期限内`;
      } else {
        return `---
title: その他のタスク
priority: low
---

その他のタスク`;
      }
    });

    // ダッシュボードデータを取得
    const dashboardData = await getDashboardData();
    console.log('Dashboard data:', JSON.stringify(dashboardData, null, 2));
    
    // 期限切れタスクの検証
    expect(dashboardData.overdueTasksCount).toBe(1);
    expect(dashboardData.dueTodayTasksCount).toBe(1);
  });
}); 