import { NextRequest, NextResponse } from 'next/server';
import { generateGeminiText } from '../../../lib/gemini';

type OralChatContext = {
  classification?: string;
  confidence?: number;
  ppiScore?: number;
  ppiMax?: number;
  ppiLabel?: string;
  erythema?: number;
  ulceration?: number;
  texture?: number;
  urgencyLevel?: string;
  urgencyMessage?: string;
  urgencyTimeframe?: string;
  treatmentImmediate?: string[];
  treatmentShortTerm?: string[];
};

function isDoctorQuery(msg: string): boolean {
  const lower = msg.toLowerCase();
  const keywords = [
    'doctor', 'clinic', 'hospital', 'specialist', 'surgeon', 'dentist',
    'appointment', 'book', 'refer', 'oncologist', 'nearby', 'near me',
    'where can i', 'find a', 'recommend',
  ];
  return keywords.some((k) => lower.includes(k));
}

export async function POST(request: NextRequest) {
  try {
    const { message, context } = (await request.json()) as { message: string; context?: OralChatContext };
    const useSearch = isDoctorQuery(message);

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ reply: getFallbackResponse(message, context) });
    }

    const prompt = `
You are the OralCare AI Guide, a compassionate clinical assistant helping a patient understand their AI-powered oral lesion analysis.

Patient's Analysis Results:
- Diagnosis: ${context?.classification ?? 'Not yet analyzed'} (${context?.confidence ?? 0}% AI confidence)
- Pain Intensity (PPI): ${context?.ppiScore?.toFixed?.(1) ?? 'N/A'} out of ${context?.ppiMax ?? 10} — rated "${context?.ppiLabel ?? 'unknown'}"
- Visual findings: redness ${context?.erythema ?? 0}%, open sores ${context?.ulceration ?? 0}%, tissue stiffness ${context?.texture ?? 0}%
- Urgency: ${context?.urgencyLevel ?? 'unknown'} — recommended within ${context?.urgencyTimeframe ?? 'a routine visit'}
- Immediate care steps: ${(context?.treatmentImmediate ?? []).join('; ') || 'none listed'}
- This-week care steps: ${(context?.treatmentShortTerm ?? []).join('; ') || 'none listed'}

- This-week care steps: ${(context?.treatmentShortTerm ?? []).join('; ') || 'none listed'}

${useSearch ? 'The patient is asking about finding a doctor, clinic, or specialist. Use Google Search to find real, current oral medicine specialists, oral surgeons, oncologists, or hospitals in Sri Lanka relevant to their question. Name specific real clinics/hospitals with their general location (e.g. "Apeksha Hospital, Maharagama" or "Lanka Hospitals, Colombo"). If they have not mentioned a city, default to well-known Sri Lankan options in Colombo, and ask which city they are actually in for more precise results.' : ''}

Patient's question:
${message}

Reply warmly and clearly in plain language. Reference their actual results where relevant.
Always encourage seeing a real clinician for diagnosis or treatment decisions — you support, you don't replace, professional care.
Keep it concise (2-4 sentences). Do not use markdown headers, only ** for emphasis on key terms.
`;

    const result = { text: await generateGeminiText({
      model: 'gemini-3.7-flash',
      prompt,
      googleSearch: useSearch,
    }) };

    return NextResponse.json({
      reply: result.text || "I'm here to help you understand your results. Could you rephrase that?",
    });
  } catch (error) {
    console.error('Gemini Error (oral-chat):', error);
    try {
      const { message, context } = (await request.json()) as { message: string; context?: OralChatContext };
      return NextResponse.json({ reply: getFallbackResponse(message, context) });
    } catch {
      return NextResponse.json({
        reply: "I'm here to help. Ask me about your diagnosis, pain score, or treatment plan.",
      });
    }
  }
}

function getFallbackResponse(message: string, context?: OralChatContext): string {
  const lower = message.toLowerCase();
  const ppiMax = context?.ppiMax ?? 10;

  if (lower.includes('diagnosis') || lower.includes('opmd') || lower.includes('classified') || lower.includes('mean')) {
    const name = context?.classification ?? 'your result';
    const explain =
      name === 'OPMD'
        ? 'an Oral Potentially Malignant Disorder — tissue changes that are not cancer but need monitoring and clinical evaluation'
        : name === 'Oral Cancer'
        ? 'signs consistent with oral cancer — please see a specialist immediately'
        : name === 'Normal'
        ? 'no significant pathological signs — your oral tissue appears healthy'
        : 'minor tissue variations that should be monitored but are not immediately dangerous';
    return `Your diagnosis is **${name}**. This means the AI detected ${explain}. The AI confidence was ${context?.confidence ?? 0}%.`;
  }

  if (lower.includes('pain') || lower.includes('ppi') || lower.includes('score')) {
    const score = context?.ppiScore ?? 0;
    const severe = score / ppiMax > 0.6;
    return `Your pain score (PPI) is **${score.toFixed?.(1) ?? score} out of ${ppiMax}**, rated as "${context?.ppiLabel ?? 'unknown'}". This is calculated from visible signs like redness (${context?.erythema ?? 0}%), open sores (${context?.ulceration ?? 0}%), and tissue stiffness (${context?.texture ?? 0}%). ${severe ? 'This level suggests significant discomfort. Pain management and urgent clinical review are recommended.' : 'This level is moderate — follow your care plan and monitor for changes.'}`;
  }

  if (lower.includes('do now') || lower.includes('next step') || lower.includes('what should') || lower.includes('treatment')) {
    return `Based on your results, here are your immediate steps:\n\n**Right now:** ${context?.treatmentImmediate?.[0] ?? 'Follow your care plan.'}\n\n**This week:** ${context?.treatmentShortTerm?.[0] ?? 'Monitor your symptoms.'}\n\n**Most importantly:** ${context?.urgencyMessage ?? 'See a clinician if symptoms worsen.'}`;
  }

  return "I understand your concern. Based on what you've shared, the most important thing right now is to follow your care plan and book a clinical consultation if you haven't already. Would you like me to explain any specific part of your results?";
}
