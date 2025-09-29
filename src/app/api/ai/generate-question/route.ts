import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini'; // pick a model available to you

export async function POST(req: Request) {
    try {
        const { role = 'fullstack', stack = 'React/Node' } = await req.json().catch(() => ({}));

        const prompt = `Create 6 interview questions for a ${role} role focused on ${stack}. 
Return JSON array of objects with fields: text, difficulty (easy|medium|hard), timeLimitInSeconds.
Structure: 2 easy (20s), 2 medium (60s), 2 hard (120s). Keep questions concise.`;

        const res = await fetch(OPENAI_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [{ role: 'system', content: 'You are a helpful interviewer.' }, { role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 600,
            }),
        });

        if (!res.ok) {
            const txt = await res.text();
            return NextResponse.json({ error: 'OpenAI error', detail: txt }, { status: 502 });
        }

        const j = await res.json();
        const assistant = j.choices?.[0]?.message?.content || "";
        // assistant should output structured JSON. Try to parse — fallback to simple local generation.
        try {
            const parsed = JSON.parse(assistant);
            // Map to our shape and add ids
            const mapped = parsed.map((p: any) => ({
                id: uuidv4(),
                text: p.text,
                difficulty: p.difficulty,
                timeLimit: p.timeLimitInSeconds,
            }));
            return NextResponse.json({ questions: mapped });
        } catch (err) {
            // fallback: generate local if parsing fails
            const fallback = [
                { id: uuidv4(), text: 'What is React and why use it?', difficulty: 'easy', timeLimit: 20 },
                { id: uuidv4(), text: 'Explain var/let/const differences', difficulty: 'easy', timeLimit: 20 },
                { id: uuidv4(), text: 'Describe hooks for data fetching', difficulty: 'medium', timeLimit: 60 },
                { id: uuidv4(), text: 'How would you design a REST API for products?', difficulty: 'medium', timeLimit: 60 },
                { id: uuidv4(), text: 'How to scale Node.js write-heavy service?', difficulty: 'hard', timeLimit: 120 },
                { id: uuidv4(), text: 'How to detect and fix memory leaks in fullstack apps?', difficulty: 'hard', timeLimit: 120 },
            ];
            return NextResponse.json({ questions: fallback });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
