import { NextResponse } from "next/server";
import { parseResume } from "@/lib/resumeParser";


export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { error: "No file uploaded" },
                { status: 400 }
            );
        }

        // Validate file type
        if (
            file.type !== "application/pdf" &&
            file.type !== "application/vnd.openxmlformats-officedocument.wordprocessingml.document" &&
            file.type !== "application/msword"
        ) {
            return NextResponse.json(
                { error: "Only PDF and DOCX files are supported" },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const parsedData = await parseResume(buffer, file.type);

        return NextResponse.json(
            { success: true, data: parsedData },
            { status: 200 }
        );
    } catch (error:any) {
        return NextResponse.json(
            { error: error.message || "Failed to parse resume" },
            { status: 500 }
        );
    }
}



