export interface FeedSource {
  name: string;
  url: string;
  enabled: boolean;
}

export interface NewsItem {
  source: string;
  title: string;
  description: string;
  pubDate: string;
  link: string;
}

export interface Analysis {
  summary: string;
  opportunities: TradingOpportunity[];
  risks: string[];
  horizon: string;
}

export interface TradingOpportunity {
  pair: string;
  direction: 'BUY' | 'SELL';
  entry: number;
  stopLoss: number;
  takeProfit: number;
  riskReward: number;
  justification: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  role: 'user' | 'admin';
  subscription: SubscriptionTier;
  createdAt: string;
  lastLogin: string;
}

export type SubscriptionTier = 'free' | 'basic' | 'premium' | 'enterprise';

export interface UserSettings {
  theme: 'light' | 'dark';
  language: 'fr' | 'en';
  emailNotifications: boolean;
  analysisFormat: 'html' | 'markdown' | 'text';
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalAnalyses: number;
  totalCosts: number;
  subscriptionStats: {
    free: number;
    basic: number;
    premium: number;
    enterprise: number;
  };
}