import { GoogleGenAI } from '@google/genai';

/**
 * Shared Gemini AI helper — sends a prompt and returns plain text.
 * Uses gemini-2.5-flash (latest available model with free-tier quota).
 */
export async function askGemini(prompt: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured');
    }

    try {
        const ai = new GoogleGenAI({ apiKey });

        console.log('📡 Calling Gemini (gemini-2.5-flash)...');
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const text = response.text?.trim();
        if (!text) {
            throw new Error('Empty response from Gemini AI');
        }

        console.log(`✅ Gemini replied, length: ${text.length}`);
        return text;
    } catch (error: any) {
        console.error('❌ Gemini error:', error.status || '', error.message);
        throw error;
    }
}




