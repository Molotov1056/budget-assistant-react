import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import { useExpenses } from './hooks/useExpenses';
import { apiService } from './services/api';
import { ChatMessage } from './types';
import PieChart from './components/Charts/PieChart';
import ExpenseTable from './components/Expenses/ExpenseTable';
import BudgetProgress from './components/Budget/BudgetProgress';
import BudgetAdvice from './components/AI/BudgetAdvice';

function App() {
  // State for chat messages
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isApiAvailable, setIsApiAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [monthlyBudget, setMonthlyBudget] = useState<number | null>(null);
  
  // Ref for input focus management
  const inputRef = useRef<HTMLInputElement>(null);

  // Use our custom expense hook
  const {
    expenses,
    totalSpent,
    categoryTotals,
    addExpense,
    addExpenses,
    deleteExpense,
    clearAllExpenses,
  } = useExpenses();

  // Check API availability on component mount
  useEffect(() => {
    const checkApi = async () => {
      const result = await apiService.checkHealth();
      if (result.success) {
        setIsApiAvailable(result.data?.apiKeyConfigured || false);
      }
    };
    checkApi();
  }, []);

  // Focus input on component mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Focus input whenever it's cleared and not loading
  useEffect(() => {
    if (!isLoading && inputValue === '' && inputRef.current) {
      const timeoutId = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [inputValue, isLoading]);

  // Add a chat message
  const addMessage = (text: string, sender: 'user' | 'bot' = 'bot') => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text,
      sender,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  // Handle sending messages and parsing expenses with AI
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Use AI-powered expense parsing
      console.log('🔍 Parsing input:', inputValue);
      const parseResult = await apiService.parseExpenses(inputValue);
      console.log('📊 Parse result:', parseResult);
      
      if (parseResult.success && parseResult.data && parseResult.data.length > 0) {
        // Add parsed expenses
        const parsedExpenses = parseResult.data.map(expenseData => ({
          id: `${Date.now()}-${Math.random()}`,
          description: expenseData.description,
          amount: expenseData.amount,
          category: expenseData.category,
          timestamp: new Date()
        }));
        
        // Add all parsed expenses
        parsedExpenses.forEach(expense => addExpense(expense));
        
        const botMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: parsedExpenses.length === 1 
            ? `✅ Added expense: ${parsedExpenses[0].description} - $${parsedExpenses[0].amount.toFixed(2)} (${parsedExpenses[0].category})`
            : `✅ Added ${parsedExpenses.length} expenses: ${parsedExpenses.map(e => `${e.description} $${e.amount.toFixed(2)}`).join(', ')}`,
          sender: 'bot',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, botMessage]);
      } else {
        const botMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: "💡 I couldn't find an expense in your message. Try something like:\n• 'lunch 12' or 'lunch $12'\n• 'rent 2000'\n• 'groceries 85'\n• 'coffee 4.50'",
          sender: 'bot',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      console.error('Error parsing expenses:', error);
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "⚠️ Sorry, I had trouble processing your message. Please try again.",
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
    }

    setInputValue('');
    setIsLoading(false);
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  // Handle budget setting
  const handleBudgetSet = (amount: number) => {
    setMonthlyBudget(amount > 0 ? amount : null);
  };

  return (
    <div className="App">
      {/* Header */}
      <div className="header">
        <h1>💰 Budget Assistant</h1>
        <p>Track your expenses with AI-powered insights</p>
        {!isApiAvailable && (
          <div style={{ color: '#f44336', marginTop: '10px' }}>
            ⚠️ AI features unavailable - backend not connected
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Chat Section */}
        <div className="chat-section">
          <h2>💬 Chat</h2>
          
          {/* Chat Messages */}
          <div className="chat-container">
            {messages.length === 0 ? (
              <div className="message bot">
                👋 Hello! I'm your budget assistant. Try typing something like "lunch $15" or "gas $40" to add expenses.
              </div>
            ) : (
              messages.map(message => (
                <div 
                  key={message.id} 
                  className={`message ${message.sender}`}
                >
                  {message.text}
                </div>
              ))
            )}
            {isLoading && (
              <div className="message bot">
                <em>Processing...</em>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="input-container">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your expense... (e.g., 'lunch $15')"
              className="chat-input"
              disabled={isLoading}
            />
            <button 
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              className="btn btn-primary"
            >
              Send
            </button>
          </div>

          {/* Control Buttons */}
          <div className="control-buttons">
            <button 
              onClick={clearAllExpenses}
              disabled={expenses.length === 0}
              className="btn btn-danger"
            >
              🗑️ Clear All
            </button>
          </div>
        </div>

        {/* Data Section */}
        <div className="data-section">
          <h2>📊 Your Expenses</h2>
          
          {/* Budget Progress */}
          <BudgetProgress 
            totalSpent={totalSpent}
            expenses={expenses}
            categoryTotals={categoryTotals}
            onBudgetSet={handleBudgetSet}
          />
          
          {/* AI Budget Advice */}
          <BudgetAdvice 
            expenses={expenses}
            categoryTotals={categoryTotals}
          />
          
          {/* Total Display */}
          <div className="total-display">
            <div>Total Spent</div>
            <div className="total-amount">${totalSpent.toFixed(2)}</div>
          </div>

          {/* Pie Chart */}
          <div style={{ marginBottom: '20px' }}>
            <PieChart categoryTotals={categoryTotals} />
          </div>

          {/* Enhanced Expense Table */}
          <ExpenseTable 
            expenses={expenses}
            categoryTotals={categoryTotals}
            onDeleteExpense={deleteExpense}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
