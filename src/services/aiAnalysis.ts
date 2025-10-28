// AI-powered analysis service using OpenAI
import OpenAI from 'openai';

export interface AIAnalysisResult {
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  confidence: number;
  recommendations: string[];
  emergencyAction: boolean;
  analysis: string;
  timestamp: number;
}

class AIAnalysisService {
  private openai: OpenAI | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        console.log('OpenAI API key not found, using fallback analysis');
        this.isInitialized = true;
        return;
      }

      this.openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true // Note: In production, this should be server-side
      });

      this.isInitialized = true;
      console.log('OpenAI service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OpenAI:', error);
      this.isInitialized = true;
    }
  }

  async analyzeBEFASTResults(befastAnswers: Record<string, boolean>, analysisResults: any): Promise<AIAnalysisResult> {
    await this.initialize();

    if (!this.openai) {
      return this.fallbackAnalysis(befastAnswers, analysisResults);
    }

    try {
      const positiveAnswers = Object.entries(befastAnswers)
        .filter(([_, answer]) => answer === true)
        .map(([key, _]) => key);

      const prompt = `
You are a medical AI assistant specializing in stroke assessment. Analyze the following BEFAST assessment results:

BEFAST Answers:
- Balance (B): ${befastAnswers.balance ? 'YES' : 'NO'}
- Eyes (E): ${befastAnswers.eyes ? 'YES' : 'NO'}
- Face (F): ${befastAnswers.face ? 'YES' : 'NO'}
- Arms (A): ${befastAnswers.arms ? 'YES' : 'NO'}
- Speech (S): ${befastAnswers.speech ? 'YES' : 'NO'}
- Time (T): ${befastAnswers.time ? 'YES' : 'NO'}

AI Analysis Results:
${analysisResults.face ? `Face Analysis: Asymmetry ${analysisResults.face.asymmetry}, Confidence ${analysisResults.face.confidence}` : 'No face analysis'}
${analysisResults.speech ? `Speech Analysis: ${analysisResults.speech.isSlurred ? 'SLURRED' : 'NORMAL'}, Confidence ${analysisResults.speech.confidence}` : 'No speech analysis'}

Provide a comprehensive analysis with:
1. Risk Level: LOW, MODERATE, HIGH, or CRITICAL
2. Confidence score (0-1)
3. Specific recommendations
4. Whether emergency action is needed
5. Detailed analysis explanation

Respond in JSON format:
{
  "riskLevel": "CRITICAL",
  "confidence": 0.95,
  "recommendations": ["Call 108 immediately", "Do not drive yourself"],
  "emergencyAction": true,
  "analysis": "Detailed explanation..."
}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a medical AI assistant. Always prioritize patient safety and recommend immediate medical attention for stroke symptoms.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        try {
          const result = JSON.parse(content);
          return {
            ...result,
            timestamp: Date.now()
          };
        } catch (parseError) {
          console.error('Failed to parse OpenAI response:', parseError);
          return this.fallbackAnalysis(befastAnswers, analysisResults);
        }
      }

      return this.fallbackAnalysis(befastAnswers, analysisResults);
    } catch (error) {
      console.error('OpenAI analysis failed:', error);
      return this.fallbackAnalysis(befastAnswers, analysisResults);
    }
  }

  private fallbackAnalysis(befastAnswers: Record<string, boolean>, analysisResults: any): AIAnalysisResult {
    const positiveAnswers = Object.entries(befastAnswers)
      .filter(([_, answer]) => answer === true)
      .map(([key, _]) => key);

    let riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
    let emergencyAction = false;
    let recommendations: string[] = [];
    let analysis = '';

    if (positiveAnswers.length === 0) {
      riskLevel = 'LOW';
      analysis = 'No stroke symptoms detected in your assessment.';
      recommendations = ['Continue monitoring your health', 'Schedule regular check-ups'];
    } else if (positiveAnswers.length === 1) {
      riskLevel = 'MODERATE';
      analysis = `One potential stroke symptom detected: ${positiveAnswers[0].toUpperCase()}.`;
      recommendations = ['Monitor symptoms closely', 'Consider consulting a healthcare provider'];
    } else if (positiveAnswers.length >= 2) {
      riskLevel = 'HIGH';
      emergencyAction = true;
      analysis = `Multiple stroke symptoms detected: ${positiveAnswers.map(a => a.toUpperCase()).join(', ')}.`;
      recommendations = ['Call 108 immediately', 'Do not drive yourself to the hospital', 'Note the time when symptoms started'];
    }

    // Factor in AI analysis results
    if (analysisResults.face?.asymmetry > 0.3 || analysisResults.speech?.isSlurred) {
      riskLevel = 'HIGH';
      emergencyAction = true;
      recommendations = ['Call 108 immediately', 'Seek immediate medical attention'];
      analysis += ' AI analysis confirms potential stroke symptoms.';
    }

    return {
      riskLevel,
      confidence: 0.8,
      recommendations,
      emergencyAction,
      analysis,
      timestamp: Date.now()
    };
  }

  async generatePersonalizedRecommendations(befastAnswers: Record<string, boolean>, analysisResults: any): Promise<string[]> {
    await this.initialize();

    if (!this.openai) {
      return this.fallbackAnalysis(befastAnswers, analysisResults).recommendations;
    }

    try {
      const prompt = `
Based on this BEFAST assessment, provide 3-5 specific, actionable recommendations:

BEFAST Results: ${Object.entries(befastAnswers).map(([k, v]) => `${k}: ${v ? 'YES' : 'NO'}`).join(', ')}
AI Analysis: ${analysisResults.face ? `Face asymmetry: ${analysisResults.face.asymmetry}` : ''} ${analysisResults.speech ? `Speech: ${analysisResults.speech.isSlurred ? 'SLURRED' : 'NORMAL'}` : ''}

Provide specific, actionable recommendations. If stroke symptoms are present, prioritize emergency actions.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a medical AI assistant. Provide clear, actionable recommendations prioritizing patient safety.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 200
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        return content.split('\n').filter(line => line.trim()).map(line => line.replace(/^\d+\.\s*/, '').trim());
      }

      return this.fallbackAnalysis(befastAnswers, analysisResults).recommendations;
    } catch (error) {
      console.error('OpenAI recommendations failed:', error);
      return this.fallbackAnalysis(befastAnswers, analysisResults).recommendations;
    }
  }
}

export const aiAnalysisService = new AIAnalysisService();
