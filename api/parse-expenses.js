// AI-powered expense parsing endpoint for Vercel
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

  const { text } = req.body;
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  
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

  // Initialize OpenAI
  const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
  });

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
}