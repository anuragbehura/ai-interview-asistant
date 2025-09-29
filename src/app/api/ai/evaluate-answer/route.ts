import { NextResponse } from "next/server";

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini';

export async function POST(req: Request) {
    try {
        const payload = await req.json();
        const { question, answer, difficulty, timeLimit, timeSpent } = payload;

        // Build a succinct prompt telling the model how to score (0-100) and produce a short feedback.
        const prompt = `You are an interviewer scoring candidate answers (0-100).
Score the answer to the question below. Provide a numeric score and a one-line feedback.
Respond JSON: {"score": number, "feedback":"..."}.

Question: ${question}
Difficulty: ${difficulty}
Time limit: ${timeLimit}
Time spent: ${timeSpent}
Candidate answer: ${answer}
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
                temperature: 0.0,
                max_tokens: 200,
            }),
        });

        if (!res.ok) {
            const txt = await res.text();
            return NextResponse.json({ error: 'OpenAI error', detail: txt }, { status: 502 });
        }

        const j = await res.json();
        const content = j.choices?.[0]?.message?.content || '';

        try {
            const parsed = JSON.parse(content);
            return NextResponse.json({ score: parsed.score, feedback: parsed.feedback });
        } catch (e) {
            // Fallback: very naive heuristics
            const len = (answer || '').length;
            let score = 0;
            if (!answer) score = 0;
            else if (len < 20) score = 30;
            else if (len < 80) score = 60;
            else score = 85;
            const feedback = 'Auto-evaluated (fallback) — consider adding more detail and examples.';
            return NextResponse.json({ score, feedback });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
