export default async function handler(req, res) {
  // CORS headers
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
    const { data, models } = req.body;
    
    if (!data || !models || !Array.isArray(data) || !Array.isArray(models)) {
      return res.status(400).json({ error: 'Invalid request format' });
    }
    
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    
    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({ error: 'OpenRouter API key not configured' });
    }
    
    // Tạo prompt cho phân tích thần số học
    const createPrompt = (field, number, text) => {
      return `Với vai trò là chuyên gia thần số học có 20 năm kinh nghiệm, hãy phân tích chi tiết cho ${field} "${text}" mang con số ${number}.

Viết 5-7 câu theo cấu trúc:
1. Giới thiệu về năng lượng và ý nghĩa của con số ${number}
2. Đặc điểm tính cách nổi bật và cách thể hiện trong cuộc sống
3. Điểm mạnh và tài năng đặc biệt cần phát huy
4. Thử thách và bài học quan trọng cần vượt qua
5. Nội tâm, cảm xúc sâu sắc và nhu cầu tiềm ẩn
6. Định hướng nghề nghiệp phù hợp với năng lượng này

Phong cách viết: Chuyên nghiệp, sâu sắc, truyền cảm hứng nhưng dễ hiểu. Tránh quá huyền bí, tập trung vào ứng dụng thực tiễn.`;
    };
    
    // Gọi API cho từng model
    const modelPromises = models.map(async (modelId) => {
      const analysisPromises = data.map(async (item) => {
        const prompt = createPrompt(item.field, item.number, item.text);
        
        try {
          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
              'HTTP-Referer': `https://${req.headers.host}`,
              'Content-Type': 'application/json',
              'X-Title': 'Numerology Multi-Model Analysis'
            },
            body: JSON.stringify({
              model: modelId,
              messages: [
                {
                  role: 'system',
                  content: `Bạn là chuyên gia thần số học với kiến thức sâu rộng. Phong cách phân tích của bạn phụ thuộc vào model:
                  - GPT: Phân tích logic, có cấu trúc rõ ràng, súc tích
                  - Claude: Phân tích sâu sắc về mặt cảm xúc, chi tiết và đồng cảm
                  - Gemini: Phân tích đơn giản, thực tế, dễ hiểu
                  - DeepSeek: Phân tích toàn diện, cân bằng giữa logic và cảm xúc`
                },
                {
                  role: 'user',
                  content: prompt
                }
              ],
              temperature: 0.7,
              max_tokens: 800
            })
          });
          
          if (!response.ok) {
            throw new Error(`Model ${modelId} returned ${response.status}`);
          }
          
          const result = await response.json();
          return {
            field: item.field,
            number: item.number,
            analysis: result.choices[0].message.content,
            key: item.key
          };
          
        } catch (error) {
          console.error(`Error with model ${modelId}:`, error);
          return {
            field: item.field,
            number: item.number,
            analysis: `Không thể phân tích với model này. Lỗi: ${error.message}`,
            key: item.key,
            error: true
          };
        }
      });
      
      const analyses = await Promise.all(analysisPromises);
      
      return {
        model: modelId,
        analyses
      };
    });
    
    const results = await Promise.all(modelPromises);
    
    return res.status(200).json({
      success: true,
      results
    });
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Không thể kết nối máy chủ. Vui lòng thử lại sau.'
    });
  }
}
