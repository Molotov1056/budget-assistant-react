// AI-powered budget suggestion endpoint for Vercel
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

  // Initialize OpenAI
  const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
  });

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
}