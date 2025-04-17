# タスク管理システム

効率的な個人タスク管理のためのコマンドライン＆ウェブベースのタスク管理システム

## 概要

このタスク管理システムは、マークダウンファイルベースでタスクを管理し、多様な利用シーンに対応する柔軟なタスク管理ツールです。タスクをディレクトリ構造で管理し、豊富なメタデータとマークダウン形式のメモを記録できます。コマンドラインとウェブの両方からアクセス可能で、プロジェクト別、優先度別のタスク管理を支援します。

## 主要機能

- **タスク管理の基本機能**
  - タスクの作成、ステータス変更、一覧表示
  - タスクの削除と更新（開発中）
- **分類とフィルタリング**
  - 優先度（高、中、低）による分類
  - プロジェクト別のグループ化
  - タグによる分類
- **日付管理**
  - 期限日の設定と追跡
  - 期限切れタスクの検出
- **ダッシュボード機能**
  - タスク数の統計表示
  - 優先度別、プロジェクト別の集計
  - 期限切れタスクの一覧

## インストール

### 必要条件

- Node.js 14.0以上
- npm または yarn

### インストール手順

```bash
# リポジトリをクローン
git clone https://github.com/yourusername/task-manager.git
cd task-manager

# 依存パッケージをインストール
npm install

# TypeScriptをビルド
npm run build
```

## 使用方法

### コマンドラインインターフェース

```bash
# タスクを新規作成
npm run create-task
# または
npx ts-node src/scripts/create-task.ts

# タスク一覧を表示
npx ts-node src/scripts/list-tasks.ts

# 未着手のタスクのみ表示
npx ts-node src/scripts/list-tasks.ts todo

# 作業中のタスクのみ表示
npx ts-node src/scripts/list-tasks.ts wip

# プロジェクト別にグループ化して表示
npx ts-node src/scripts/list-tasks.ts --group-by-project

# 優先度でフィルタリング
npx ts-node src/scripts/list-tasks.ts --priority=high

# タスクを作業中に変更
npx ts-node src/scripts/change-task-status.ts start

# タスクを完了に変更
npx ts-node src/scripts/change-task-status.ts complete

# ダッシュボードを表示（開発中）
npx ts-node src/scripts/dashboard.ts
```

### ウェブインターフェース（開発中）

```bash
# APIサーバーを起動
npm start

# 開発モードで実行（自動リロード）
npm run dev
```

ブラウザで http://localhost:3000 にアクセスしてWebインターフェースを利用できます。

### ディレクトリ構造

タスクファイルは以下のディレクトリ構造で管理されます：

```
tasks/
├── todo/        # 未着手のタスク
├── wip/         # 実行中のタスク
└── completed/   # 完了したタスク
    ├── YYYY-MM-DD/  # 完了日ごとのディレクトリ
    └── ...
```

### タスクファイル形式

タスクはマークダウンファイルとして以下の形式で保存されます：

```markdown
---
title: "タスクのタイトル"
id: "task-xxxxx"
priority: "high"  # high, medium, low
project: "プロジェクト名"
due_date: "YYYY-MM-DD"
created_at: "YYYY-MM-DD"
tags: ["タグ1", "タグ2"]
---

# タスクのタイトル

## 備忘録
タスクに関する詳細なメモをここに記載します。
マークダウン形式で十分な量のメモを残すことができます。

## 参考リンク
- [関連ドキュメント](https://example.com)

## 進捗
- YYYY-MM-DD: 作業内容
```

## プロジェクト構造

```
.
├── src/
│   ├── core/         # コアビジネスロジック
│   ├── mcp/          # 外部インターフェース層
│   │   ├── controllers/  # APIコントローラー
│   │   ├── utils/        # MCP層ユーティリティ
│   │   └── ...
│   ├── scripts/      # コマンドラインスクリプト
│   └── utils/        # 共通ユーティリティ
├── docs/             # ドキュメント
│   ├── insights/     # 技術的知見
│   ├── reports/      # 進捗レポート
│   ├── changelog.md  # 変更履歴
│   └── overview.md   # プロジェクト概要
├── tasks/            # タスクデータ（ディレクトリ構造）
├── tests/            # テストファイル
├── package.json      # npm設定
└── tsconfig.json     # TypeScript設定
```

## 開発

```bash
# 開発モードで実行（変更監視）
npm run dev

# テスト実行
npm test

# 特定のテストファイルを実行
npm test src/mcp/__tests__/dashboard.test.ts

# ビルド
npm run build
```

## ライセンス

MIT 