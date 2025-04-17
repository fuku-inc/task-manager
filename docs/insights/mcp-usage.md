# タスク管理MCPサーバーの使い方

## 概要

タスク管理MCPサーバーは、CursorなどのAIアシスタントからタスク管理システムを操作するためのインターフェースを提供します。このドキュメントでは、MCPサーバーの設定方法と使用方法について説明します。

## セットアップ

### 1. Dockerイメージのビルド

```bash
./scripts/build-docker.sh
```

このコマンドは、タスク管理MCPサーバーのDockerイメージをビルドします。

### 2. Cursorの設定

1. `.mcp/configs/.cursor/task-manager.json`をCursorの設定ディレクトリにコピーします。

```bash
mkdir -p ~/.cursor
cp .mcp/configs/.cursor/task-manager.json ~/.cursor/mcp.json
```

2. 必要に応じて設定ファイルを編集します（タスクディレクトリのパスなど）。

### 3. MCPサーバーの起動

```bash
./scripts/start-mcp-server.sh
```

このコマンドは、Dockerコンテナ内でMCPサーバーを起動します。

## 利用可能なMCP関数

タスク管理MCPサーバーは、以下のMCP関数を提供します：

### 1. タスク作成: `mcp_task_create`

新しいタスクを作成します。

**パラメーター:**
- `title`: タスクのタイトル（必須）
- `description`: タスクの説明
- `dueDate`: 期限日（YYYY-MM-DD形式）
- `priority`: 優先度（`high`, `medium`, `low`）
- `project`: プロジェクト名
- `tags`: タグのリスト

**レスポンス:**
```json
{
  "id": "task-123"
}
```

### 2. タスク一覧取得: `mcp_task_list`

タスクの一覧を取得します。

**パラメーター:**
- `filter`: フィルタ条件
  - `status`: ステータス（`todo`, `wip`, `completed`, `all`）
  - `priority`: 優先度（`high`, `medium`, `low`）
  - `project`: プロジェクト名
  - `tag`: タグ

**レスポンス:**
```json
{
  "tasks": [
    {
      "id": "task-123",
      "title": "タスク1",
      "description": "説明",
      "priority": "high",
      "project": "プロジェクトA",
      "dueDate": "2025-05-01",
      "completed": false,
      "createdAt": "2025-04-17",
      "tags": ["重要", "会議"]
    }
  ]
}
```

### 3. タスク更新: `mcp_task_update`

既存のタスクを更新します。

**パラメーター:**
- `id`: タスクID（必須）
- `title`: 新しいタイトル
- `description`: 新しい説明
- `dueDate`: 新しい期限日
- `priority`: 新しい優先度
- `tags`: 新しいタグのリスト

**レスポンス:**
```json
{
  "success": true
}
```

### 4. タスク削除: `mcp_task_delete`

タスクを削除します。

**パラメーター:**
- `id`: 削除するタスクのID（必須）

**レスポンス:**
```json
{
  "success": true
}
```

### 5. タスク完了: `mcp_task_complete`

タスクを完了済みにします。

**パラメーター:**
- `id`: 完了するタスクのID（必須）

**レスポンス:**
```json
{
  "success": true
}
```

### 6. タスクステータス変更: `mcp_task_change_status`

タスクのステータスを変更します。

**パラメーター:**
- `id`: タスクID（必須）
- `status`: 新しいステータス（`todo`, `wip`, `completed`）（必須）

**レスポンス:**
```json
{
  "success": true
}
```

## Cursorでの使用例

```javascript
// タスクを作成
const createTaskResult = await mcp_task_create({
  title: "重要なタスク",
  description: "このタスクは最優先で対応する必要があります。",
  dueDate: "2025-04-20",
  priority: "high",
  project: "プロジェクトA",
  tags: ["重要", "会議"]
});

// タスク一覧を取得
const taskListResult = await mcp_task_list({
  filter: {
    status: "todo",
    priority: "high"
  }
});

// タスクを完了済みにする
const completeTaskResult = await mcp_task_complete({
  id: createTaskResult.id
});
```

## スキーマ定義

MCPサーバーが提供する関数のスキーマ定義は、以下のURLでアクセスできます：

```
http://localhost:3000/mcp-schema
```

## トラブルシューティング

### 1. コンテナが起動しない

- Dockerが正しくインストールされていることを確認してください
- ポート3000が他のプロセスで使用されていないことを確認してください

### 2. タスクファイルが作成されない

- マウントされたボリュームのパーミッションを確認してください
- 環境変数`TASK_DIR`が正しく設定されていることを確認してください 