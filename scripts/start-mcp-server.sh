#!/bin/bash

# カレントディレクトリの取得
CURRENT_DIR=$(pwd)

# タスクディレクトリの作成（存在しない場合）
mkdir -p "$CURRENT_DIR/tasks/todo" 
mkdir -p "$CURRENT_DIR/tasks/wip" 
mkdir -p "$CURRENT_DIR/tasks/completed"

# DockerコンテナでMCPサーバーを起動
docker run -it --rm \
  -p 3000:3000 \
  -v "$CURRENT_DIR/tasks:/app/tasks" \
  -e TASK_DIR=/app/tasks \
  task-manager-mcp

echo "MCPサーバーを起動しています..." 