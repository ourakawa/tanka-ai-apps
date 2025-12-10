
export interface TankaScores {
  rhythm: number;
  imagery: number;
  originality: number;
  total: number;
}

export interface TankaComments {
  rhythm: string;
  imagery: string;
  originality: string;
  general: string;
}

export interface RevisionAdvice {
  suggestion: string;
  example: string;
}

export interface ThemeAnalysis {
  genre: string;
  tone: string;
  nextTopicRecommendation: string;
}

export interface SampleTanka {
  text: string;
  author: string;
  explanation: string;
}

export interface TankaPhrase {
  part: string;      // 句のテキスト（例：「春の夜の」）
  reading: string;   // 句の読み（例：「はるのよの」）
  syllables: number; // 音数（例：5）
}

export interface EvaluationResult {
  inputAnalysis: TankaPhrase[]; // 短歌の分解データ（5句分）
  scores: TankaScores;
  comments: TankaComments;
  advice: RevisionAdvice[];
  theme: ThemeAnalysis;
  sample: SampleTanka;
  usedModel?: string; // ★使用されたGeminiモデル名
}

// ★管理者機能用データ型
export interface AccessLog {
  id: string;
  timestamp: string;
  ip: string;
  text: string;     // 投稿された短歌（先頭部分）
  model: string;    // 使用モデル
  status: 'SUCCESS' | 'BLOCKED' | 'ERROR';
  appVersion: string;
}

export interface AdminData {
  logs: AccessLog[];
  ngWords: string[];
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  RESULT = 'RESULT',
  ERROR = 'ERROR',
  ADMIN = 'ADMIN' // ★管理画面状態を追加
}
