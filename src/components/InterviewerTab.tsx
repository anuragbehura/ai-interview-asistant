'use client';

import React, { useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '@/store';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Candidate, Answer } from '@/store/candidateSlice';
import { setActiveCandidate, updateStatus } from '@/store/candidateSlice';

export default function InterviewerDashboard() {
    const dispatch = useDispatch();
    const candidates = useSelector((state: RootState) => state?.candidate?.candidates ?? []);
    const [q, setQ] = useState('');
    const [sortBy, setSortBy] = useState<'score' | 'date' | 'name'>('score');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const filtered = useMemo(() => {
        const lower = q.trim().toLowerCase();
        return candidates
            .filter(c => {
                if (!lower) return true;
                return (
                    c.name.toLowerCase().includes(lower) ||
                    c.email.toLowerCase().includes(lower) ||
                    (c.summary || '').toLowerCase().includes(lower)
                );
            })
            .sort((a, b) => {
                if (sortBy === 'score') return (b.totalScore || 0) - (a.totalScore || 0);
                if (sortBy === 'date') return (b.startedAt || 0) - (a.startedAt || 0);
                return a.name.localeCompare(b.name);
            });
    }, [candidates, q, sortBy]);

    const selectCandidate = (id: string) => {
        setSelectedId(id);
        dispatch(setActiveCandidate(id));
    };

    const selected = candidates.find(c => c.id === selectedId) || null;

    return (
        <div className="p-4 grid grid-cols-3 gap-4">
            {/* List */}
            <div className="col-span-1">
                <Card className="p-4 mb-4">
                    <h3 className="font-semibold mb-2">Candidates</h3>
                    <div className="flex gap-2 mb-3">
                        <Input placeholder="Search by name / email / summary" value={q} onChange={(e) => setQ(e.target.value)} />
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="border rounded px-2">
                            <option value="score">Sort: Score</option>
                            <option value="date">Sort: Date</option>
                            <option value="name">Sort: Name</option>
                        </select>
                    </div>

                    <div className="space-y-2 max-h-[60vh] overflow-auto">
                        {filtered.map(c => (
                            <div key={c.id} className={`p-2 rounded border cursor-pointer ${selectedId === c.id ? 'bg-gray-100' : ''}`} onClick={() => selectCandidate(c.id)}>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="font-medium">{c.name || '—'}</div>
                                        <div className="text-xs text-gray-500">{c.email || '—'}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-semibold">{Math.round((c.totalScore || 0) / (c.answers.length || 1)) || c.totalScore || 0}</div>
                                        <div className="text-xs text-gray-400">{c.status}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filtered.length === 0 && <div className="text-sm text-gray-500">No candidates found</div>}
                    </div>
                </Card>
            </div>

            {/* Detail */}
            <div className="col-span-2">
                {!selected && (
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold">Select a candidate to view details</h3>
                    </Card>
                )}

                {selected && (
                    <>
                        <Card className="p-4 mb-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-semibold">{selected.name || '—'}</h3>
                                    <div className="text-sm text-gray-600">{selected.email} • {selected.phone}</div>
                                    <div className="text-sm text-gray-500 mt-2">Status: <strong>{selected.status}</strong></div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold">{selected.totalScore || 0}</div>
                                    <div className="text-xs text-gray-500">Raw score (sum)</div>
                                </div>
                            </div>

                            <div className="mt-4">
                                <h4 className="font-medium">Summary</h4>
                                <p className="text-sm text-gray-700 mt-1">{selected.summary || 'No summary yet.'}</p>
                            </div>
                        </Card>

                        {/* Chat */}
                        <Card className="p-4 mb-4">
                            <h4 className="font-medium mb-3">Chat & Interview Transcript</h4>
                            <div className="max-h-[40vh] overflow-auto space-y-3">
                                {selected.chat.map((m, idx) => (
                                    <div key={idx} className={`${m.from === 'bot' ? 'text-left' : 'text-right'}`}>
                                        <div className={`inline-block px-3 py-2 rounded ${m.from === 'bot' ? 'bg-gray-100' : 'bg-blue-50'}`}>
                                            <div className="text-sm">{m.text}</div>
                                            <div className="text-xs text-gray-400 mt-1">{new Date(m.ts).toLocaleString()}</div>
                                        </div>
                                    </div>
                                ))}
                                {selected.chat.length === 0 && <div className="text-sm text-gray-500">No chat yet</div>}
                            </div>
                        </Card>

                        {/* Answers */}
                        <Card className="p-4">
                            <h4 className="font-medium mb-2">Answers & Scores</h4>
                            <div className="space-y-3">
                                {selected.answers.length === 0 && <div className="text-sm text-gray-500">No answers submitted yet</div>}
                                {selected.answers.map((a: Answer) => (
                                    <div key={a.questionId} className="border rounded p-3">
                                        <div className="font-medium mb-1">{a.question}</div>
                                        <div className="text-sm mb-2">{a.answer || <i>No answer</i>}</div>
                                        <div className="text-xs text-gray-600">Score: {a.score} • Time: {a.timeSpent}s</div>
                                        {a.feedback && <div className="text-sm text-gray-700 mt-2">Feedback: {a.feedback}</div>}
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 flex gap-2">
                                <Button onClick={() => dispatch(updateStatus({ id: selected.id, status: 'completed' }))}>Mark Completed</Button>
                                <Button onClick={() => dispatch(setActiveCandidate(selected.id))}>Open in Interviewee View</Button>
                            </div>
                        </Card>
                    </>
                )}
            </div>
        </div>
    );
}
