import { GoogleGenAI } from '@google/genai';
import { IRiskProfile } from '../models/User';
import { findKnownInteraction } from './knowledgeBase';

export interface AnalysisResult {
    medication: string;
    food: string;
    riskLevel: 'mild' | 'moderate' | 'severe';
    explanation: string;
    clinicalImpact: string;
    example: string;
    recommendations: string[];
    alternatives: string[];
    timing: string;
    confidence: number;
    source: string;
}

/**
 * Analyze food-drug interaction using Google Gemini AI.
 * Falls back to comprehensive knowledge base if Gemini is unavailable.
 */
export async function analyzeInteraction(
    medication: string,
    food: string,
    riskProfile: IRiskProfile | null
): Promise<AnalysisResult> {
    // Try Gemini AI first
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
        try {
            const result = await analyzeWithGemini(medication, food, riskProfile, geminiKey);
            return result;
        } catch (error) {
            console.warn('⚠️ Gemini AI failed, falling back to knowledge base:', (error as Error).message);
        }
    }

    // Fallback to knowledge base
    return analyzeWithKnowledgeBase(medication, food, riskProfile);
}

/**
 * Gemini AI-powered analysis
 */
async function analyzeWithGemini(
    medication: string,
    food: string,
    riskProfile: IRiskProfile | null,
    apiKey: string
): Promise<AnalysisResult> {
    const ai = new GoogleGenAI({ apiKey });

    const profileContext = riskProfile
        ? `\nPatient Profile:\n- Age group: ${riskProfile.age}\n- Medical conditions: ${riskProfile.conditions.length > 0 ? riskProfile.conditions.join(', ') : 'None reported'}\n- Known allergies: ${riskProfile.allergies.length > 0 ? riskProfile.allergies.join(', ') : 'None reported'}`
        : '\nNo patient profile available — provide general population analysis.';

    const prompt = `You are a clinical pharmacologist AI assistant. Analyze the potential interaction between a medication and a food item.

MEDICATION: ${medication}
FOOD: ${food}
${profileContext}

Provide a detailed, evidence-based analysis. You MUST respond with ONLY a valid JSON object (no markdown, no code blocks, no extra text) with exactly these fields:

{
  "riskLevel": "mild" | "moderate" | "severe",
  "explanation": "Clear explanation of the interaction mechanism in plain language. If no significant interaction exists, state that clearly.",
  "clinicalImpact": "Specific clinical consequences. Include percentages or measurable impacts when known (e.g., 'reduces absorption by 30-40%'). If no interaction, explain why the combination is safe.",
  "example": "A relatable real-world analogy or scenario illustrating the impact",
  "recommendations": ["3-5 specific, actionable recommendations for the patient"],
  "alternatives": ["2-4 safe food alternatives the patient can use instead"],
  "timing": "Specific timing advice (e.g., 'Space by 2-4 hours' or 'No restrictions needed')",
  "confidence": A number 70-99 representing your confidence level based on evidence strength
}

IMPORTANT RULES:
- Be medically accurate — do not fabricate interactions where none exist
- If the food and drug have NO known interaction, set riskLevel to "mild" and explain that the combination is generally safe
- Consider the patient's profile (age, conditions) when assessing severity
- For elderly patients (65+), be more conservative with risk assessment
- Include specific drug mechanism details (e.g., CYP enzyme involvement, chelation, pH effects)
- Confidence should be 90+ for well-documented interactions, 70-85 for less studied combinations`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
    });

    const text = response.text?.trim() || '';

    // Parse the JSON response — handle potential markdown wrapping
    let jsonText = text;
    if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(jsonText);

    // Validate and normalize the response
    const validRiskLevels = ['mild', 'moderate', 'severe'];
    const riskLevel = validRiskLevels.includes(parsed.riskLevel) ? parsed.riskLevel : 'moderate';

    // Adjust for elderly patients
    let finalRiskLevel = riskLevel;
    if (riskProfile?.age === '65+' && riskLevel === 'moderate') {
        finalRiskLevel = 'severe';
    }

    return {
        medication,
        food,
        riskLevel: finalRiskLevel,
        explanation: parsed.explanation || 'Analysis completed.',
        clinicalImpact: parsed.clinicalImpact || 'Consult your healthcare provider for details.',
        example: parsed.example || '',
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : ['Consult your healthcare provider'],
        alternatives: Array.isArray(parsed.alternatives) ? parsed.alternatives : ['Discuss with your pharmacist'],
        timing: parsed.timing || 'Consult your pharmacist for timing advice',
        confidence: typeof parsed.confidence === 'number' ? Math.min(99, Math.max(70, parsed.confidence)) : 85,
        source: 'gemini-ai-v1',
    };
}

/**
 * Knowledge base fallback analysis
 */
function analyzeWithKnowledgeBase(
    medication: string,
    food: string,
    riskProfile: IRiskProfile | null
): AnalysisResult {
    const known = findKnownInteraction(medication, food);

    if (known) {
        let riskLevel = known.riskLevel;

        // Adjust for elderly patients
        if (riskProfile?.age === '65+' && riskLevel === 'moderate') {
            riskLevel = 'severe';
        }

        // Higher confidence for known interactions
        let confidence = known.evidenceLevel === 'high' ? 95 : known.evidenceLevel === 'moderate' ? 85 : 75;
        if (riskProfile && riskProfile.conditions.length > 2) {
            confidence = Math.min(99, confidence + 3);
        }

        return {
            medication,
            food,
            riskLevel,
            explanation: known.mechanism,
            clinicalImpact: known.clinicalImpact,
            example: `This is a clinically documented interaction between ${known.drugClass} medications and ${food}.`,
            recommendations: known.recommendations,
            alternatives: known.alternatives,
            timing: known.timing,
            confidence,
            source: 'knowledge-base-v1',
        };
    }

    // No known interaction — return safe assessment
    let baseMildConfidence = 75;
    if (riskProfile && riskProfile.conditions.length > 0) {
        baseMildConfidence = 70;
    }

    return {
        medication,
        food,
        riskLevel: 'mild',
        explanation: `No significant interaction has been documented between ${medication} and ${food} in our clinical database. This combination is generally considered safe for most patients.`,
        clinicalImpact: 'No clinically significant impact expected. Standard medication efficacy should be maintained.',
        example: 'This is similar to taking most medications with common foods — no special precautions are typically needed.',
        recommendations: [
            'Continue your normal medication schedule',
            'Take medication as prescribed by your doctor',
            'Monitor for any unusual symptoms and report to healthcare provider',
            'Stay hydrated and maintain a balanced diet',
        ],
        alternatives: [
            'No dietary restrictions needed for this combination',
            'Continue enjoying this food as part of a balanced diet',
        ],
        timing: 'No specific timing restrictions required',
        confidence: baseMildConfidence,
        source: 'knowledge-base-v1',
    };
}
