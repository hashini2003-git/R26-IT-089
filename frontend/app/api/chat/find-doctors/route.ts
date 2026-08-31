import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

type Doctor = {
  name: string;
  type: string;
  location: string;
  notes: string;
  phone?: string;
  website?: string;
};

const FALLBACK_BY_CITY: Record<string, Doctor[]> = {
  colombo: [
    {
      name: 'National Cancer Institute (Apeksha Hospital)',
      type: 'Hospital',
      location: 'Maharagama, Colombo',
      notes: "Sri Lanka's main public cancer referral center, with dedicated oral & maxillofacial oncology care. Free of charge.",
      phone: '+94 11 285 0253',
      website: 'https://www.ncisl.health.gov.lk/',
    },
    {
      name: 'Lanka Hospitals',
      type: 'Hospital',
      location: '578 Elvitigala Mawatha, Narahenpita, Colombo 5',
      notes: 'Private JCI-accredited hospital with oral and maxillofacial surgery, ENT, and cancer care services.',
      phone: '+94 11 543 0000',
      website: 'https://www.lankahospitals.com/',
    },
    {
      name: 'Asiri Surgical Hospital',
      type: 'Hospital',
      location: 'Kirimandala Mawatha, Colombo 5',
      notes: 'Private hospital offering ENT and oral & maxillofacial surgery consultations.',
      phone: '+94 11 452 4400',
      website: 'https://www.asirihealth.com/',
    },
    {
      name: 'National Hospital of Sri Lanka',
      type: 'Hospital',
      location: 'Regent St, Colombo 10',
      notes: 'Largest public teaching hospital; ENT and oral & maxillofacial surgery departments.',
      phone: '+94 11 269 1111',
      website: 'http://www.nhsl.health.gov.lk/',
    },
  ],
  kandy: [
    {
      name: 'National Hospital (Teaching), Kandy',
      type: 'Hospital',
      location: 'Kandy',
      notes: 'Second-largest hospital in Sri Lanka; major tertiary care unit for the Central Province with ENT and oral surgery care.',
      phone: '+94 81 223 3337',
      website: 'https://nhkandy.org/',
    },
    {
      name: 'Asiri Central Hospital, Kandy',
      type: 'Hospital',
      location: 'Peradeniya Rd, Kandy',
      notes: 'Private hospital in Kandy offering surgical and specialist consultations.',
      phone: '+94 81 563 0000',
      website: 'https://www.asirihealth.com/asiri-central-hospital.html',
    },
  ],
  galle: [
    {
      name: 'Teaching Hospital Karapitiya',
      type: 'Hospital',
      location: 'Karapitiya, Galle',
      notes: 'Main public teaching hospital for the Southern Province; ENT and oral & maxillofacial surgery units.',
      phone: '+94 91 223 3322',
      website: 'http://www.thkarapitiya.health.gov.lk/',
    },
  ],
  jaffna: [
    {
      name: 'Teaching Hospital Jaffna',
      type: 'Hospital',
      location: 'Hospital Rd, Jaffna',
      notes: 'Main public teaching hospital for the Northern Province; ENT and oral surgery departments.',
      phone: '+94 21 222 2261',
      website: 'http://www.jth.health.gov.lk/',
    },
  ],
};

const DEFAULT_FALLBACK: Doctor[] = FALLBACK_BY_CITY.colombo;

function getFallback(city: string): { doctors: Doctor[]; matchedCity: boolean } {
  const key = city.trim().toLowerCase();
  for (const cityKey of Object.keys(FALLBACK_BY_CITY)) {
    if (key.includes(cityKey)) return { doctors: FALLBACK_BY_CITY[cityKey], matchedCity: true };
  }
  return { doctors: DEFAULT_FALLBACK, matchedCity: false };
}

export async function POST(request: NextRequest) {
  let city = '';
  let condition = '';
  try {
    const body = (await request.json()) as { city?: string; condition?: string };
    city = body.city ?? '';
    condition = body.condition ?? '';
  } catch {
    // ignore, use defaults
  }

  if (!process.env.GEMINI_API_KEY) {
    const { doctors, matchedCity } = getFallback(city);
    return NextResponse.json({ doctors, fallback: true, matchedCity });
  }

  try {
    const prompt = `
You are a clinical referral assistant for OralCare AI, a Sri Lanka-based oral health platform.

Use Google Search to find real, currently operating oral medicine specialists, oral & maxillofacial surgeons, oncologists, or hospitals in ${city || 'Sri Lanka'} that treat ${condition || 'oral lesions and oral cancer'}.

Return ONLY a JSON array (no markdown, no code fences, no extra text) of up to 6 objects, each shaped exactly like:
{"name": "string", "type": "Hospital | Specialist | Dental Clinic", "location": "string", "notes": "one short sentence on why relevant", "phone": "phone number if you found one, else omit this field", "website": "official website URL if you found one, else omit this field"}

Only include phone and website if you are confident they are accurate from search results. If unsure, omit those fields rather than guessing.
If you cannot find real results, return an empty array: []
`;

    const result = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const raw = (result.text || '[]').trim();
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');

    let doctors: Doctor[] = [];
    try {
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed) && parsed.length > 0) doctors = parsed;
    } catch {
      doctors = [];
    }

    if (doctors.length === 0) {
      const fb = getFallback(city);
      return NextResponse.json({ doctors: fb.doctors, fallback: true, matchedCity: fb.matchedCity });
    }

    return NextResponse.json({ doctors, fallback: false });
  } catch (error) {
    console.error('Gemini Error (find-doctors):', error);
    const fb = getFallback(city);
    return NextResponse.json({ doctors: fb.doctors, fallback: true, matchedCity: fb.matchedCity });
  }
}