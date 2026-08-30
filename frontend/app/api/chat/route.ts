import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        reply: getFallbackResponse(message, context),
      });
    }

    const prompt = `
You are Vocal Therapy AI, a compassionate speech therapy assistant.

Patient Context:
- Sessions completed: ${context?.sessionCount || 0}
- Latest score: ${context?.latestScore ?? 'N/A'}/100
- Progress trend: ${context?.trend || 'stable'}

User question:
${message}

Provide a warm, helpful response about speech recovery.
Keep it concise (2-4 sentences).
`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return NextResponse.json({
      reply:
        result.text ||
        "I'm here to help with your speech recovery journey. 💙",
    });
  } catch (error) {
    console.error('Gemini Error:', error);

    try {
      const { message, context } = await request.json();

      return NextResponse.json({
        reply: getFallbackResponse(message, context),
      });
    } catch {
      return NextResponse.json({
        reply:
          "I'm here to help! Ask me about speech exercises, progress tracking, or finding a therapist. 💙",
      });
    }
  }
}

function getFallbackResponse(message: string, context: any): string {
  const msg = message.toLowerCase();
  const score = context?.latestScore;
  const sessions = context?.sessionCount || 0;

  if (
    msg.includes('score') ||
    msg.includes('progress') ||
    msg.includes('doing')
  ) {
    if (sessions === 0) {
      return "📝 You haven't recorded any sessions yet! Click 'Record today' to get your first score.";
    }

    if (score < 40) {
      return `⚠️ Your score is ${score}/100. Consider consulting a speech therapist for personalized guidance.`;
    }

    if (score < 60) {
      return `📈 Your score is ${score}/100. You're making progress! Continue daily exercises and stay consistent.`;
    }

    return `🎉 Great work! Your score is ${score}/100. Keep maintaining your routine.`;
  }

  if (
    msg.includes('exercise') ||
    msg.includes('practice')
  ) {
    return `🎵 Try lip trills, humming scales, tongue twisters, deep breathing, and vowel stretches for 10–15 minutes daily.`;
  }

  if (
    msg.includes('therapist') ||
    msg.includes('doctor')
  ) {
    return `👨‍⚕️ ASHA ProFind and local speech-language pathology clinics are good places to start.`;
  }

  return `🤖 I'm here to support your speech recovery. Ask me about exercises, progress tracking, therapists, anxiety management, or daily practice tips. 💙`;
}