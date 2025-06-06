# タスク管理システム

このドキュメントではタスク管理の基本方針と詳細について説明します。Cursorエージェントがタスク管理を支援する際の参照ガイドとしても使用されます。

## ディレクトリ構造

タスクはステータスに応じて以下のディレクトリで管理されます：

```
tasks/
├── todo/        # 未着手のタスク
├── wip/         # 実行中のタスク
└── completed/   # 完了したタスク
    ├── YYYY-MM-DD/  # 完了日ごとのディレクトリ
    └── ...
```

## タスクファイル形式

タスクはマークダウンファイルとして管理され、各ファイルは以下の構造を持ちます：

```markdown
---
title: "タスクのタイトル"
id: "task-{生成ID}"
priority: "high"  # high, medium, low
project: "プロジェクト名"
due_date: "YYYY-MM-DD"
created_at: "YYYY-MM-DD"
tags: ["タグ1", "タグ2"]
---

# {タスクのタイトル}

## 備忘録
タスクに関する詳細なメモをここに記載します。
マークダウン形式で十分な量のメモを残すことができます。

## 参考リンク
- [関連ドキュメント](https://example.com)

## 進捗
- YYYY-MM-DD: 作業内容
```

## タスク管理フロー

1. **タスク作成**：
   - 新規タスクは `tasks/todo/` ディレクトリに作成します
   - ファイル名は `{タスク名}-{日付}.md` の形式を推奨します（例：`meeting-preparation-20231119.md`）

2. **ステータス変更**：
   - **着手時**：タスクファイルを `tasks/todo/` から `tasks/wip/` に移動します
   - **完了時**：タスクファイルを `tasks/wip/` から `tasks/completed/YYYY-MM-DD/` に移動します
     - 完了日のディレクトリがない場合は作成します

3. **タスク更新**：
   - タスクの作業中はマークダウンファイルに直接メモを追記します
   - メタデータ（優先度や期限など）の変更も必要に応じて行います

## AIエージェントの役割

Cursorで起動するAIエージェントは以下の機能を提供します：

1. **今日のタスク提案**：
   - Google Calendarからの予定取得
   - 優先度や期限に基づくタスク提案
   - 空き時間を考慮した最適なタスク実行順序の提案

2. **タスク管理支援**：
   - 新規タスクの作成補助
   - タスクのステータス変更（ディレクトリ移動）
   - タスク検索と参照

3. **振り返り支援**：
   - 日次・週次のタスク完了状況レポート
   - 未完了タスクの整理と再スケジュール提案

## コマンドリファレンス

AIエージェントへの主な指示コマンド：

- **今日のタスクを表示**: 今日取り組むべきタスクと予定を表示
- **新規タスク作成**: 指定した情報でタスクファイルを作成
- **タスク検索**: 条件に合うタスクを検索
- **タスク着手**: 指定したタスクを作業中ステータスに変更
- **タスク完了**: 指定したタスクを完了ステータスに変更
- **タスク一覧**: 各ステータスのタスク一覧を表示
- **今日の振り返り**: 今日完了したタスクの概要レポート

## 使用例

```
# 新規タスク作成
「会議資料の準備というタスクを作成して、優先度は高、期限は明日、プロジェクトはマーケティングキャンペーンとしてください」

# タスク着手
「会議資料の準備タスクに着手します」

# タスクへのメモ追加
「会議資料の準備タスクに以下のメモを追加してください：
- プレゼンには10枚以内のスライドを用意
- 予算についての詳細な説明を含める」

# タスク完了
「会議資料の準備タスクを完了しました」 