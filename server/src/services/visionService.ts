import { GoogleGenAI } from '@google/genai';

/**
 * Analyzes a prescription image and extracts the medication name.
 * @param base64Image Base64 encoded image string (with or without data URI prefix)
 * @returns The extracted medication name or a fallback message
 */
export async function analyzePrescription(base64Image: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured');
    }

    try {
        const ai = new GoogleGenAI({ apiKey });

        // Strip data URI prefix if present
        const data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

        console.log('📡 Calling Gemini Vision (gemini-2.0-flash) to analyze prescription...');

        const prompt = "You are a medical assistant OCR tool. Extract ONLY the primary medication name from this prescription image. Respond with ONLY the medication name. If multiple, pick the most prominent one. If none found, respond with 'Unknown'.";

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                mimeType: 'image/jpeg', // Defaulting to jpeg, Gemini handles it well
                                data: data
                            }
                        }
                    ]
                }
            ]
        });

        const text = response.text?.trim() || 'Unknown';
        console.log(`✅ Gemini Vision extracted: ${text}`);

        return text === 'Unknown' ? '' : text;
    } catch (error: any) {
        console.error('❌ Gemini Vision error:', error.message);
        throw error;
    }
}
