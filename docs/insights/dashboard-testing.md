# ダッシュボード機能のテスト開発から得た知見

## 概要

ダッシュボード機能のユニットテスト実装過程で得られた技術的知見と解決策をまとめています。特に日付依存のテストとファイルシステム操作のモック化について焦点を当てています。

## 日付依存のテスト

### 課題
日付に依存するテスト（期限切れタスクや今日が期限のタスクの判定）では、テスト実行日によって結果が変わるため、テストの再現性と安定性が課題となりました。

### 解決策
`Date.prototype.toISOString`メソッドをモック化することで、日付を固定し、テスト結果の再現性を確保しました。

```typescript
// 日付のモック
const TODAY_DATE_STRING = '2023-12-15';
dateToISOStringSpy = jest.spyOn(Date.prototype, 'toISOString').mockImplementation(function() {
  // 日付文字列を固定
  return `${TODAY_DATE_STRING}T00:00:00.000Z`;
});

// テスト終了後にモックを元に戻す
afterEach(() => {
  dateToISOStringSpy.mockRestore();
});
```

### 学び
1. 日付処理は文字列比較ベースのアプローチが単純でテストしやすい
2. `Date`オブジェクトのモック化には複数のアプローチがあるが、使用する具体的なメソッドをモック化するのが最も効果的
3. テスト環境変数（`NODE_ENV=test`）を使用したデバッグログにより問題解決が容易になる

## ファイルシステム操作のモック化

### 課題
ダッシュボード機能はファイルシステムからタスクデータを読み込むため、テスト環境でファイルシステム操作をモック化する必要がありました。

### 解決策
`fs-extra`モジュールのメソッド（`readdirSync`, `readFileSync`, `existsSync`）をモック化し、テストデータを返すよう設定しました。

```typescript
// fsモジュールをモック
jest.mock('fs-extra');
const mockedFs = fs as jest.Mocked<typeof fs>;

// existsSyncのデフォルト動作を設定
mockedFs.existsSync.mockReturnValue(true);

// readdirSyncのモック実装
mockedFs.readdirSync.mockImplementation((dirPath) => {
  return dirPath.toString().includes('todo') ? todoFiles : [];
});

// readFileSyncのモック実装
mockedFs.readFileSync.mockImplementation((filePath) => {
  const fileName = path.basename(filePath.toString());
  // ファイル名に応じたモックデータを返す
  if (fileName === 'task-abc.md') {
    return `---
title: 期限切れタスク
priority: high
due_date: 2023-12-14
---
期限切れ`;
  }
  // ...他のファイルのモックデータ
});
```

### 学び
1. ファイルシステム操作のモック化にはJestの`jest.mock`と`mockImplementation`が効果的
2. パス依存の条件分岐を使うことで、様々なシナリオのテストが可能
3. すべてのファイルシステムメソッド（`existsSync`など）を適切にモック化する必要がある

## デバッグ手法

### 効果的だった手法
1. **環境変数によるデバッグログの制御**
   ```typescript
   // デバッグモード
   const DEBUG = process.env.NODE_ENV === 'test';
   if (DEBUG) {
     console.log(`Check due date - File: ${file}, Due date: ${dueDateString}`);
   }
   ```

2. **日付処理のデバッグ出力**
   ```typescript
   console.log(`Date comparison: 
     - TODAY_STRING: ${TODAY_STRING}
     - OVERDUE_STRING: ${OVERDUE_STRING}
     - OVERDUE_STRING < TODAY_STRING: ${OVERDUE_STRING < TODAY_STRING}
   `);
   ```

3. **モック関数呼び出しのトレース**
   ```typescript
   console.log(`Mocked readFileSync called with: ${filePath}`);
   ```

## テスト設計の教訓

1. **境界値のテスト**
   - 期限日が「今日」のケース
   - 期限日が「昨日」（期限切れ）のケース
   - 期限日が「将来」のケース

2. **モックデータの設計**
   - 現実的なデータ構造を反映したモックデータの作成
   - エッジケースを含むテストデータセットの用意

3. **テスト分割**
   - 機能ごとのテストケース分離（タスク集計とは別に期限判定のテストを作成）

## まとめ

日付依存のテストとファイルシステム操作のモック化は複雑ですが、適切なアプローチを取ることで再現性の高い堅牢なテストが可能になります。特に、日付処理のテストでは日付のモック化、ファイルシステム操作では各メソッドの適切なモック実装が重要です。デバッグ出力を効果的に活用することで、問題解決が迅速になります。 