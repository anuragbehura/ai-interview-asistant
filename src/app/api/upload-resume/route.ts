import { NextResponse } from "next/server";
import { parseResume } from "@/lib/resumeParser";

type ParsedResumeResponse = {
    success: boolean;
    data?: Awaited<ReturnType<typeof parseResume>>;
    error?: string;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: Request): Promise<NextResponse<ParsedResumeResponse>> {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
        }

        // File type validation
        const allowedTypes = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/msword",
        ];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { success: false, error: "Only PDF and DOCX files are supported" },
                { status: 400 }
            );
        }

        // File size validation
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { success: false, error: "File too large. Max allowed size is 5MB" },
                { status: 400 }
            );
        }

        // Convert to Buffer safely
        const buffer = Buffer.from(await file.arrayBuffer());
        const parsedData = await parseResume(buffer, file.type);

        return NextResponse.json({ success: true, data: parsedData }, { status: 200 });
    } catch (error: any) {
        console.error("Resume parsing failed:", error); // server-side logging
        return NextResponse.json(
            { success: false, error: error.message || "Failed to parse resume" },
            { status: 500 }
        );
    }
}
