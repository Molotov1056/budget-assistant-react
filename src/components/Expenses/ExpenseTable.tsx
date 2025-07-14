// Enhanced React Expense Table Component
// This replicates your category grouping functionality

import React, { useState } from 'react';
import { Expense, CategoryTotals } from '../../types';

interface ExpenseTableProps {
  expenses: Expense[];
  categoryTotals: CategoryTotals;
  onDeleteExpense: (id: string) => void;
}

const ExpenseTable: React.FC<ExpenseTableProps> = ({ 
  expenses, 
  categoryTotals, 
  onDeleteExpense 
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // Delete all expenses in a category
  const deleteCategory = (category: string) => {
    if (window.confirm(`Delete all ${category} expenses? This cannot be undone.`)) {
      const categoryExpenses = expenses.filter(exp => exp.category === category);
      categoryExpenses.forEach(exp => onDeleteExpense(exp.id));
    }
  };

  // No expenses state
  if (expenses.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '40px', 
        color: '#666',
        background: '#1a1a1a',
        borderRadius: '10px'
      }}>
        📋 No expenses yet<br />
        <small>Start by adding some expenses in the chat!</small>
      </div>
    );
  }

  // Get sorted categories
  const categories = Object.keys(categoryTotals).sort();

  return (
    <div style={{ background: '#1a1a1a', borderRadius: '10px', overflow: 'hidden' }}>
      <h3 style={{ 
        color: '#4CAF50', 
        margin: '0',
        padding: '20px 20px 10px 20px',
        textAlign: 'center'
      }}>
        📋 Expenses by Category
      </h3>
      
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#333' }}>
            <th style={{ 
              padding: '12px 15px', 
              textAlign: 'left', 
              color: '#4CAF50',
              fontWeight: 600
            }}>
              Category
            </th>
            <th style={{ 
              padding: '12px 15px', 
              textAlign: 'right', 
              color: '#4CAF50',
              fontWeight: 600
            }}>
              Total
            </th>
            <th style={{ 
              padding: '12px 15px', 
              textAlign: 'center', 
              color: '#4CAF50',
              fontWeight: 600
            }}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {categories.map(category => {
            const categoryData = categoryTotals[category];
            const isExpanded = expandedCategories.has(category);
            const categoryExpenses = expenses.filter(exp => exp.category === category);

            return (
              <React.Fragment key={category}>
                {/* Category Summary Row */}
                <tr 
                  style={{ 
                    backgroundColor: '#2d2d2d',
                    borderBottom: '1px solid #444',
                    cursor: 'pointer'
                  }}
                  onClick={() => toggleCategory(category)}
                >
                  <td style={{ padding: '12px 15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px' }}>
                        {isExpanded ? '▼' : '▶'}
                      </span>
                      <strong style={{ color: '#4CAF50', textTransform: 'capitalize' }}>
                        {category}
                      </strong>
                      <small style={{ color: '#999', fontStyle: 'italic' }}>
                        {categoryData.count} expense{categoryData.count !== 1 ? 's' : ''}
                      </small>
                    </div>
                  </td>
                  <td style={{ 
                    padding: '12px 15px', 
                    textAlign: 'right',
                    fontWeight: 'bold',
                    color: '#e0e0e0'
                  }}>
                    ${categoryData.total.toFixed(2)}
                  </td>
                  <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCategory(category);
                      }}
                      style={{
                        background: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Delete All
                    </button>
                  </td>
                </tr>

                {/* Individual Expenses (when expanded) */}
                {isExpanded && categoryExpenses.map(expense => (
                  <tr 
                    key={expense.id}
                    style={{ 
                      backgroundColor: '#1a1a1a',
                      borderBottom: '1px solid #333'
                    }}
                  >
                    <td style={{ 
                      padding: '8px 15px 8px 40px',
                      color: '#ccc',
                      fontSize: '14px'
                    }}>
                      {expense.description}
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#999',
                        marginTop: '2px'
                      }}>
                        {expense.timestamp.toLocaleDateString()}
                      </div>
                    </td>
                    <td style={{ 
                      padding: '8px 15px', 
                      textAlign: 'right',
                      color: '#e0e0e0',
                      fontSize: '14px'
                    }}>
                      ${expense.amount.toFixed(2)}
                    </td>
                    <td style={{ padding: '8px 15px', textAlign: 'center' }}>
                      <button
                        onClick={() => onDeleteExpense(expense.id)}
                        style={{
                          background: '#666',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '2px 6px',
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ExpenseTable;
