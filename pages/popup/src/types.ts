export type ScamRisk = 'Low' | 'Medium' | 'High';

export interface RedFlag {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export type PopupState = 'default' | 'scanning' | 'listing' | 'limit' | 'message' | 'feedback';

export interface FeedbackData {
  isAccurate: boolean;
  comment?: string;
  timestamp: number;
  url: string;
}

export interface UserCredits {
  remaining: number;
  total: number;
  resetDate: Date;
}
