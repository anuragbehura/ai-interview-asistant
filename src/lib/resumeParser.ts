// src/lib/parseResume.ts
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { parsePhoneNumberFromString } from "libphonenumber-js";

export async function parseResume(fileBuffer: Buffer, fileType: string) {
    let text = "";

    // Extract raw text from PDF/DOCX
    if (fileType === "application/pdf") {
        const data = await pdfParse(fileBuffer);
        text = data.text;
    } else if (
        fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        fileType === "application/msword"
    ) {
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        text = result.value;
    } else {
        throw new Error("Unsupported file type");
    }

    // Clean & normalize text
    text = text
        .replace(/\r/g, "")
        .replace(/\n{2,}/g, "\n")
        .trim();

    // Extract emails using regex
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = text.match(emailRegex) || [];
    const email = emails[0] || "";

    // Extract phone numbers using libphonenumber-js
    const phoneRegex = /(\+?\d[\d \-\(\)]{8,}\d)/g;
    const phoneMatches = text.match(phoneRegex) || [];
    let phone = "";

    for (const candidate of phoneMatches) {
        const parsed = parsePhoneNumberFromString(candidate, "IN"); // Default region: India
        if (parsed?.isValid()) {
            phone = parsed.formatInternational();
            break;
        }
    }

    // Extract Name intelligently
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    let name = lines[0]; // fallback: first line

    // Optional: try simple job title detection to skip
    const jobTitles = ["engineer", "developer", "designer", "manager", "resume"];
    if (jobTitles.some((jt) => name.toLowerCase().includes(jt))) {
        name = lines[1] || name; // pick next line if first is job title
    }

    // (Optional Advanced) Use NLP to detect PERSON entity
    // const manager = new NlpManager({ languages: ["en"] });
    // const result = await manager.process("en", lines.slice(0, 5).join(" "));
    // const personEntity = result.entities.find((e) => e.entity === "person");
    // if (personEntity) name = personEntity.sourceText;

    // Section-wise parsing (Education, Experience, Skills)
    const sectionExtractor = (keyword: string) => {
        const regex = new RegExp(`${keyword}[\\s\\S]*?(?=\\n[A-Z][a-z]+:|$)`, "i");
        return text.match(regex)?.[0] || "";
    };

    const education = sectionExtractor("Education");
    const experience = sectionExtractor("Experience");
    const skills = sectionExtractor("Skills");

    return {
        name,
        email,
        phone,
        sections: {
            education,
            experience,
            skills,
        },
        allEmails: emails,
        rawText: text,
    };
}
