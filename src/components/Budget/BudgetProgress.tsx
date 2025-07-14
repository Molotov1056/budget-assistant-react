// Budget Progress Component
// This replicates your budget goal and progress tracking

import React, { useState } from 'react';
import { Expense, BudgetGoal, CategoryTotals } from '../../types';
import { apiService } from '../../services/api';

interface BudgetProgressProps {
  totalSpent: number;
  expenses: Expense[];
  categoryTotals: CategoryTotals;
  onBudgetSet: (amount: number) => void;
}

const BudgetProgress: React.FC<BudgetProgressProps> = ({ totalSpent, expenses, categoryTotals, onBudgetSet }) => {
  const [budgetAmount, setBudgetAmount] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const [suggestionReasoning, setSuggestionReasoning] = useState('');

  // Calculate progress
  const progress = budgetAmount ? (totalSpent / budgetAmount) * 100 : 0;
  const remaining = budgetAmount ? budgetAmount - totalSpent : 0;

  // Status determination
  let status: 'on-track' | 'approaching-limit' | 'over-budget' = 'on-track';
  let statusColor = '#4CAF50';
  let statusText = 'On Track';

  if (budgetAmount) {
    if (progress > 100) {
      status = 'over-budget';
      statusColor = '#f44336';
      statusText = 'Over Budget';
    } else if (progress > 90) {
      status = 'approaching-limit';
      statusColor = '#FF9800';
      statusText = 'Approaching Limit';
    }
  }

  // Handle budget setting
  const handleSetBudget = () => {
    const amount = parseFloat(inputValue);
    if (amount && amount > 0) {
      setBudgetAmount(amount);
      onBudgetSet(amount);
      setInputValue('');
    }
  };

  // Handle clear budget
  const handleClearBudget = () => {
    if (window.confirm('Clear your budget goal?')) {
      setBudgetAmount(null);
      onBudgetSet(0);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSetBudget();
    }
  };

  // Get AI budget suggestion
  const handleGetSuggestion = async () => {
    if (expenses.length === 0) return;
    
    setIsLoadingSuggestion(true);
    setSuggestionReasoning('');
    
    try {
      const result = await apiService.getBudgetSuggestion(expenses, categoryTotals);
      
      if (result.success && result.data) {
        setInputValue(result.data.suggestion.toString());
        setSuggestionReasoning(result.data.reasoning);
      }
    } catch (error) {
      console.error('Error getting budget suggestion:', error);
    } finally {
      setIsLoadingSuggestion(false);
    }
  };

  return (
    <div style={{ 
      background: '#2d2d2d', 
      borderRadius: '15px', 
      padding: '20px',
      marginBottom: '20px'
    }}>
      <h3 style={{ color: '#4CAF50', marginBottom: '20px', textAlign: 'center' }}>
        🎯 Budget Goals
      </h3>

      {/* Budget Setting */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          alignItems: 'center',
          marginBottom: '10px'
        }}>
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter monthly budget..."
            style={{
              flex: 1,
              padding: '10px',
              border: '2px solid #444',
              borderRadius: '8px',
              background: '#1a1a1a',
              color: '#e0e0e0',
              fontSize: '14px'
            }}
          />
          <button
            onClick={handleSetBudget}
            disabled={!inputValue || parseFloat(inputValue) <= 0}
            style={{
              padding: '10px 15px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Set Budget
          </button>
          <button
            onClick={handleGetSuggestion}
            disabled={expenses.length === 0 || isLoadingSuggestion}
            style={{
              padding: '10px 15px',
              background: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              opacity: expenses.length === 0 || isLoadingSuggestion ? 0.6 : 1
            }}
          >
            {isLoadingSuggestion ? '🤖 Thinking...' : '🤖 AI Suggest'}
          </button>
        </div>
        
        {/* AI Suggestion Reasoning */}
        {suggestionReasoning && (
          <div style={{
            background: '#1a1a1a',
            borderRadius: '8px',
            padding: '15px',
            marginTop: '10px',
            borderLeft: '4px solid #2196F3'
          }}>
            <h5 style={{ color: '#2196F3', margin: '0 0 10px 0', fontSize: '14px' }}>
              🤖 AI Budget Recommendation
            </h5>
            <p style={{ color: '#e0e0e0', margin: '0', lineHeight: 1.4, fontSize: '13px' }}>
              {suggestionReasoning}
            </p>
          </div>
        )}
      </div>

      {/* Budget Display */}
      {budgetAmount && (
        <div>
          {/* Progress Bar */}
          <div style={{ marginBottom: '15px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '5px',
              fontSize: '14px',
              color: '#e0e0e0'
            }}>
              <span>Progress</span>
              <span>{progress.toFixed(1)}%</span>
            </div>
            <div style={{ 
              background: '#1a1a1a', 
              borderRadius: '10px', 
              overflow: 'hidden',
              height: '20px'
            }}>
              <div style={{ 
                background: statusColor,
                height: '100%',
                width: `${Math.min(progress, 100)}%`,
                transition: 'width 0.3s ease, background-color 0.3s ease'
              }} />
            </div>
          </div>

          {/* Status and Stats */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <div style={{ 
              color: statusColor,
              fontWeight: 'bold',
              padding: '5px 10px',
              borderRadius: '15px',
              background: `${statusColor}20`,
              fontSize: '14px'
            }}>
              {statusText}
            </div>
            <div style={{ 
              color: '#e0e0e0',
              fontSize: '14px',
              textAlign: 'right'
            }}>
              <div>Spent: ${totalSpent.toFixed(2)}</div>
              <div>Budget: ${budgetAmount.toFixed(2)}</div>
              <div style={{ color: remaining >= 0 ? '#4CAF50' : '#f44336' }}>
                {remaining >= 0 ? 'Remaining' : 'Over'}: ${Math.abs(remaining).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Budget Insights */}
          <div style={{ 
            background: '#1a1a1a', 
            borderRadius: '8px', 
            padding: '15px',
            borderLeft: `4px solid ${statusColor}`
          }}>
            <h5 style={{ color: statusColor, margin: '0 0 10px 0', fontSize: '14px' }}>
              💡 Budget Insights
            </h5>
            <p style={{ color: '#e0e0e0', margin: '5px 0', lineHeight: 1.4, fontSize: '13px' }}>
              {status === 'on-track' && progress < 50 && 
                `Great job! You're only ${progress.toFixed(1)}% through your budget with $${remaining.toFixed(2)} remaining.`}
              {status === 'on-track' && progress >= 50 && progress <= 75 && 
                `You're on track! ${progress.toFixed(1)}% of budget used. Consider tracking spending closely.`}
              {status === 'approaching-limit' && 
                `⚠️ Warning: You've used ${progress.toFixed(1)}% of your budget. Only $${remaining.toFixed(2)} remaining.`}
              {status === 'over-budget' && 
                `🚨 You're over budget by $${Math.abs(remaining).toFixed(2)}. Consider reviewing your expenses.`}
            </p>
          </div>

          {/* Clear Budget Button */}
          <div style={{ textAlign: 'center', marginTop: '15px' }}>
            <button
              onClick={handleClearBudget}
              style={{
                padding: '8px 15px',
                background: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Clear Budget
            </button>
          </div>
        </div>
      )}

      {!budgetAmount && (
        <div style={{ 
          textAlign: 'center', 
          color: '#999',
          fontSize: '14px',
          padding: '20px'
        }}>
          Set a monthly budget to track your progress and get insights!
        </div>
      )}
    </div>
  );
};

export default BudgetProgress;
