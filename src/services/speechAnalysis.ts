// Speech analysis service using real-time analysis, offline Web Audio API, and Hugging Face fallback
import { HfInference } from '@huggingface/inference';
import { simpleOfflineSpeechAnalysisService } from './simpleOfflineSpeechAnalysis';
import { realTimeVoiceAnalysisService, RealTimeSpeechAnalysisResult } from './realTimeVoiceAnalysis';

export interface SpeechAnalysisResult {
  confidence: number;
  isSlurred: boolean;
  transcription: string;
  timestamp: number;
}

class SpeechAnalysisService {
  private hf: HfInference | null = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Check if API key is available
      const apiKey = process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY;
      if (!apiKey) {
        console.log('No Hugging Face API key found, using simulation mode');
        this.isInitialized = true;
        return;
      }
      
      this.hf = new HfInference(apiKey);
      this.isInitialized = true;
      console.log('Speech analysis service initialized');
    } catch (error) {
      console.error('Failed to initialize speech analysis:', error);
      // Don't throw error, fall back to simulation
      this.isInitialized = true;
    }
  }

  async analyzeSpeech(audioBlob: Blob): Promise<SpeechAnalysisResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Try offline analysis first (faster and more reliable)
    try {
      console.log('Using simple offline speech analysis');
      return await simpleOfflineSpeechAnalysisService.analyzeSpeech(audioBlob);
    } catch (error) {
      console.error('Simple offline speech analysis failed:', error);
    }

    // Fallback to Hugging Face if available
    if (this.hf) {
      try {
        console.log('Falling back to Hugging Face speech analysis');
        const arrayBuffer = await audioBlob.arrayBuffer();
        
        const result = await this.hf.automaticSpeechRecognition({
          model: 'facebook/wav2vec2-base-960h', // Use base model for better compatibility
          data: arrayBuffer,
        });

        const transcription = result.text?.trim() || '';
        const confidence = this.calculateConfidence(result);
        const isSlurred = this.detectSlurredSpeech(transcription, confidence);

        console.log('Hugging Face speech analysis result:', { transcription, confidence, isSlurred });

        return {
          confidence,
          isSlurred,
          transcription,
          timestamp: Date.now(),
        };
      } catch (error) {
        console.error('Hugging Face speech analysis failed:', error);
      }
    }

    // Final fallback to simulation
    console.log('Using speech analysis simulation');
    return this.simulateSpeechAnalysis();
  }

  private calculateConfidence(result: any): number {
    // Extract confidence from the result
    // Wav2Vec2 models typically return confidence scores
    if (result.confidence !== undefined) {
      return Math.max(0, Math.min(1, result.confidence));
    }
    
    // If no confidence score, estimate based on text quality
    const text = result.text || '';
    if (text.length === 0) return 0;
    
    // Simple heuristic: longer, more coherent text = higher confidence
    const wordCount = text.split(' ').length;
    const hasPunctuation = /[.!?]/.test(text);
    const hasSpaces = text.includes(' ');
    
    let confidence = 0.5; // Base confidence
    if (wordCount > 3) confidence += 0.2;
    if (hasPunctuation) confidence += 0.1;
    if (hasSpaces) confidence += 0.1;
    if (text.length > 20) confidence += 0.1;
    
    return Math.max(0.3, Math.min(0.95, confidence));
  }

  private detectSlurredSpeech(transcription: string, confidence: number): boolean {
    // Simple heuristics for detecting slurred speech
    const words = transcription.toLowerCase().split(' ');
    
    // Check for common slurred speech patterns
    const slurredPatterns = [
      /mumble/i,
      /slur/i,
      /unclear/i,
      /indistinct/i,
    ];
    
    // Check for repeated characters (common in slurred speech)
    const hasRepeatedChars = /(.)\1{2,}/.test(transcription);
    
    // Check for very low confidence
    const lowConfidence = confidence < 0.6;
    
    // Check for very short or very long words (might indicate slurring)
    const hasAbnormalWords = words.some(word => word.length > 15 || (word.length < 2 && word.length > 0));
    
    // Check for pattern matches
    const hasSlurredPatterns = slurredPatterns.some(pattern => pattern.test(transcription));
    
    return hasSlurredPatterns || (lowConfidence && hasAbnormalWords) || hasRepeatedChars;
  }

  // Simulate speech analysis for demo purposes
  async simulateSpeechAnalysis(): Promise<SpeechAnalysisResult> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // More realistic simulation based on common speech patterns
        const normalTranscriptions = [
          "Hello, I am speaking clearly",
          "I can talk normally right now",
          "My speech is fine today",
          "I don't have any problems speaking",
          "Everything sounds normal to me"
        ];
        
        const slurredTranscriptions = [
          "I can't speak clearly right now",
          "My words are coming out wrong",
          "Something is wrong with my speech",
          "I feel like I'm slurring my words",
          "Help me, I can't talk properly"
        ];
        
        // 70% chance of normal speech, 30% chance of slurred
        const isSlurred = Math.random() < 0.3;
        const transcriptions = isSlurred ? slurredTranscriptions : normalTranscriptions;
        const transcription = transcriptions[Math.floor(Math.random() * transcriptions.length)];
        
        // More realistic confidence based on speech quality
        const confidence = isSlurred 
          ? 0.4 + Math.random() * 0.3  // 40-70% for slurred speech
          : 0.7 + Math.random() * 0.2; // 70-90% for normal speech
        
        resolve({
          confidence,
          isSlurred,
          transcription,
          timestamp: Date.now(),
        });
      }, 1500); // Reduced timeout for better UX
    });
  }

  // Real-time analysis methods
  async startRealTimeAnalysis(
    onResult: (result: RealTimeSpeechAnalysisResult) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    try {
      await realTimeVoiceAnalysisService.initialize();
      realTimeVoiceAnalysisService.startAnalysis(onResult, onError);
    } catch (error) {
      console.error('Failed to start real-time analysis:', error);
      onError?.(error as Error);
    }
  }

  stopRealTimeAnalysis(): void {
    realTimeVoiceAnalysisService.stopAnalysis();
  }

  getCurrentVolume(): number {
    return realTimeVoiceAnalysisService.getCurrentVolume();
  }

  async cleanupRealTimeAnalysis(): Promise<void> {
    await realTimeVoiceAnalysisService.cleanup();
  }
}

export const speechAnalysisService = new SpeechAnalysisService();
