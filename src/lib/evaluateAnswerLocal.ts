type Difficulty = 'easy' | 'medium' | 'hard';
type Question = {
    id: string;
    text: string;
    difficulty: Difficulty;
    timeLimit: number;
};


function evaluateAnswerLocal(question: Question, answer: string, timeSpent: number) {
    // Basic heuristics: length, presence of keywords, quickness
    const trimmed = (answer || '').trim();
    let score = 0;
    let feedback = '';

    if (!trimmed) {
        feedback = 'No answer provided.';
        return { score: 0, feedback };
    }

    // length heuristic
    const len = trimmed.length;
    if (len < 20) score += 20;
    else if (len < 80) score += 45;
    else score += 70;

    // difficulty bonus
    if (question.difficulty === 'easy') score += 10;
    if (question.difficulty === 'medium') score += 15;
    if (question.difficulty === 'hard') score += 20;

    // speed bonus (answered faster than half time -> small bonus)
    if (timeSpent < question.timeLimit / 2) score += 5;

    // clamp to 0..100
    score = Math.max(0, Math.min(100, Math.round(score)));

    // feedback short hint
    if (score > 80) feedback = 'Great answer — thorough and on point.';
    else if (score > 50) feedback = 'Solid answer — covers main points but could be deeper.';
    else feedback = 'Short or lacking depth — try to include reasoning and examples.';

    return { score, feedback };
}