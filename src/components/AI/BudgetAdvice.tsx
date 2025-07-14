// AI Budget Advice Component
// Displays AI-powered budget advice and insights

import React, { useState } from 'react';
import { Expense, CategoryTotals } from '../../types';
import { apiService } from '../../services/api';

interface BudgetAdviceProps {
  expenses: Expense[];
  categoryTotals: CategoryTotals;
}

const BudgetAdvice: React.FC<BudgetAdviceProps> = ({ expenses, categoryTotals }) => {
  const [advice, setAdvice] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvice, setShowAdvice] = useState(false);

  const handleGetAdvice = async () => {
    if (expenses.length === 0) return;
    
    setIsLoading(true);
    setAdvice('');
    
    try {
      console.log('🚀 Calling getBudgetAdvice API...');
      const result = await apiService.getBudgetAdvice(expenses, categoryTotals);
      console.log('📡 API Response:', result);
      
      if (result.success && result.data) {
        console.log('✅ Success! Advice:', result.data.advice);
        setAdvice(result.data.advice);
        setShowAdvice(true);
      } else {
        console.log('❌ API call unsuccessful:', result);
        setAdvice('Unable to get budget advice. Please check server connection.');
        setShowAdvice(true);
      }
    } catch (error) {
      console.error('💥 Error getting budget advice:', error);
      console.error('💥 Error details:', (error as any).response?.data || (error as Error).message);
      setAdvice('Sorry, I had trouble getting budget advice. Please try again.');
      setShowAdvice(true);
    } finally {
      setIsLoading(false);
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
        🧠 AI Budget Advisor
      </h3>

      {/* Get Advice Button */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <button
          onClick={handleGetAdvice}
          disabled={expenses.length === 0 || isLoading}
          style={{
            padding: '12px 24px',
            background: expenses.length === 0 ? '#666' : '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: expenses.length === 0 ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            opacity: expenses.length === 0 || isLoading ? 0.6 : 1,
            transition: 'all 0.3s ease'
          }}
        >
          {isLoading ? '🤖 Analyzing your spending...' : '💡 Get AI Budget Advice'}
        </button>
      </div>

      {expenses.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          color: '#999',
          fontSize: '14px',
          fontStyle: 'italic'
        }}>
          Add some expenses to get personalized AI budget advice!
        </div>
      )}

      {/* AI Advice Display */}
      {showAdvice && advice && (
        <div style={{
          background: '#1a1a1a',
          borderRadius: '12px',
          padding: '20px',
          borderLeft: '4px solid #FF9800',
          marginTop: '15px'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '15px' 
          }}>
            <span style={{ fontSize: '24px', marginRight: '10px' }}>🤖</span>
            <h4 style={{ 
              color: '#FF9800', 
              margin: 0, 
              fontSize: '16px',
              fontWeight: 'bold'
            }}>
              Your Personal Budget Advisor Says:
            </h4>
          </div>
          
          <div style={{ 
            color: '#e0e0e0', 
            lineHeight: 1.6, 
            fontSize: '14px',
            whiteSpace: 'pre-line'
          }}>
            {advice}
          </div>
          
          <div style={{ 
            marginTop: '15px', 
            textAlign: 'right' 
          }}>
            <button
              onClick={() => setShowAdvice(false)}
              style={{
                padding: '6px 12px',
                background: 'transparent',
                color: '#999',
                border: '1px solid #666',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {expenses.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '10px',
          marginTop: '20px'
        }}>
          <div style={{
            background: '#1a1a1a',
            padding: '12px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ color: '#4CAF50', fontSize: '18px', fontWeight: 'bold' }}>
              {expenses.length}
            </div>
            <div style={{ color: '#999', fontSize: '12px' }}>
              Total Expenses
            </div>
          </div>
          
          <div style={{
            background: '#1a1a1a',
            padding: '12px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ color: '#2196F3', fontSize: '18px', fontWeight: 'bold' }}>
              {Object.keys(categoryTotals).length}
            </div>
            <div style={{ color: '#999', fontSize: '12px' }}>
              Categories
            </div>
          </div>
          
          <div style={{
            background: '#1a1a1a',
            padding: '12px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ color: '#FF9800', fontSize: '18px', fontWeight: 'bold' }}>
              ${(Object.values(categoryTotals).reduce((sum, cat) => sum + cat.total, 0) / expenses.length).toFixed(0)}
            </div>
            <div style={{ color: '#999', fontSize: '12px' }}>
              Avg per Expense
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetAdvice;
