import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type Question = {
    id: string;
    text: string;
    difficulty: "easy" | "medium" | "hard";
    answer?: string;
    score?: number;
};

type CandidateState = {
    id: string;
    name: string;
    email: string;
    phone: string;
    questions: Question[];
    status: "idle" | "in-progress" | "completed";
    finalScore?: number;
    summary?: string;
};

const initialState: CandidateState = {
    id: "",
    name: "",
    email: "",
    phone: "",
    questions: [],
    status: "idle",
};

const candidateSlice = createSlice({
    name: "candidate",
    initialState,
    reducers: {
        setCandidate(state, action: PayloadAction<Partial<CandidateState>>) {
            return { ...state, ...action.payload };
        },
        addQuestion(state, action: PayloadAction<Question>) {
            state.questions.push(action.payload);
        },
        answerQuestion(
            state,
            action: PayloadAction<{ id: string; answer: string; score?: number }>
        ) {
            const q = state.questions.find((x) => x.id === action.payload.id);
            if (q) {
                q.answer = action.payload.answer;
                if (action.payload.score !== undefined) q.score = action.payload.score;
            }
        },
        resetCandidate() {
            return initialState;
        },
    },
});

export const { setCandidate, addQuestion, answerQuestion, resetCandidate } =
    candidateSlice.actions;
export default candidateSlice.reducer;
