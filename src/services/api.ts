// API service for connecting to our backend
// This centralizes all backend communication

import axios from 'axios';
import { ApiResponse, BudgetInsight, Expense, CategoryTotals } from '../types';

// Use relative URLs in production, localhost in development
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:3001/api';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API functions
export const apiService = {
  // Check if backend is available
  checkHealth: async (): Promise<ApiResponse<{ apiKeyConfigured: boolean }>> => {
    try {
      const response = await api.get('/health');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: 'Backend not available' };
    }
  },

  // Get AI budget advice
  getBudgetAdvice: async (expenses: Expense[], categoryTotals: CategoryTotals): Promise<ApiResponse<{ advice: string }>> => {
    try {
      const response = await api.post('/budget-advice', { expenses, categoryTotals });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: 'Failed to get budget advice' };
    }
  },

  // Get budget suggestions
  getBudgetSuggestion: async (expenses: Expense[], categoryTotals: CategoryTotals): Promise<ApiResponse<{ suggestion: number; reasoning: string }>> => {
    try {
      const response = await api.post('/budget-suggestion', { expenses, categoryTotals });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: 'Failed to get budget suggestion' };
    }
  },

  // Parse expenses from natural language
  parseExpenses: async (text: string): Promise<ApiResponse<any[]>> => {
    try {
      const response = await api.post('/parse-expenses', { text });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: 'Failed to parse expenses' };
    }
  },
};

export default apiService;
