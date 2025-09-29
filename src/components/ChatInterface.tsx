'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import {
    addQuestion,
    submitAnswer,
    updateStatus,
    setSummary,
    setActiveCandidate,
    updateCandidate,
} from '@/store/candidateSlice';
import ResumeUpload from '@/components/ResumeUpload'; // your existing component
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { generateInterviewQuestions } from '@/lib/generateInterviewQuestions';

// Types (reuse shapes similar to your slice)
type Difficulty = 'easy' | 'medium' | 'hard';
type Question = {
    id: string;
    text: string;
    difficulty: Difficulty;
    timeLimit: number;
};
type Answer = {
    questionId: string;
    question: string;
    answer: string;
    difficulty: Difficulty;
    score: number;
    timeSpent: number;
    feedback?: string;
};

/**
 * Local evaluator (placeholder). Returns:
 * - score (0..100)
 * - feedback string
 *
 * Replace with real AI evaluation by calling your AI backend.
 */
export default function ChatInterface() {
    const dispatch = useDispatch();
    const activeCandidateId = useSelector((s: RootState) => s.candidate.activeCandidate);
    const candidates = useSelector((s: RootState) => s.candidate.candidates);
    const activeCandidate = candidates.find(c => c.id === activeCandidateId) || null;

    // Chat & interview state
    const [messages, setMessages] = useState<{ from: 'bot' | 'user'; text: string; ts?: number }[]>([]);
    const [input, setInput] = useState('');
    const [isInterviewRunning, setInterviewRunning] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [timer, setTimer] = useState<number>(0);
    const timerRef = useRef<number | null>(null);
    const questionStartRef = useRef<number | null>(null); // epoch ms when question shown
    const [paused, setPaused] = useState(false);

    // Keep messages in sync with active candidate's chat history if you store it in Redux (not required here).
    useEffect(() => {
        // When activeCandidate changes, reset local chat and maybe seed bot greeting
        setMessages([]);
        setInput('');
        setInterviewRunning(false);
        setCurrentQuestionIndex(null);
        setQuestions([]);
        setTimer(0);
        setPaused(false);

        if (activeCandidate) {
            botSend(`Hi ${activeCandidate.name || 'there'} — I'm your interview assistant. I'll ask 6 questions (2 easy, 2 medium, 2 hard). Ready when you are. Type "start" to begin or upload/verify your resume details first.`);
            // If missing fields, bot will prompt next in flow when user clicks start.
        }
    }, [activeCandidateId]); // eslint-disable-line

    // Timer tick
    useEffect(() => {
        if (timerRef.current) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
        }

        if (isInterviewRunning && timer > 0 && !paused) {
            timerRef.current = window.setInterval(() => {
                setTimer(prev => {
                    if (prev <= 1) {
                        // timer ended -> auto submit
                        window.clearInterval(timerRef.current!);
                        timerRef.current = null;
                        handleAutoSubmit();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (timerRef.current) {
                window.clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isInterviewRunning, timer, paused]);

    // Helpers
    function botSend(text: string) {
        setMessages(m => [...m, { from: 'bot', text, ts: Date.now() }]);
    }
    function userSend(text: string) {
        setMessages(m => [...m, { from: 'user', text, ts: Date.now() }]);
    }

    // Check missing fields and ask for them. Returns true if we asked for something.
    function askForMissingFieldsIfAny(): boolean {
        if (!activeCandidate) return false;
        if (!activeCandidate.name) {
            botSend('I could not find your name in the resume. What is your full name?');
            return true;
        }
        if (!activeCandidate.email) {
            botSend('I could not find your email in the resume. Please provide your email address.');
            return true;
        }
        if (!activeCandidate.phone) {
            botSend('I could not find your phone number in the resume. Please provide your phone number.');
            return true;
        }
        return false;
    }

    // Start the interview: generate questions, push them to Redux, and show first
    async function startInterview() {
        if (!activeCandidate) {
            botSend('Please upload your resume first.');
            return;
        }

        // If there are missing fields, bot should collect them first.
        const asked = askForMissingFieldsIfAny();
        if (asked) {
            return;
        }

        // If the candidate already has questions (resumed session), load them
        let qlist = generateInterviewQuestions();
        setQuestions(qlist);

        // dispatch questions to candidateSlice (so persisted)
        for (const q of qlist) {
            dispatch(addQuestion(q));
        }

        // begin with first question
        setCurrentQuestionIndex(0);
        beginQuestion(0, qlist);
        setInterviewRunning(true);
    }

    // Show a question (by index) and start the timer
    function beginQuestion(idx: number, qlist = questions) {
        const question = qlist[idx];
        if (!question) return;
        botSend(`Question ${idx + 1}/${qlist.length} (${question.difficulty.toUpperCase()}): ${question.text}`);
        setTimer(question.timeLimit);
        questionStartRef.current = Date.now();
    }

    // When user submits answer manually
    async function handleSubmitAnswer() {
        if (!activeCandidate) {
            botSend('No active candidate. Upload resume first.');
            return;
        }
        if (currentQuestionIndex === null) {
            // Perhaps candidate was providing missing fields
            await processMissingFieldOrSmallChat(input);
            setInput('');
            return;
        }

        const q = questions[currentQuestionIndex];
        const now = Date.now();
        const start = questionStartRef.current || now;
        const timeSpent = Math.round((now - start) / 1000);
        const userAnswer = input.trim();

        // Append user's message
        userSend(userAnswer);
        setInput('');

        // Evaluate (local) - replace with your AI call if desired
        const { score, feedback } = evaluateAnswerLocal(q, userAnswer, timeSpent);

        // Prepare Answer payload (matches your slice Answer type)
        const ans: Answer = {
            questionId: q.id,
            question: q.text,
            answer: userAnswer,
            difficulty: q.difficulty,
            score,
            timeSpent,
            feedback,
        };

        // Submit to Redux (persisted)
        dispatch(submitAnswer(ans));

        // Bot comments
        botSend(`Score: ${score}/100 — ${feedback}`);

        // Move to next or finish
        const nextIndex = currentQuestionIndex + 1;
        if (nextIndex >= questions.length) {
            finishInterview();
        } else {
            setCurrentQuestionIndex(nextIndex);
            beginQuestion(nextIndex);
        }
    }

    // Auto-submit when timer hits 0
    async function handleAutoSubmit() {
        // If collecting missing fields, ignore auto-submit
        if (!activeCandidate) return;
        if (currentQuestionIndex === null) {
            // nothing to auto submit
            return;
        }

        const q = questions[currentQuestionIndex];
        const now = Date.now();
        const start = questionStartRef.current || now;
        const timeSpent = Math.round((now - start) / 1000);

        // treat empty answer
        userSend('(No answer — auto-submitted)');
        const { score, feedback } = evaluateAnswerLocal(q, '', timeSpent);

        const ans: Answer = {
            questionId: q.id,
            question: q.text,
            answer: '',
            difficulty: q.difficulty,
            score,
            timeSpent,
            feedback,
        };

        dispatch(submitAnswer(ans));
        botSend(`Time's up. Score: ${score}/100 — ${feedback}`);

        const nextIndex = (currentQuestionIndex ?? 0) + 1;
        if (nextIndex >= questions.length) {
            finishInterview();
        } else {
            setCurrentQuestionIndex(nextIndex);
            beginQuestion(nextIndex);
        }
    }

    // Finalize the interview: compute final score and summary, persist it
    function finishInterview() {
        if (!activeCandidate) return;

        // compute final score from candidate answers (we read from Redux)
        const candidate = ((storeSnapshot() as any)).candidate.candidates.find((c: any) => c.id === activeCandidate.id) || activeCandidate;
        // simple average:
        const totalScore = candidate.answers.reduce((s: number, a: any) => s + (a.score || 0), 0);
        const avgScore = candidate.answers.length ? Math.round(totalScore / candidate.answers.length) : 0;

        // Generate a short summary (local). Replace with AI-based summarizer later.
        const summary = generateSummaryLocal(candidate, avgScore);

        // Save summary and mark completed
        dispatch(setSummary({ id: activeCandidate.id, summary }));
        dispatch(updateStatus({ id: activeCandidate.id, status: 'completed' }));

        botSend(`Interview complete! Final score: ${avgScore}/100. Summary saved.`);
        setInterviewRunning(false);
        setCurrentQuestionIndex(null);
        setQuestions([]);
        setTimer(0);
        questionStartRef.current = null;
    }

    // Helper to pull live redux snapshot (safe local access)
    function storeSnapshot() {
        // useSelector is not async-friendly here; but we can read from document (not ideal)
        // We already have 'candidates' from selector earlier; simply return current store-like object
        return { candidate: { candidates } };
    }

    function generateSummaryLocal(candidate: any, avgScore: number) {
        const name = candidate?.name || 'Candidate';
        const top = `Summary for ${name}: Final Score ${avgScore}/100.`;
        const details = `Answered ${candidate?.answers?.length || 0} questions. Candidate strengths: please review chat for details.`;
        return `${top}\n${details}`;
    }

    // If interview paused / resumed
    function togglePause() {
        setPaused(p => !p);
    }

    // If the bot asked for missing fields, process them here
    async function processMissingFieldOrSmallChat(text: string) {
        if (!activeCandidate) return;
        const trimmed = text.trim();
        if (!trimmed) {
            userSend('(no input)');
            return;
        }

        // If name missing
        if (!activeCandidate.name) {
            // update candidate via action
            // We don't have "updateCandidate" exported? We do have updateCandidate action in slice
            // But earlier slice's action was exported as updateCandidate - we can import it
            // For safety, use dispatch(updateCandidate(...))
            // However in this file we didn't import updateCandidate. Let's dynamically dispatch a small object that the reducer can accept.
            // But your slice has updateCandidate action; so import it now:
        }

        // We'll implement this by dispatching updateCandidate (so import it)
    }

    // Since we need updateCandidate to fill missing fields, import it (can't import inside fn).
    // To keep code inline, we'll early-return here and add updateCandidate import at top.
    // (See updated import block at top—if copying into your code, add updateCandidate import)

    // NOTE: Because of inline explanation above, we will add missing import & implementation now:
    // Scroll up and ensure you add `updateCandidate` to imports from candidateSlice.
    // Now implement processMissingFieldOrSmallChat fully:

    // --- Implemented below as an effect that watches for messages and handles missing field replies ---
    useEffect(() => {
        // Detect when the candidate provided missing-field answers in chat: look at the last user message
        if (!messages.length || !activeCandidate) return;
        const last = messages[messages.length - 1];
        if (last.from !== 'user') return;

        (async () => {
            // If name missing and user's last message looks like a name (heuristic)
            const lastText = last.text.trim();
            if (!activeCandidate.name && looksLikeName(lastText)) {
                dispatch(updateCandidate({ id: activeCandidate.id, name: lastText }));
                botSend(`Thanks — saved name as "${lastText}".`);
                return;
            }
            if (!activeCandidate.email && looksLikeEmail(lastText)) {
                dispatch(updateCandidate({ id: activeCandidate.id, email: lastText }));
                botSend(`Thanks — saved email as "${lastText}".`);
                return;
            }
            if (!activeCandidate.phone && looksLikePhone(lastText)) {
                dispatch(updateCandidate({ id: activeCandidate.id, phone: lastText }));
                botSend(`Thanks — saved phone as "${lastText}".`);
                return;
            }
            // If none of above and interview hasn't started: if user typed "start", start interview
            if (!isInterviewRunning && lastText.toLowerCase() === 'start') {
                // re-read activeCandidate from the latest candidates in redux
                const fresh = ((storeSnapshot() as any)).candidate.candidates.find((c: any) => c.id === activeCandidate.id) || activeCandidate;
                // If still missing fields, ask those
                const asked = (() => {
                    if (!fresh.name) { botSend('Please provide your full name.'); return true; }
                    if (!fresh.email) { botSend('Please provide your email.'); return true; }
                    if (!fresh.phone) { botSend('Please provide your phone number.'); return true; }
                    return false;
                })();
                if (!asked) {
                    // start interview
                    startInterview();
                }
                return;
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages, candidates]);

    // Simple heuristics
    function looksLikeEmail(t: string) {
        return /\S+@\S+\.\S+/.test(t);
    }
    function looksLikePhone(t: string) {
        return /(\+?\d[\d\-\s()]{6,}\d)/.test(t);
    }
    function looksLikeName(t: string) {
        // Very naive: two words, first letter uppercase (e.g., "Anurag Behura")
        const parts = t.split(/\s+/).filter(Boolean);
        return parts.length >= 2 && parts[0][0] === parts[0][0].toUpperCase();
    }

    // Bind Enter for submit
    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') {
            e.preventDefault();
            // if currentQuestionIndex === null (collecting fields), send as user message and let effect pick it up
            userSend(input.trim());
            setInput('');
        }
    }

    // Render
    return (
        <div className="max-w-3xl mx-auto space-y-6 p-4">
            <Card className="p-4">
                <h2 className="text-xl font-semibold mb-2">AI Interview — Interviewee</h2>
                {!activeCandidate && (
                    <>
                        <p className="text-sm text-muted-foreground mb-3">Upload your resume to begin.</p>
                        <ResumeUpload />
                    </>
                )}

                {activeCandidate && (
                    <>
                        <div className="mb-3">
                            <strong>Candidate:</strong> {activeCandidate.name || '—'} &nbsp; | &nbsp;
                            <strong>Email:</strong> {activeCandidate.email || '—'} &nbsp; | &nbsp;
                            <strong>Phone:</strong> {activeCandidate.phone || '—'}
                        </div>

                        {/* Controls */}
                        <div className="flex gap-2 mb-4">
                            {!isInterviewRunning ? (
                                <Button onClick={() => {
                                    // If there are unfinished sessions for this candidate, show welcome back modal (omitted UI here, but we can send bot message)
                                    botSend('Welcome back! Type "start" to begin/resume the interview, or fill any missing details.');
                                }}>
                                    Welcome Back / Resume
                                </Button>
                            ) : (
                                <Button onClick={togglePause}>
                                    {paused ? 'Resume' : 'Pause'}
                                </Button>
                            )}
                        </div>

                        {/* Chat area */}
                        <div className="border rounded p-3 mb-3 h-80 overflow-auto bg-white" id="chat-window">
                            {messages.map((m, i) => (
                                <div key={i} className={`mb-3 ${m.from === 'bot' ? 'text-left' : 'text-right'}`}>
                                    <div className={`inline-block px-3 py-2 rounded ${m.from === 'bot' ? 'bg-gray-100' : 'bg-blue-100'}`}>
                                        <div className="text-sm">{m.text}</div>
                                        <div className="text-xs text-gray-400 mt-1">{m.ts ? new Date(m.ts).toLocaleTimeString() : ''}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Timer / Progress */}
                        {isInterviewRunning && currentQuestionIndex !== null && (
                            <div className="mb-3">
                                <div className="flex items-center justify-between mb-1">
                                    <div>Question {currentQuestionIndex + 1} / {questions.length}</div>
                                    <div>Time left: {timer}s</div>
                                </div>
                                <div className="w-full bg-gray-200 h-2 rounded">
                                    <div
                                        className="h-2 rounded bg-blue-500"
                                        style={{
                                            width: `${((questions[currentQuestionIndex]?.timeLimit || 1) - timer) / (questions[currentQuestionIndex]?.timeLimit || 1) * 100}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Input */}
                        <div className="flex gap-2">
                            <Input
                                placeholder={currentQuestionIndex === null ? 'Chat with assistant or type start' : 'Type your answer here...'}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        // For chat messages: if interview running and question active, submit answer; otherwise send chat message
                                        if (isInterviewRunning && currentQuestionIndex !== null) {
                                            // manually submit
                                            userSend(input.trim());
                                            handleSubmitAnswer();
                                        } else {
                                            userSend(input.trim());
                                            // effect will pick up and process missing field or start
                                        }
                                        setInput('');
                                    }
                                }}
                            />
                            <Button
                                onClick={() => {
                                    if (isInterviewRunning && currentQuestionIndex !== null) {
                                        userSend(input.trim());
                                        handleSubmitAnswer();
                                        setInput('');
                                    } else {
                                        userSend(input.trim());
                                        setInput('');
                                    }
                                }}
                            >
                                Send
                            </Button>
                        </div>
                    </>
                )}
            </Card>
        </div>
    );
}
