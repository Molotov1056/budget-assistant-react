// AI-powered budget advice endpoint for Vercel
import OpenAI from 'openai';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { expenses, categoryTotals } = req.body;
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  
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

  // Initialize OpenAI
  const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
  });

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
}