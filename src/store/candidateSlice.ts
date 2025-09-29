import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from 'uuid';

export type Question = {
    id: string;
    text: string;
    difficulty: "easy" | "medium" | "hard";
    timeLimit: number; // in seconds
};

export type Answer = {
    questionId: string;
    question: string;
    answer: string;
    difficulty: 'easy' | 'medium' | 'hard';
    score: number;
    timeSpent: number;
    feedback?: string;
};

export type ChatMessage = {
    from: 'bot' | 'user' | 'system' | 'interviewer';
    text: string;
    ts: number;
};

export type Candidate = {
    id: string;
    name: string;
    email: string;
    phone: string;
    resumeText: string;
    currentQuestion: number;
    answers: Answer[];
    questions: Question[];
    totalScore: number;
    status: 'incomplete' | 'paused' | 'completed';
    startedAt: number;
    completedAt: number | null;
    summary?: string;
    chat: ChatMessage[];
};

type CandidateState = {
    candidates: Candidate[]; // Array of all candidates
    activeCandidate: string | null; // ID of currently active candidate
};

const initialState: CandidateState = {
    candidates: [],
    activeCandidate: null,
};

const candidateSlice = createSlice({
    name: "candidate",
    initialState,
    reducers: {
        // Create a new candidate session
        createCandidate(state, action: PayloadAction<{ name?: string; email?: string; phone?: string; resumeText?: string }>) {
            const newCandidate: Candidate = {
                id: uuidv4(),
                name: action.payload.name || "",
                email: action.payload.email || "",
                phone: action.payload.phone || "",
                resumeText: action.payload.resumeText || "",
                questions: [],
                answers: [],
                currentQuestion: 0,
                totalScore: 0,
                status: "incomplete",
                startedAt: Date.now(),
                completedAt: null,
                summary: undefined,
                chat: [],
            };
            state.candidates.push(newCandidate);
            state.activeCandidate = newCandidate.id;
        },

        // Update candidate details (name, email, phone)
        updateCandidate(state, action: PayloadAction<{ id: string } & Partial<Candidate>>) {
            const candidate = state.candidates.find(c => c.id === action.payload.id);
            if (candidate) {
                Object.assign(candidate, action.payload);
            }
        },

        setActiveCandidate(state, action: PayloadAction<string | null>) {
            state.activeCandidate = action.payload;
        },

        addQuestion(state, action: PayloadAction<Question>) {
            const candidate = state.candidates.find(c => c.id === state.activeCandidate);
            if (candidate) {
                candidate.questions.push(action.payload);
            }
        },

        submitAnswer(state, action: PayloadAction<Answer>) {
            const candidate = state.candidates.find(c => c.id === state.activeCandidate);
            if (candidate) {
                candidate.answers.push(action.payload);
                candidate.currentQuestion += 1;
                candidate.totalScore = (candidate.totalScore || 0) + (action.payload.score || 0);
            }
        },

        updateStatus(state, action: PayloadAction<{ id: string; status: Candidate['status'] }>) {
            const candidate = state.candidates.find(c => c.id === action.payload.id);
            if (candidate) {
                candidate.status = action.payload.status;
                if (action.payload.status === 'completed') {
                    candidate.completedAt = Date.now();
                }
            }
        },

        setSummary(state, action: PayloadAction<{ id: string; summary: string }>) {
            const candidate = state.candidates.find(c => c.id === action.payload.id);
            if (candidate) {
                candidate.summary = action.payload.summary;
            }
        },

        addChatMessage(state, action: PayloadAction<{ id: string; message: ChatMessage }>) {
            const candidate = state.candidates.find(c => c.id === action.payload.id);
            if (candidate) {
                candidate.chat.push(action.payload.message);
            }
        },

        clearActiveCandidate(state) {
            state.activeCandidate = null;
        },

        resetAll() {
            return initialState;
        },
    },
});

export const {
    createCandidate,
    updateCandidate,
    setActiveCandidate,
    addQuestion,
    submitAnswer,
    updateStatus,
    setSummary,
    addChatMessage,
    clearActiveCandidate,
    resetAll,
} = candidateSlice.actions;

export default candidateSlice.reducer;