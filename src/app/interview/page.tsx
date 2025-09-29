'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import IntervieweTab from '@/components/InterviewTab';
import InterviewerTab from '@/components/InterviewerTab';

export default function InterviewPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold">Interview Prep AI</h2>
                    <p className="text-gray-600">AI-Powered Interview Assistant</p>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="interviewee" className="w-full">
                    <TabsList className="grid w-full max-w-md grid-cols-2">
                        <TabsTrigger value="interviewee">
                            Interviewee (Chat)
                        </TabsTrigger>
                        <TabsTrigger value="interviewer">
                            Interviewer (Dashboard)
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="interviewee" className="mt-6">
                        <IntervieweTab />
                    </TabsContent>

                    <TabsContent value="interviewer" className="mt-6">
                        <InterviewerTab />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}