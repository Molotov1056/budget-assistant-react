// Simple Express server for React Budget Assistant
// Running on port 3001 to avoid conflicts with your original server

const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Debug: Check if API key is loaded
console.log('🔑 API Key configured:', !!OPENAI_API_KEY);
console.log('🔑 API Key length:', OPENAI_API_KEY ? OPENAI_API_KEY.length : 0);

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('build')); // Serve React build files

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    apiKeyConfigured: !!process.env.OPENAI_API_KEY,
    timestamp: new Date().toISOString()
  });
});

// AI-powered expense parsing endpoint
app.post('/api/parse-expenses', async (req, res) => {
  const { text } = req.body;
  
  if (!OPENAI_API_KEY) {
    // Fallback to simple parsing if no API key
    const amountMatch = text.match(/\$?([0-9]+\.?[0-9]*)/);  
    
    if (amountMatch) {
      const amount = parseFloat(amountMatch[1]);
      const description = text.replace(amountMatch[0], '').trim();
      
      return res.json([{
        description: description || 'Expense',
        amount,
        category: 'other'
      }]);
    } else {
      return res.json([]);
    }
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "system",
        content: `You are an expense parsing assistant. Parse the user's text into structured expense data.
        
        Extract:
        - description: What was purchased/spent on
        - amount: Dollar amount (number only)
        - category: One of these categories: food, transportation, entertainment, shopping, utilities, healthcare, education, travel, other
        
        Respond with valid JSON array format: [{"description": "...", "amount": 0.00, "category": "..."}]
        
        Examples:
        "lunch $12" → [{"description": "lunch", "amount": 12.00, "category": "food"}]
        "gas station $45" → [{"description": "gas station", "amount": 45.00, "category": "transportation"}]
        "coffee and bagel $8.50" → [{"description": "coffee and bagel", "amount": 8.50, "category": "food"}]
        
        If no amount is found, return empty array: []`
      }, {
        role: "user",
        content: text
      }],
      temperature: 0.1,
      max_tokens: 200
    });

    const aiResponse = completion.choices[0].message.content.trim();
    
    try {
      const parsedExpenses = JSON.parse(aiResponse);
      res.json(Array.isArray(parsedExpenses) ? parsedExpenses : []);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      // Fallback to simple parsing
      const amountMatch = text.match(/\$?([0-9]+\.?[0-9]*)/);  
      
      if (amountMatch) {
        const amount = parseFloat(amountMatch[1]);
        const description = text.replace(amountMatch[0], '').trim();
        
        res.json([{
          description: description || 'Expense',
          amount,
          category: 'other'
        }]);
      } else {
        res.json([]);
      }
    }
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ error: 'Failed to parse expenses' });
  }
});

// AI-powered budget advice endpoint
app.post('/api/budget-advice', async (req, res) => {
  const { expenses, categoryTotals } = req.body;
  
  console.log('📊 Budget advice request received');
  console.log('🔑 API Key check:', !!OPENAI_API_KEY);
  console.log('💰 Expenses count:', expenses?.length || 0);
  
  if (!OPENAI_API_KEY) {
    console.log('❌ API key not found, returning error');
    return res.status(503).json({ 
      error: 'OpenAI API key not configured' 
    });
  }

  if (!expenses || expenses.length === 0) {
    return res.json({
      advice: 'Start tracking your expenses to get personalized budget advice!'
    });
  }

  try {
    // Calculate spending insights
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const categoryBreakdown = Object.entries(categoryTotals || {})
      .map(([category, data]) => `${category}: $${data.total.toFixed(2)} (${data.count} expenses, avg $${(data.total / data.count).toFixed(2)})`);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "system",
        content: `You are a personal finance advisor. Analyze the user's spending and provide helpful, actionable budget advice.
        
        Focus on:
        - Identifying spending patterns and trends
        - Suggesting specific percentage reductions for high-spending categories
        - Recommending budget allocation using 50/30/20 rule when relevant
        - Providing practical tips for saving money
        - Being encouraging and supportive
        
        Keep advice concise (2-3 sentences max) and actionable.`
      }, {
        role: "user",
        content: `Please analyze my spending and provide budget advice:
        
        Total Spent: $${totalSpent.toFixed(2)}
        
        Category Breakdown:
        ${categoryBreakdown.join('\n')}
        
        Recent Expenses:
        ${expenses.slice(-5).map(exp => `- ${exp.description}: $${exp.amount.toFixed(2)} (${exp.category})`).join('\n')}`
      }],
      temperature: 0.7,
      max_tokens: 300
    });

    const advice = completion.choices[0].message.content.trim();
    res.json({ advice });
    
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ error: 'Failed to generate budget advice' });
  }
});

// AI-powered budget suggestion endpoint
app.post('/api/budget-suggestion', async (req, res) => {
  const { expenses, categoryTotals } = req.body;
  
  if (!OPENAI_API_KEY) {
    // Fallback to simple suggestion
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const suggested = Math.ceil(total * 1.2); // 20% buffer
    
    return res.json({
      suggestion: suggested,
      reasoning: `Based on your current spending of $${total.toFixed(2)}, I suggest a monthly budget of $${suggested.toFixed(2)} to give you some buffer.`
    });
  }

  if (!expenses || expenses.length === 0) {
    return res.json({
      suggestion: 2000,
      reasoning: 'Start with a $2000 monthly budget and adjust based on your actual spending patterns.'
    });
  }

  try {
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const categoryBreakdown = Object.entries(categoryTotals || {})
      .map(([category, data]) => `${category}: $${data.total.toFixed(2)} (${((data.total / totalSpent) * 100).toFixed(1)}%)`);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "system",
        content: `You are a financial advisor helping users set realistic monthly budgets. Analyze their spending patterns and suggest an appropriate monthly budget.
        
        Consider:
        - Current spending patterns and trends
        - Reasonable buffer for unexpected expenses (10-20%)
        - Category-specific recommendations
        - 50/30/20 rule when applicable (needs/wants/savings)
        
        Respond with JSON format: {"suggestion": number, "reasoning": "explanation"}
        The suggestion should be a realistic monthly budget amount (number only).
        The reasoning should be 1-2 sentences explaining the recommendation.`
      }, {
        role: "user",
        content: `Suggest a monthly budget based on my spending:
        
        Current Total: $${totalSpent.toFixed(2)}
        
        Category Breakdown:
        ${categoryBreakdown.join('\n')}
        
        Number of expenses tracked: ${expenses.length}`
      }],
      temperature: 0.3,
      max_tokens: 200
    });

    const aiResponse = completion.choices[0].message.content.trim();
    
    try {
      const suggestion = JSON.parse(aiResponse);
      res.json(suggestion);
    } catch (parseError) {
      console.error('Failed to parse AI budget suggestion:', aiResponse);
      // Fallback to simple calculation
      const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const suggested = Math.ceil(total * 1.15); // 15% buffer
      
      res.json({
        suggestion: suggested,
        reasoning: `Based on your spending patterns, I recommend $${suggested.toFixed(2)} monthly budget with a 15% buffer for flexibility.`
      });
    }
    
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ error: 'Failed to generate budget suggestion' });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 React Budget Assistant server running on port ${PORT}`);
  console.log(`🔗 Frontend will be available at http://localhost:3000`);
  console.log(`🔗 Backend API available at http://localhost:${PORT}/api`);
  console.log(`🔑 OpenAI API Key: ${process.env.OPENAI_API_KEY ? 'Configured' : 'Not configured'}`);
});

module.exports = app;
