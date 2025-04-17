FROM node:18-alpine

WORKDIR /app

# パッケージをインストール
COPY package*.json ./
RUN npm install

# ソースコードをコピー
COPY . .

# TypeScriptをビルド
RUN npm run build

# タスクディレクトリを作成
RUN mkdir -p tasks/todo tasks/wip tasks/completed

# ポートを公開
EXPOSE 3000

# MCPサーバーを起動
CMD ["npm", "run", "mcp-server"] 