# MCP設定ディレクトリ

このディレクトリには、さまざまなMCP（Machine-assistance Config Profiles）の設定ファイルのテンプレートが格納されています。

## 重要: 設定ファイルの使用方法

このリポジトリ内の設定ファイルは**テンプレート**です。実際の使用時には以下の手順に従ってください：

1. `.mcp/configs`内のテンプレートファイルをCursorなどのMCPホストの設定ディレクトリにコピーします
   - Cursor: `~/.cursor/mcp.json`
   - その他のMCPホスト: 各ホスト指定の場所

2. コピーした設定ファイルに**自分自身のトークンや認証情報**を入力します
   - GitHub Personal Access Tokenなど

3. テンプレートファイル自体には機密情報を記載しないでください

## ディレクトリ構造

```
.mcp/
├── configs/              # 各サービスのMCP設定テンプレート
│   ├── .cursor/mcp.json  # CursorのMCP設定ファイル
│   └── ...               # 他のMCPホストの設定ファイル
└── README.md             # このファイル
```

## 利用可能なMCP設定テンプレート

- **GitHub MCP** (`configs/github.json`): GitHub APIとの連携のための設定
  - リポジトリ管理、Issue管理、PR管理などの機能を提供
  - DockerコンテナでGitHub MCP Serverを実行

## MCP設定ファイルの構造

### GitHub MCP (`configs/github.json`)

```json
{
  "mcpServers": {
    "github": {
      "command": "docker",
      "args": [...],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "YOUR_TOKEN"
      }
    }
  },
  "config": {
    "owner": "組織名またはユーザー名",
    "repo": "リポジトリ名",
    "defaultBranch": "main"
  }
}
```

## 今後追加予定のMCP

- **Slack MCP**: Slackとの連携
- **Jira MCP**: Jiraとの連携
- **AWS MCP**: AWSサービスとの連携

## 設定方法の詳細

### Cursorでの設定方法

1. `.mcp/configs/.cursor/mcp.json`の内容を`~/.cursor/mcp.json`にコピー
2. 以下の項目を自分の環境に合わせて更新:
   - `mcpServers.github.env.GITHUB_PERSONAL_ACCESS_TOKEN`: 自分のPersonal Access Token

### Docker実行環境の準備

GitHub MCPはDockerコンテナで実行されるため、以下の準備が必要です：

1. Dockerをインストール
2. GitHubのPersonal Access Tokenを取得
3. MCPホストの設定ファイルにトークンを設定 