# タスク削除機能の実装

## 概要
タスク管理システムでは、不要になったタスクを削除する機能が重要です。この文書では、タスク削除機能の実装過程での技術的考慮点や学びを記録します。

## 技術的アプローチ

### 1. コアレイヤーの実装
タスク削除機能は、他のタスク操作（作成、更新、完了）と同様のアーキテクチャに従って実装しました。

```typescript
export async function deleteTask(id: string): Promise<void> {
  // 全タスクを取得
  const allTasks = taskUtils.listTasks('all');
  
  // 指定されたIDのタスクを検索
  const targetTask = allTasks.find(task => {
    try {
      const metadata = taskUtils.parseTaskMetadata(task.path);
      return metadata.id === id;
    } catch {
      return false;
    }
  });

  // タスクが見つからない場合はエラー
  if (!targetTask) {
    throw new Error(`タスク "${id}" が見つかりません`);
  }

  // タスクファイルを削除
  taskUtils.deleteTaskFile(targetTask.path);
}
```

この実装では、以下のステップで削除を行います：
1. すべてのタスクを取得
2. 指定されたIDを持つタスクを検索
3. タスクが見つからない場合はエラーをスロー
4. ユーティリティレイヤーを使用してファイルを削除

### 2. ユーティリティレイヤーの拡張
ファイルシステムの操作を行うユーティリティレイヤーに、`deleteTaskFile`関数を追加しました：

```typescript
export function deleteTaskFile(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    throw new Error(`タスクファイル ${filePath} が見つかりません`);
  }
  
  fs.unlinkSync(filePath);
}
```

この関数は単純にファイルの存在を確認し、あれば削除します。

### 3. コマンドラインインターフェースの提供
ユーザーがタスクを削除するためのコマンドラインインターフェースを実装しました：

```typescript
async function main() {
  const { id } = options;
  
  try {
    await deleteTask(id);
    console.log(chalk.green(`タスク "${id}" を削除しました`));
  } catch (error) {
    console.error(chalk.red('エラー:'), (error as Error).message);
    process.exit(1);
  }
}
```

## テスト戦略
タスク削除機能のテストでは、モックを活用してファイルシステム操作を分離し、ユニットテストの再現性と安定性を確保しました。

```typescript
describe('deleteTask', () => {
  it('タスクを削除する', async () => {
    const mockTask = {
      path: '/tasks/todo/task.md',
      status: 'todo' as const
    };
    
    const mockTasks = [mockTask];
    const mockMetadata = { id: 'task-123' };
    
    (taskUtils.listTasks as jest.Mock).mockReturnValue(mockTasks);
    (taskUtils.parseTaskMetadata as jest.Mock).mockReturnValue(mockMetadata);
    const deleteTaskFileMock = jest.fn();
    (taskUtils as any).deleteTaskFile = deleteTaskFileMock;

    await tasks.deleteTask('task-123');

    expect(taskUtils.listTasks).toHaveBeenCalledWith('all');
    expect(taskUtils.parseTaskMetadata).toHaveBeenCalledWith(mockTask.path);
    expect(deleteTaskFileMock).toHaveBeenCalledWith(mockTask.path);
  });

  it('タスクが見つからない場合はエラーをスローする', async () => {
    (taskUtils.listTasks as jest.Mock).mockReturnValue([]);

    await expect(tasks.deleteTask('non-existent')).rejects.toThrow('タスク "non-existent" が見つかりません');
  });
});
```

## 学び

### 1. レイヤー分離の重要性
コアロジックとファイルシステム操作を分離することで、テスト容易性が向上し、将来の変更に対する耐性が高まりました。

### 2. エラーハンドリングの一貫性
他のタスク操作機能と同様のエラーメッセージ形式を使用することで、ユーザー体験の一貫性を確保しました。

### 3. テスト駆動開発の有効性
テストを先に書くことで、必要な機能が明確になり、実装時に考慮すべき点が事前に把握できました。

## まとめ
タスク削除機能の実装により、タスク管理システムの基本的なCRUD操作がより完全なものとなりました。今後は、残りの未実装機能である更新機能の実装を進めることで、コアレイヤーの完成を目指します。 