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

Tôi muốn bạn đóng vai một chuyên gia thần số học với hơn 20 năm kinh nghiệm và khả năng diễn giải sâu sắc, rõ ràng, truyền cảm hứng.
Hãy phân tích toàn diện hồ sơ thần số học của một người dựa trên tên đầy đủ và ngày sinh dưới đây:


---

📛 Họ tên: ${field} 
📅 Ngày sinh: ${text}

Hãy trình bày các nội dung sau:

1. Tổng quan thần số học cá nhân

Phân tích tổng quát năng lượng bao trùm con người này

Những xu hướng tâm linh, nhân sinh, nghiệp lực nổi bật trong ngày sinh


2. Các con số chính và ý nghĩa

✅ Con số Đường đời (Life Path Number) – Phân tích chi tiết mục đích sống, bài học lớn

✅ Con số Linh hồn (Soul Urge / Heart's Desire) – Động lực sâu thẳm, cảm xúc bên trong

✅ Con số Biểu hiện (Expression Number) – Tính cách, tài năng, cách người khác nhìn thấy họ

✅ Con số Nhân cách (Personality Number) – Ấn tượng ban đầu và hành vi xã hội

✅ Con số Ngày sinh (Birthday Number) – Quà tặng bẩm sinh và điểm mạnh tiềm ẩn

✅ Con số Trưởng thành (Maturity Number) – Tầm nhìn dài hạn, giai đoạn sau tuổi 40

✅ Chu kỳ 9 năm và năm cá nhân hiện tại


3. Phân tích sâu từng khía cạnh

Với mỗi con số, vui lòng phân tích các yếu tố sau:

Ý nghĩa sâu sắc nhất

Điểm mạnh nổi bật

Thử thách/tổn thương thường gặp

Bài học cần học

Nghề nghiệp/phong cách sống phù hợp


4. Thông điệp tổng hợp

Kết nối các con số chính để đưa ra thông điệp tổng thể về hành trình tâm linh, con đường phát triển phù hợp và tiềm năng phát triển cao nhất.

Gợi ý định hướng cuộc sống, chữa lành và phát triển bản thân.

👉 Viết theo văn phong gần gũi, sâu sắc, truyền cảm hứng – có thể dùng ngôi thứ hai (“bạn”) để kết nối trực tiếp với người đọc.`;
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
