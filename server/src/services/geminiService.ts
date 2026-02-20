import { GoogleGenAI } from '@google/genai';

/**
 * Shared Gemini AI helper — sends a prompt and returns plain text.
 * Uses gemini-1.5-flash with retry logic for reliability.
 */
export async function askGemini(prompt: string, retries = 3): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured');
    }

    let lastError: any;
    for (let i = 0; i < retries; i++) {
        try {
            const ai = new GoogleGenAI({ apiKey });
            console.log(`📡 Calling Gemini (gemini-1.5-flash) [Attempt ${i + 1}/${retries}]...`);

            const response = await ai.models.generateContent({
                model: 'gemini-1.5-flash',
                contents: prompt,
            });

            const text = response.text?.trim();
            if (!text) {
                throw new Error('Empty response from Gemini AI');
            }

            console.log(`✅ Gemini replied, length: ${text.length}`);
            return text;
        } catch (error: any) {
            lastError = error;
            console.error(`❌ Gemini error (Attempt ${i + 1}):`, error.status || '', error.message);

            // Retry on rate limits (429) or transient server errors (500, 503)
            if ((error.status === 429 || error.status >= 500) && i < retries - 1) {
                const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
                console.log(`⏳ Transient error. Retrying in ${Math.round(delay)}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            throw error;
        }
    }
    throw lastError;
}




