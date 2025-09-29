import { v4 as uuidv4 } from 'uuid';

type Difficulty = 'easy' | 'medium' | 'hard';

type Question = {
    id: string;
    text: string;
    difficulty: Difficulty;
    timeLimit: number;
};

const TIME_LIMITS: Record<Difficulty, number> = {
    easy: 20,
    medium: 60,
    hard: 120,
};

export function generateInterviewQuestions(): Question[] {
    // Fallback questions. Replace with AI generation if you want.
    const easy: Question[] = [
        { id: uuidv4(), text: 'What is React and why would you use it?', difficulty: 'easy', timeLimit: TIME_LIMITS.easy },
        { id: uuidv4(), text: 'Describe the difference between var, let and const in JS.', difficulty: 'easy', timeLimit: TIME_LIMITS.easy },
    ];
    const medium: Question[] = [
        { id: uuidv4(), text: 'Explain the React component lifecycle or hooks flow for data fetching.', difficulty: 'medium', timeLimit: TIME_LIMITS.medium },
        { id: uuidv4(), text: 'How would you design an API for a product catalog with filtering & pagination?', difficulty: 'medium', timeLimit: TIME_LIMITS.medium },
    ];
    const hard: Question[] = [
        { id: uuidv4(), text: 'Describe how to scale a Node.js service under heavy write traffic (design + tradeoffs).', difficulty: 'hard', timeLimit: TIME_LIMITS.hard },
        { id: uuidv4(), text: 'Explain how you would debug a memory leak in a fullstack app and steps to mitigate it.', difficulty: 'hard', timeLimit: TIME_LIMITS.hard },
    ];

    return [...easy, ...medium, ...hard];
}