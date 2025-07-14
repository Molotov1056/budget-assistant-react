// Custom hook for expense management
// This replaces your global 'expenses' array with React state management

import { useState, useCallback, useMemo } from 'react';
import { Expense, CategoryTotals } from '../types';

export const useExpenses = () => {
  // State - this replaces your global 'expenses = []'
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Add expense - cleaner than your current approach
  const addExpense = useCallback((expense: Omit<Expense, 'id' | 'timestamp'>) => {
    const newExpense: Expense = {
      ...expense,
      id: Date.now().toString(), // Simple ID generation
      timestamp: new Date(),
    };
    setExpenses(prev => [...prev, newExpense]);
  }, []);

  // Add multiple expenses (for batch operations)
  const addExpenses = useCallback((newExpenses: Omit<Expense, 'id' | 'timestamp'>[]) => {
    const expensesWithIds = newExpenses.map(expense => ({
      ...expense,
      id: Date.now().toString() + Math.random(),
      timestamp: new Date(),
    }));
    setExpenses(prev => [...prev, ...expensesWithIds]);
  }, []);

  // Update expense
  const updateExpense = useCallback((id: string, updates: Partial<Expense>) => {
    setExpenses(prev => 
      prev.map(expense => 
        expense.id === id ? { ...expense, ...updates } : expense
      )
    );
  }, []);

  // Delete expense
  const deleteExpense = useCallback((id: string) => {
    setExpenses(prev => prev.filter(expense => expense.id !== id));
  }, []);

  // Clear all expenses
  const clearAllExpenses = useCallback(() => {
    setExpenses([]);
  }, []);

  // Computed values - this replaces your manual calculations
  const totalSpent = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses]);

  // Category totals - replaces your getCategoryTotals function
  const categoryTotals = useMemo((): CategoryTotals => {
    const totals: CategoryTotals = {};
    
    expenses.forEach(expense => {
      const category = expense.category;
      if (!totals[category]) {
        totals[category] = { total: 0, count: 0, average: 0 };
      }
      totals[category].total += expense.amount;
      totals[category].count += 1;
    });

    // Calculate averages
    Object.keys(totals).forEach(category => {
      totals[category].average = totals[category].total / totals[category].count;
    });

    return totals;
  }, [expenses]);

  // Return everything the components need
  return {
    expenses,
    totalSpent,
    categoryTotals,
    addExpense,
    addExpenses,
    updateExpense,
    deleteExpense,
    clearAllExpenses,
  };
};

export default useExpenses;
