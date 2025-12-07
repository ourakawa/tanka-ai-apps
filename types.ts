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

export interface EvaluationResult {
  scores: TankaScores;
  comments: TankaComments;
  advice: RevisionAdvice[];
  theme: ThemeAnalysis;
  sample: SampleTanka;
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  RESULT = 'RESULT',
  ERROR = 'ERROR'
}