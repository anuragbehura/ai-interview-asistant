'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, X, Loader2, CheckCircle } from 'lucide-react';
import { createCandidate } from '@/store/candidateSlice';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDispatch } from 'react-redux';

interface ParsedResume {
    name: string;
    email: string;
    phone: string;
    sections: {
        education: string;
        experience: string;
        skills: string;
    };
    rawText: string;
}

export default function ResumeUpload() {
    const dispatch = useDispatch();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string>('');
    const [parsedData, setParsedData] = useState<ParsedResume | null>(null);

    // --- File Handling ---
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => setIsDragging(false);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        validateAndSetFile(droppedFile);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) validateAndSetFile(selectedFile);
    };

    const validateAndSetFile = (file: File) => {
        setError('');
        const validTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        if (!validTypes.includes(file.type)) {
            setError('Please upload a PDF or DOCX file');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError('File size must be less than 5MB');
            return;
        }
        setFile(file);
    };

    // --- API Call to Parse Resume ---
    const handleProcessResume = async () => {
        if (!file) return;
        setIsProcessing(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/parse-resume', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Failed to parse resume');

            const data: ParsedResume = await response.json();
            setParsedData(data);

            // ✅ Create candidate in Redux store
            dispatch(createCandidate({
                name: data.name,
                email: data.email,
                phone: data.phone,
                resumeText: data.rawText,
            }));

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to process resume');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRemoveFile = () => {
        setFile(null);
        setParsedData(null);
        setError('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="space-y-6">
            {/* Upload Area */}
            <Card
                className={`p-8 border-2 border-dashed transition-colors ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                        <Upload className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Upload Your Resume</h3>
                    <p className="text-gray-600 mb-4">
                        Drag and drop your resume here, or click to browse
                    </p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.docx"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                        disabled={isProcessing}
                    >
                        Choose File
                    </Button>
                    <p className="text-sm text-gray-500 mt-4">
                        Supported formats: PDF, DOCX (Max 5MB)
                    </p>
                </div>
            </Card>

            {/* Error Alert */}
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Selected File */}
            {file && (
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="font-medium">{file.name}</p>
                                <p className="text-sm text-gray-500">
                                    {(file.size / 1024).toFixed(2)} KB
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveFile}
                            disabled={isProcessing}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Process Button */}
                    <div className="mt-4 pt-4 border-t">
                        <Button
                            onClick={handleProcessResume}
                            disabled={isProcessing}
                            className="w-full"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Processing Resume...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Process Resume & Start Interview
                                </>
                            )}
                        </Button>
                    </div>
                </Card>
            )}

            {/* Parsed Data Preview */}
            {parsedData && !isProcessing && (
                <Card className="p-4 bg-green-50 border-green-200">
                    <h4 className="font-semibold text-green-900 mb-3">
                        Information Extracted
                    </h4>
                    <div className="space-y-2 text-sm">
                        <div><span className="text-gray-600">Name:</span> <span className="font-medium">{parsedData.name || '❌ Not found'}</span></div>
                        <div><span className="text-gray-600">Email:</span> <span className="font-medium">{parsedData.email || '❌ Not found'}</span></div>
                        <div><span className="text-gray-600">Phone:</span> <span className="font-medium">{parsedData.phone || '❌ Not found'}</span></div>
                        {parsedData.sections.education && (
                            <div><span className="text-gray-600">Education:</span> <span>{parsedData.sections.education}</span></div>
                        )}
                        {parsedData.sections.experience && (
                            <div><span className="text-gray-600">Experience:</span> <span>{parsedData.sections.experience}</span></div>
                        )}
                        {parsedData.sections.skills && (
                            <div><span className="text-gray-600">Skills:</span> <span>{parsedData.sections.skills}</span></div>
                        )}
                    </div>
                    <p className="text-xs text-green-700 mt-3">
                        ✓ Missing fields will be collected during the interview process
                    </p>
                </Card>
            )}
        </div>
    );
}
