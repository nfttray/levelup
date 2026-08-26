export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'OPENAI_API_KEY is not configured on the server.',
      answer: 'Shadow AI backend connected nahi hai. Vercel Environment Variables me OPENAI_API_KEY add karo.'
    });
  }

  try {
    const body = req.body || {};
    const message = String(body.message || '').slice(0, 12000);
    const context = body.context || {};
    const image = body.image || null;

    const system = `You are Shadow AI, a strict but supportive selection coach for RRB Technician Grade 1 and SSC CGL.
Answer in the user's Hindi/Hinglish style unless they ask otherwise.
Use the supplied study context to personalize answers, but do not invent mock results, questions, or facts that are not supplied.
For academic questions, solve carefully and explain the method. For an image question, inspect the image and give: final answer, short step-by-step solution, subject/topic, likely mistake/trap, and a small revision suggestion.
For coaching questions, be concrete: identify the bottleneck, give a drill, duration, target, and how to measure improvement.
If the user asks to add something to revision, give a clear proposed revision item and schedule, but the browser app handles the actual local queue state.
If the user asks about their mock performance, use only the supplied mock/context data.`;

    const contextText = JSON.stringify(context).slice(0, 50000);
    const prompt = `${message || 'Solve the attached question image.'}\n\nSTUDY CONTEXT:\n${contextText}`;

    const content = [{ type: 'input_text', text: prompt }];
    if (image && typeof image.dataUrl === 'string' && image.dataUrl.startsWith('data:image/')) {
      content.push({ type: 'input_image', image_url: image.dataUrl, detail: 'high' });
    }

    const upstream = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-5.6-luna',
        input: [{ role: 'user', content }]
      })
    });

    const data = await upstream.json();
    if (!upstream.ok) {
      console.error('OpenAI error:', data);
      return res.status(502).json({
        error: 'AI provider request failed',
        answer: `Shadow AI provider error: ${data?.error?.message || 'request failed'}`
      });
    }

    const answer = data.output_text || data.output?.flatMap(x => x.content || [])?.filter(x => x.type === 'output_text')?.map(x => x.text).join('\n') || '';
    if (!answer) return res.status(502).json({ error: 'Empty AI response' });

    return res.status(200).json({ answer });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Shadow AI server error', answer: 'Shadow AI backend me temporary error aaya. Thodi der baad try karo.' });
  }
}
