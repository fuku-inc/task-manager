/**
 * タスクファイルのパース機能を提供するユーティリティ
 * 
 * 注意: テスト実行時に jest.mock や describe などのエラーが出る場合は、
 * tsconfig.json の types に "jest" を追加するか、
 * テストファイルの先頭に // @ts-nocheck を追加してください。
 */

/**
 * タスクデータの型定義
 */
export interface TaskData {
  title?: string;
  id?: string;
  priority?: string;
  project?: string;
  due_date?: string;
  created_at?: string;
  completed_date?: string;
  tags?: string[];
  description?: string;
}

/**
 * マークダウン形式のタスクファイルをパースしてデータを抽出する
 * @param content タスクファイルの内容
 * @returns パースされたタスクデータ
 */
export function parseTaskFile(content: string): TaskData {
  const taskData: TaskData = {};
  
  // フロントマターを抽出
  const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  
  if (frontMatterMatch) {
    const frontMatter = frontMatterMatch[1];
    
    // 各行を解析
    frontMatter.split('\n').forEach(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        let value = line.substring(colonIndex + 1).trim();
        
        // 引用符を削除
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        }
        
        // 配列の処理
        if (key === 'tags') {
          if (value.startsWith('[') && value.endsWith(']')) {
            try {
              taskData[key] = JSON.parse(value);
            } catch (e) {
              // JSON解析に失敗した場合は単純に分割
              taskData[key] = value.substring(1, value.length - 1)
                .split(',')
                .map(item => item.trim())
                .filter(item => item);
            }
          } else {
            taskData[key] = [];
          }
        } else {
          (taskData as any)[key] = value;
        }
      }
    });
  }
  
  // タイトルがフロントマターにない場合は、最初の# を含む行から抽出
  if (!taskData.title) {
    const titleMatch = content.match(/# (.*)/);
    if (titleMatch) {
      taskData.title = titleMatch[1].trim();
    }
  }
  
  // 説明文を抽出（## 備忘録 以降のテキスト）
  const descriptionMatch = content.match(/## 備忘録\n\n([\s\S]*?)(?=\n##|$)/);
  if (descriptionMatch) {
    taskData.description = descriptionMatch[1].trim();
  }
  
  return taskData;
} 