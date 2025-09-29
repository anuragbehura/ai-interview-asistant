'use client';

import { useSelector } from 'react-redux';
import { RootState } from "@/store/index";
import ResumeUpload from './ResumeUpload';
import ChatInterface from './ChatInterface';
import { Card } from '@/components/ui/card';

export default function InterviewTab() {
    const activeCandidate = useSelector((state: RootState) => state.candidate.activeCandidate);
    const candidate = useSelector((state: RootState) =>
        state?.candidate?.candidates?.find((c) => c.id === activeCandidate)
    );

    // Show resume upload if no active candidate
    if (!candidate) {
        return (
            <Card className="p-8">
                <div className="max-w-2xl mx-auto">
                    <h3 className="text-xl font-semibold mb-4">Upload Your Resume</h3>
                    <p className="text-gray-600 mb-6">
                        Start by uploading your resume. We'll extract your information and begin the interview.
                    </p>
                    <ResumeUpload />
                </div>
            </Card>
        );
    }

    // Show chat interface if candidate exists
    return (
        <Card className="p-6 h-[calc(100vh-250px)]">
            <ChatInterface />
        </Card>
    );
}