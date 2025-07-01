export default async function handler(req, res) {
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

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({ error: 'OpenRouter API key not configured' });
    }

    const prompt = `
Bạn là chuyên gia thần số học với hơn 20 năm kinh nghiệm.

Thông tin:
- Trường: ${field}
- Giá trị: "${text}"
- Con số thần số học: ${number}

Hãy phân tích theo 5 mục:
1. Giới thiệu về số này
2. Tính cách và điểm mạnh
3. Thử thách và bài học
4. Nội tâm và cảm xúc
5. Định hướng nghề nghiệp

Viết bằng tiếng Việt, súc tích nhưng sâu sắc (200–300 từ).
`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://your-app-name.vercel.app', // thay bằng tên app bạn nếu cần
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo', // hoặc 'anthropic/claude-3-sonnet' nếu bạn dùng Claude
        messages: [
          {
            role: 'system',
            content: 'Bạn là chuyên gia thần số học, hãy trả lời ngắn gọn nhưng truyền cảm hứng.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || 'Không thể tạo nội dung.';

    return res.status(200).json({ analysis });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}
