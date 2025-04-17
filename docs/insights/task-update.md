# タスク更新機能の実装

## 概要
タスク管理システムでは、既存のタスクの内容を更新する機能が基本的な要件です。この文書では、タスク更新機能の実装過程での技術的考慮点や学びを記録します。

## 技術的アプローチ

### 1. コアレイヤーの実装
タスク更新機能は、他のタスク操作（作成、削除、完了）と同様のアーキテクチャに従って実装しました。

```typescript
export async function updateTask(id: string, updates: {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: Date;
  tags?: string[];
}): Promise<void> {
  // 更新内容が空の場合はエラー
  if (Object.keys(updates).length === 0) {
    throw new Error('更新内容が指定されていません');
  }
  
  // 対象タスクの検索と更新処理
  const allTasks = taskUtils.listTasks('all');
  const targetTask = allTasks.find(task => {
    try {
      const metadata = taskUtils.parseTaskMetadata(task.path);
      return metadata.id === id;
    } catch {
      return false;
    }
  });

  if (!targetTask) {
    throw new Error(`タスク "${id}" が見つかりません`);
  }
  
  // 更新データの準備と変換
  const updateData: Record<string, any> = {};
  
  if (updates.title) updateData.title = updates.title;
  if (updates.description) updateData.description = updates.description;
  if (updates.priority) updateData.priority = updates.priority;
  if (updates.tags) updateData.tags = updates.tags;
  if (updates.dueDate !== undefined) {
    updateData.due_date = updates.dueDate ? updates.dueDate.toISOString().split('T')[0] : '';
  }
  
  // タスクファイルを更新
  taskUtils.updateTaskFile(targetTask.path, updateData);
}
```

### 2. ユーティリティレイヤーの拡張
ファイルシステムの操作を行うユーティリティレイヤーに、`updateTaskFile`関数を追加しました：

```typescript
export function updateTaskFile(filePath: string, updates: Partial<TaskMetadata & { description?: string }>): void {
  // ファイルが存在するか確認
  if (!fs.existsSync(filePath)) {
    throw new Error(`タスクファイル ${filePath} が見つかりません`);
  }
  
  // ファイルの内容を読み込む
  const content = fs.readFileSync(filePath, 'utf8');
  
  // メタデータ部分と本文を分離
  const metadataMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!metadataMatch) {
    throw new Error(`タスクファイル ${filePath} の形式が不正です`);
  }
  
  // メタデータと本文を更新
  const [, metadataStr, bodyContent] = metadataMatch;
  const currentMetadata = parseMetadata(metadataStr);
  const updatedMetadata = { ...currentMetadata, ...updates };
  
  // 新しいメタデータを生成
  let newMetadataStr = '---\n';
  Object.keys(updatedMetadata).forEach(key => {
    let value = updatedMetadata[key];
    if (key === 'tags') value = JSON.stringify(value);
    newMetadataStr += `${key}: ${value}\n`;
  });
  newMetadataStr += '---\n';
  
  // 本文を更新（タイトルや説明が変更されている場合）
  let newBodyContent = updateBodyContent(bodyContent, currentMetadata, updates);
  
  // 更新したファイル内容を書き込む
  fs.writeFileSync(filePath, newMetadataStr + newBodyContent, 'utf8');
}
```

このユーティリティでは、以下の複雑な処理を行っています：

1. マークダウンファイルからのメタデータ部分と本文部分の分離
2. メタデータの解析と更新
3. 本文内のタイトルと説明部分の更新
4. 進捗記録への更新内容の追記

特に、マークダウン形式のタスクファイルを更新する際には、ファイル構造を維持しながら必要な部分だけを更新する必要があるため、正規表現を活用して適切な更新処理を実装しました。

### 3. コマンドラインインターフェースの提供
ユーザーがタスクを更新するためのコマンドラインインターフェースを実装しました：

```typescript
program
  .version('1.0.0')
  .description('タスクを更新します')
  .requiredOption('-i, --id <id>', 'タスクID')
  .option('-t, --title <title>', 'タスクのタイトル')
  .option('-d, --description <description>', 'タスクの説明')
  .option('-p, --priority <priority>', 'タスクの優先度 (high, medium, low)')
  .option('-u, --due <dueDate>', '期限日 (YYYY-MM-DD形式)')
  .option('--tags <tags>', 'タグ (カンマ区切り)')
  .option('--remove-due', '期限を削除する')
  .parse(process.argv);
```

複数の更新可能なフィールドを対応するためのオプションを用意し、ユーザーが必要な部分だけを更新できるようにしました。

## テスト戦略
タスク更新機能のテストでは、モックを活用してファイルシステム操作を分離し、ユニットテストの再現性と安定性を確保しました。

```typescript
describe('updateTask', () => {
  it('タスクを更新する', async () => {
    const mockTask = {
      path: '/tasks/todo/task.md',
      status: 'todo' as const
    };
    
    const mockTasks = [mockTask];
    const mockMetadata = { 
      id: 'task-123',
      title: '元のタイトル',
      priority: 'medium' as const,
      project: 'default',
      due_date: '',
      created_at: '2025-04-01',
      tags: []
    };
    
    const updateTaskFileMock = jest.fn();
    
    (taskUtils.listTasks as jest.Mock).mockReturnValue(mockTasks);
    (taskUtils.parseTaskMetadata as jest.Mock).mockReturnValue(mockMetadata);
    (taskUtils as any).updateTaskFile = updateTaskFileMock;
    
    const updates = {
      title: '新しいタイトル',
      description: '新しい説明',
      priority: 'high' as const,
      dueDate: new Date('2025-05-01')
    };
    
    await tasks.updateTask('task-123', updates);
    
    // 期待する関数呼び出しと引数を検証
    expect(taskUtils.listTasks).toHaveBeenCalledWith('all');
    expect(taskUtils.parseTaskMetadata).toHaveBeenCalledWith(mockTask.path);
    expect(updateTaskFileMock).toHaveBeenCalledWith(
      mockTask.path,
      expect.objectContaining({
        title: '新しいタイトル',
        description: '新しい説明',
        priority: 'high',
        due_date: '2025-05-01'
      })
    );
  });
});
```

## 学び

### 1. マークダウンファイルの構造化されたデータ処理
マークダウンファイルは人間にとって読みやすいフォーマットですが、プログラムで扱う際には構造的な処理が必要です。YAMLフロントマターを含むマークダウンファイルの解析と更新において、適切な正規表現と文字列操作を組み合わせることで効率的な処理が実現できました。

### 2. 部分更新の実装
タスク更新の場合、すべてのフィールドではなく、指定されたフィールドのみを更新する「部分更新」の実装が重要でした。TypeScriptの部分型（Partial）を活用することで、型安全性を維持しながら柔軟な更新処理を実現できました。

### 3. ファイル更新におけるアトミック性の確保
ファイル操作では、読み込み→更新→書き込みの一連の処理がアトミックに行われることが重要です。エラーハンドリングを適切に行い、ファイルの整合性を維持する設計を心がけました。

### 4. コマンドラインインターフェースの設計
複数のオプションを持つコマンドラインツールでは、ユーザー体験を考慮した設計が重要です。必須オプションと任意オプションを明確に分け、適切なヘルプメッセージを提供することで、ユーザーにとって使いやすいインターフェースを実現しました。

## まとめ
タスク更新機能の実装により、タスク管理システムの基本的なCRUD操作が完成しました。今後は、これらの基本機能を活用した高度な機能（タスクの依存関係、リマインダー、レポート生成など）の開発に進むことができます。 