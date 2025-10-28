// AI Advisor service using OpenAI GPT API
import { BEFASTAnswers, FaceAnalysisResult, SpeechAnalysisResult, AIRiskScore } from '@/types';

interface AnalysisData {
  befastAnswers: BEFASTAnswers;
  faceAnalysis: FaceAnalysisResult | null;
  speechAnalysis: SpeechAnalysisResult | null;
}

class AIAdvisorService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';
  }

  async analyzeRisk(data: AnalysisData): Promise<AIRiskScore> {
    if (!this.apiKey) {
      console.warn('OpenAI API key not found, using local calculation');
      return this.calculateLocally(data);
    }

    try {
      const prompt = this.createPrompt(data);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a medical AI assistant analyzing stroke risk. Respond with a JSON object containing: {"score": number (0-100), "level": "LOW|MEDIUM|HIGH", "factors": [array of strings], "timestamp": number}'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 300,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const result = await response.json();
      const content = result.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const aiResult = JSON.parse(content);
      
      return {
        score: Math.min(Math.max(aiResult.score || 0, 0), 100),
        level: aiResult.level || 'LOW',
        factors: aiResult.factors || [],
        timestamp: Date.now(),
      };

    } catch (error) {
      console.error('OpenAI analysis failed:', error);
      return this.calculateLocally(data);
    }
  }

  private createPrompt(data: AnalysisData): string {
    const befastAnswers = Object.entries(data.befastAnswers)
      .map(([key, value]) => `${key}: ${value === null ? 'Not assessed' : value ? 'YES' : 'NO'}`)
      .join('\n');

    const faceInfo = data.faceAnalysis 
      ? `Facial asymmetry: ${data.faceAnalysis.asymmetry.toFixed(1)}%, Confidence: ${(data.faceAnalysis.confidence * 100).toFixed(1)}%`
      : 'No facial analysis available';

    const speechInfo = data.speechAnalysis
      ? `Speech analysis: ${data.speechAnalysis.isSlurred ? 'Slurred speech detected' : 'Normal speech'}, Confidence: ${(data.speechAnalysis.confidence * 100).toFixed(1)}%, Transcription: "${data.speechAnalysis.transcription}"`
      : 'No speech analysis available';

    return `Analyze this stroke risk assessment data:

BEFAST Assessment:
${befastAnswers}

Face Analysis:
${faceInfo}

Speech Analysis:
${speechInfo}

Provide a stroke risk score (0-100) based on:
- BEFAST symptoms (YES answers increase risk)
- Facial asymmetry (higher percentage increases risk)
- Speech analysis (slurred speech increases risk)
- Overall pattern of symptoms

Consider that this is for emergency medical assessment.`;
  }

  private calculateLocally(data: AnalysisData): AIRiskScore {
    let score = 0;
    const factors: string[] = [];

    // BEFAST scoring
    const befastAnswers = Object.values(data.befastAnswers);
    const positiveBEFAST = befastAnswers.filter(answer => answer === true).length;
    
    if (positiveBEFAST > 0) {
      score += positiveBEFAST * 20; // 20 points per positive BEFAST symptom
      factors.push(`${positiveBEFAST} positive BEFAST symptom(s) detected`);
    }

    // Face analysis scoring
    if (data.faceAnalysis) {
      const asymmetry = data.faceAnalysis.asymmetry;
      if (asymmetry > 30) {
        score += 30;
        factors.push(`High facial asymmetry (${asymmetry.toFixed(1)}%)`);
      } else if (asymmetry > 15) {
        score += 15;
        factors.push(`Moderate facial asymmetry (${asymmetry.toFixed(1)}%)`);
      }
    }

    // Speech analysis scoring
    if (data.speechAnalysis) {
      if (data.speechAnalysis.isSlurred) {
        score += 25;
        factors.push('Slurred speech detected');
      }
      if (data.speechAnalysis.confidence < 0.7) {
        score += 10;
        factors.push('Low speech recognition confidence');
      }
    }

    // Determine risk level
    let level: 'LOW' | 'MEDIUM' | 'HIGH';
    if (score >= 70) {
      level = 'HIGH';
    } else if (score >= 40) {
      level = 'MEDIUM';
    } else {
      level = 'LOW';
    }

    return {
      score: Math.min(score, 100),
      level,
      factors,
      timestamp: Date.now(),
    };
  }

  // Simulate AI analysis for demo purposes
  async simulateAIAnalysis(data: AnalysisData): Promise<AIRiskScore> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.calculateLocally(data));
      }, 2000);
    });
  }
}

export const aiAdvisorService = new AIAdvisorService();
