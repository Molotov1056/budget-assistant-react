// TypeScript types for our Budget Assistant
// This helps us understand our data structure and catch errors early

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  timestamp: Date;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export interface BudgetGoal {
  monthlyAmount: number;
  currentSpent: number;
  percentage: number;
  status: 'on-track' | 'approaching-limit' | 'over-budget';
}

export interface CategoryTotals {
  [category: string]: {
    total: number;
    count: number;
    average: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface BudgetInsight {
  category: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
}
