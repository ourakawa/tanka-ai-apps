
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

export interface TankaPhrase {
  part: string;      // 句のテキスト（例：「春の夜の」）
  reading: string;   // 句の読み（例：「はるのよの」）
  syllables: number; // 音数（例：5）
}

export interface RevisionAdvice {
  suggestion: string;
  example: string;
  exampleAnalysis?: TankaPhrase[];
}

export interface ThemeAnalysis {
  genre: string;
  tone: string;
  style?: string;
  nextTopicRecommendation: string;
}

export interface SampleTanka {
  text: string;
  author: string;
  explanation: string;
}

export interface EvaluationResult {
  inputAnalysis: TankaPhrase[]; // 短歌の分解データ（5句分）
  scores: TankaScores;
  comments: TankaComments;
  advice: RevisionAdvice[];
  theme: ThemeAnalysis;
  sample: SampleTanka;
  usedModel?: string; // 使用されたGeminiモデル名
  apiVersion?: string; // ★APIバージョン
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  RESULT = 'RESULT',
  ERROR = 'ERROR',
  ADMIN = 'ADMIN'
}

export interface AccessLog {
  id: string | number;
  timestamp: string | number;
  appVersion: string;
  status: string;
  model: string;
  text: string;
  ip: string;
}

export interface AdminData {
  ngWords: string[];
  logs: AccessLog[];
}
