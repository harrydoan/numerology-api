
  // Cho phép CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
      res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
          res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
            
              if (req.method === 'OPTIONS') {
                  res.status(200).end();
                      return;
                        }
                          
                            if (req.method !== 'POST') {
                                return res.status(405).json({ error: 'Method not allowed' });
                                  }
                                    
                                      try {
                                          const { field, number, text } = req.body;
                                              
                                                  if (!field || number === undefined || !text) {
                                                        return res.status(400).json({ error: 'Missing required fields' });
                                                            }
                                                                
                                                                    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
                                                                        
                                                                            if (!OPENAI_API_KEY) {
                                                                                  return res.status(500).json({ error: 'OpenAI API key not configured' });
                                                                                      }
                                                                                          
                                                                                              const prompt = `Phân tích thần số học cho ${field} "${text}" mang con số ${number}. Hãy phân tích chi tiết các đặc điểm, điểm mạnh, bài học, thách thức. Viết ngắn gọn trong 3-4 câu, súc tích nhưng sâu sắc.`;
                                                                                                  
                                                                                                      const response = await fetch('https://api.openai.com/v1/chat/completions', {
                                                                                                            method: 'POST',
                                                                                                                  headers: {
                                                                                                                          'Content-Type': 'application/json',
                                                                                                                                  'Authorization': `Bearer ${OPENAI_API_KEY}`
                                                                                                                                        },
                                                                                                                                              body: JSON.stringify({
                                                                                                                                                      model: 'gpt-3.5-turbo',
                                                                                                                                                              messages: [
                                                                                                                                                                        {
                                                                                                                                                                                    role: 'system',
                                                                                                                                                                                                content: 'Bạn là chuyên gia thần số học với 20 năm kinh nghiệm. Hãy phân tích sâu sắc nhưng dễ hiểu.'
                                                                                                                                                                                                          },
                                                                                                                                                                                                                    {
                                                                                                                                                                                                                                role: 'user',
                                                                                                                                                                                                                                            content: prompt
                                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                                              ],
                                                                                                                                                                                                                                                                      temperature: 0.7,
                                                                                                                                                                                                                                                                              max_tokens: 200
                                                                                                                                                                                                                                                                                    })
                                                                                                                                                                                                                                                                                        });
                                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                                if (!response.ok) {
                                                                                                                                                                                                                                                                                                      throw new Error(`OpenAI API error: ${response.status}`);
                                                                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                  const data = await response.json();
                                                                                                                                                                                                                                                                                                                      const analysis = data.choices[0].message.content;
                                                                                                                                                                                                                                                                                                                          
                                                                                                                                                                                                                                                                                                                              return res.status(200).json({ analysis });
                                                                                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                    } catch (error) {
                                                                                                                                                                                                                                                                                                                                        console.error('Error:', error);
                                                                                                                                                                                                                                                                                                                                            return res.status(500).json({ 
                                                                                                                                                                                                                                                                                                                                                  error: 'Internal server error',
                                                                                                                                                                                                                                                                                                                                                        message: process.env.NODE_ENV === 'development' ? error.message : undefined
                                                                                                                                                                                                                                                                                                                                                            });
                                                                                                                                                                                                                                                                                                                                                              }
      export default async function handler(req, res) {
  // Cho phép CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { field, number, text } = req.body;
    
    if (!field || number === undefined || !text) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }
    
    const prompt = `Phân tích thần số học cho ${field} "${text}" mang con số ${number}. Hãy phân tích chi tiết các đặc điểm, điểm mạnh, bài học, thách thức. Viết ngắn gọn trong 3-4 câu, súc tích nhưng sâu sắc.`;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Bạn là chuyên gia thần số học với 20 năm kinh nghiệm. Hãy phân tích sâu sắc nhưng dễ hiểu.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json();
    const analysis = data.choices[0].message.content;
    
    return res.status(200).json({ analysis });
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}                                                                                                                                                                                                                                                                  