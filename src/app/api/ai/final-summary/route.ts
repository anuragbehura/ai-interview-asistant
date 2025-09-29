import { NextResponse } from "next/server";

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini';

export async function POST(req: Request) {
    try {
        const payload = await req.json(); // expected { name, answers, totalScore }
        const { name = 'Candidate', answers = [], totalScore = 0 } = payload;

        const shortAnswers = (answers as any[]).map(a => `Q: ${a.question}\nA: ${a.answer || '[no answer]'}\nScore: ${a.score}`).join('\n\n');

        const prompt = `You are an interviewer assistant. Create a concise 3-sentence summary about ${name}, highlighting strengths and weaknesses, based on the following answers and total score (${totalScore}). Do not exceed 60 words.

${shortAnswers}
`;

        const res = await fetch(OPENAI_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.6,
                max_tokens: 150,
            }),
        });

        if (!res.ok) {
            const txt = await res.text();
            return NextResponse.json({ error: 'OpenAI error', detail: txt }, { status: 502 });
        }

        const j = await res.json();
        const content = j.choices?.[0]?.message?.content || '';
        return NextResponse.json({ summary: content });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
