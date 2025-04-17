import * as fs from 'fs-extra';
import * as path from 'path';
import { spawnSync } from 'child_process';

// テスト用の一時ディレクトリパス
const TEST_TASK_DIR = path.join(process.cwd(), 'tasks-test-scripts');
const TEST_TODO_DIR = path.join(TEST_TASK_DIR, 'todo');
const TEST_WIP_DIR = path.join(TEST_TASK_DIR, 'wip');
const TEST_COMPLETED_DIR = path.join(TEST_TASK_DIR, 'completed');

// 環境変数をモックするためのオリジナルを保存
const originalEnv = process.env;

describe('コマンドラインスクリプトテスト', () => {
  beforeAll(() => {
    // テスト用ディレクトリを作成
    if (!fs.existsSync(TEST_TASK_DIR)) {
      fs.mkdirSync(TEST_TASK_DIR, { recursive: true });
    }
    if (!fs.existsSync(TEST_TODO_DIR)) {
      fs.mkdirSync(TEST_TODO_DIR, { recursive: true });
    }
    if (!fs.existsSync(TEST_WIP_DIR)) {
      fs.mkdirSync(TEST_WIP_DIR, { recursive: true });
    }
    if (!fs.existsSync(TEST_COMPLETED_DIR)) {
      fs.mkdirSync(TEST_COMPLETED_DIR, { recursive: true });
    }

    // 環境変数を設定
    process.env = {
      ...originalEnv,
      TASK_DIR: TEST_TASK_DIR
    };
  });

  afterAll(() => {
    // テスト用ディレクトリを削除
    if (fs.existsSync(TEST_TASK_DIR)) {
      fs.removeSync(TEST_TASK_DIR);
    }

    // 環境変数を元に戻す
    process.env = originalEnv;
  });

  // 各テスト後にテストディレクトリをクリーンアップ
  afterEach(() => {
    fs.emptyDirSync(TEST_TODO_DIR);
    fs.emptyDirSync(TEST_WIP_DIR);
    fs.emptyDirSync(TEST_COMPLETED_DIR);
  });

  function runScript(scriptName: string, args: string[] = []): { stdout: string, stderr: string, exitCode: number } {
    const result = spawnSync('node', [
      '-r', 'ts-node/register',
      path.join(process.cwd(), 'src', 'scripts', `${scriptName}.ts`),
      ...args
    ], {
      encoding: 'utf-8',
      env: process.env
    });

    return {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.status
    };
  }

  it('タスク作成スクリプトのテスト', () => {
    // 標準入力をモックするために、スクリプトに直接引数を渡すバージョンでテスト
    const result = runScript('create-task', [
      '--title', 'スクリプトテスト',
      '--priority', 'high',
      '--project', 'テストプロジェクト',
      '--tags', 'script,test'
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('タスクが作成されました');
    
    // ファイルが作成されたことを確認
    const todoFiles = fs.readdirSync(TEST_TODO_DIR);
    expect(todoFiles.length).toBe(1);
    
    // タスクファイルの内容を確認
    const taskFilePath = path.join(TEST_TODO_DIR, todoFiles[0]);
    const taskContent = fs.readFileSync(taskFilePath, 'utf-8');
    expect(taskContent).toContain('title: スクリプトテスト');
    expect(taskContent).toContain('priority: high');
    expect(taskContent).toContain('project: テストプロジェクト');
    expect(taskContent).toContain('tags: [script, test]');
  });

  it('タスク一覧表示スクリプトのテスト', () => {
    // テスト用のタスクを作成
    runScript('create-task', [
      '--title', 'タスク1',
      '--priority', 'high'
    ]);
    
    runScript('create-task', [
      '--title', 'タスク2',
      '--priority', 'medium'
    ]);
    
    // タスク一覧を取得
    const result = runScript('list-tasks');
    
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('タスク1');
    expect(result.stdout).toContain('タスク2');
    expect(result.stdout).toContain('未着手');
    expect(result.stdout).toContain('合計: 2');
  });

  it('タスクステータス変更スクリプトのテスト', () => {
    // テスト用のタスクを作成
    runScript('create-task', [
      '--title', 'ステータス変更テスト',
      '--priority', 'high'
    ]);
    
    // タスクIDを取得するためにタスク一覧を表示
    const listResult = runScript('list-tasks');
    const taskIdMatch = listResult.stdout.match(/task-[a-z0-9]{3}/);
    expect(taskIdMatch).not.toBeNull();
    
    const taskId = taskIdMatch![0];
    
    // 作業中に変更（自動選択モード）
    const startResult = runScript('change-task-status', ['start', '--id', taskId]);
    expect(startResult.exitCode).toBe(0);
    expect(startResult.stdout).toContain('タスクのステータスが「作業中」に変更されました');
    
    // 変更されたことを確認
    const wipListResult = runScript('list-tasks');
    expect(wipListResult.stdout).toContain('進行中');
    expect(wipListResult.stdout).toContain('ステータス変更テスト');
    
    // 完了に変更
    const completeResult = runScript('change-task-status', ['complete', '--id', taskId]);
    expect(completeResult.exitCode).toBe(0);
    expect(completeResult.stdout).toContain('タスクのステータスが「完了」に変更されました');
    
    // 変更されたことを確認
    const completedListResult = runScript('list-tasks');
    expect(completedListResult.stdout).toContain('完了');
    expect(completedListResult.stdout).toContain('ステータス変更テスト');
  });

  it('タスク検索スクリプトのテスト', () => {
    // テスト用のタスクを複数作成
    runScript('create-task', [
      '--title', '重要タスク',
      '--priority', 'high',
      '--project', 'プロジェクトA'
    ]);
    
    runScript('create-task', [
      '--title', '通常タスク',
      '--priority', 'medium',
      '--project', 'プロジェクトB'
    ]);
    
    // プロジェクトで検索
    const projectResult = runScript('search-tasks', ['--project', 'プロジェクトA']);
    expect(projectResult.exitCode).toBe(0);
    expect(projectResult.stdout).toContain('重要タスク');
    expect(projectResult.stdout).not.toContain('通常タスク');
    
    // 優先度で検索
    const priorityResult = runScript('search-tasks', ['--priority', 'high']);
    expect(priorityResult.exitCode).toBe(0);
    expect(priorityResult.stdout).toContain('重要タスク');
    expect(priorityResult.stdout).not.toContain('通常タスク');
  });
}); 