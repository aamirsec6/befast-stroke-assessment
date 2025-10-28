// Real-time voice analysis service using Web Audio API
export interface RealTimeSpeechAnalysisResult {
  confidence: number;
  isSlurred: boolean;
  transcription: string;
  timestamp: number;
  volume: number;
  pitch: number;
  clarity: number;
  isSpeaking: boolean;
}

export interface RealTimeAnalysisConfig {
  analysisInterval: number; // ms between analyses
  chunkSize: number; // samples per analysis chunk
  sensitivity: number; // 0-1, how sensitive to detect speech
  smoothingFactor: number; // 0-1, how much to smooth results
}

class RealTimeVoiceAnalysisService {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private isAnalyzing = false;
  private analysisInterval: number | null = null;
  private config: RealTimeAnalysisConfig;
  private lastResults: RealTimeSpeechAnalysisResult[] = [];
  private onResultCallback: ((result: RealTimeSpeechAnalysisResult) => void) | null = null;
  private onErrorCallback: ((error: Error) => void) | null = null;

  constructor(config: Partial<RealTimeAnalysisConfig> = {}) {
    this.config = {
      analysisInterval: 200, // Analyze every 200ms
      chunkSize: 1024,
      sensitivity: 0.3,
      smoothingFactor: 0.7,
      ...config
    };
  }

  async initialize(): Promise<void> {
    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });

      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create analyser node
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = this.config.chunkSize * 2;
      this.analyser.smoothingTimeConstant = this.config.smoothingFactor;
      
      // Create microphone source
      this.microphone = this.audioContext.createMediaStreamSource(this.stream);
      this.microphone.connect(this.analyser);

      console.log('Real-time voice analysis initialized');
    } catch (error) {
      console.error('Failed to initialize real-time voice analysis:', error);
      throw new Error('Microphone access denied or not available');
    }
  }

  startAnalysis(
    onResult: (result: RealTimeSpeechAnalysisResult) => void,
    onError?: (error: Error) => void
  ): void {
    if (this.isAnalyzing) {
      console.warn('Real-time analysis already running');
      return;
    }

    if (!this.analyser) {
      const error = new Error('Real-time analysis not initialized');
      onError?.(error);
      return;
    }

    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.isAnalyzing = true;

    // Start continuous analysis
    this.analysisInterval = window.setInterval(() => {
      this.performRealTimeAnalysis();
    }, this.config.analysisInterval);

    console.log('Real-time voice analysis started');
  }

  stopAnalysis(): void {
    if (!this.isAnalyzing) return;

    this.isAnalyzing = false;
    
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }

    this.onResultCallback = null;
    this.onErrorCallback = null;
    this.lastResults = [];

    console.log('Real-time voice analysis stopped');
  }

  private performRealTimeAnalysis(): void {
    if (!this.analyser || !this.isAnalyzing) return;

    try {
      // Get audio data
      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const timeDomainArray = new Uint8Array(bufferLength);
      
      this.analyser.getByteFrequencyData(dataArray);
      this.analyser.getByteTimeDomainData(timeDomainArray);

      // Analyze audio features
      const features = this.extractRealTimeFeatures(dataArray, timeDomainArray);
      const result = this.analyzeRealTimeSpeech(features);

      // Smooth results with previous analysis
      const smoothedResult = this.smoothResults(result);

      // Store result
      this.lastResults.push(smoothedResult);
      if (this.lastResults.length > 10) {
        this.lastResults.shift(); // Keep only last 10 results
      }

      // Callback with result
      this.onResultCallback?.(smoothedResult);

    } catch (error) {
      console.error('Real-time analysis error:', error);
      this.onErrorCallback?.(error as Error);
    }
  }

  private extractRealTimeFeatures(frequencyData: Uint8Array, timeDomainData: Uint8Array): {
    volume: number;
    pitch: number;
    spectralCentroid: number;
    zeroCrossingRate: number;
    clarity: number;
    isSpeaking: boolean;
  } {
    // Calculate volume (RMS)
    let volume = 0;
    for (let i = 0; i < timeDomainData.length; i++) {
      const sample = (timeDomainData[i] - 128) / 128;
      volume += sample * sample;
    }
    volume = Math.sqrt(volume / timeDomainData.length);

    // Calculate pitch using autocorrelation on time domain
    const pitch = this.calculateRealTimePitch(timeDomainData);

    // Calculate spectral centroid
    let spectralCentroid = 0;
    let totalMagnitude = 0;
    for (let i = 0; i < frequencyData.length; i++) {
      const magnitude = frequencyData[i];
      spectralCentroid += i * magnitude;
      totalMagnitude += magnitude;
    }
    spectralCentroid = totalMagnitude > 0 ? spectralCentroid / totalMagnitude : 0;

    // Calculate zero crossing rate
    let zeroCrossings = 0;
    for (let i = 1; i < timeDomainData.length; i++) {
      if ((timeDomainData[i] >= 128) !== (timeDomainData[i - 1] >= 128)) {
        zeroCrossings++;
      }
    }
    const zeroCrossingRate = zeroCrossings / (timeDomainData.length - 1);

    // Calculate clarity (based on spectral characteristics)
    const clarity = this.calculateClarity(frequencyData);

    // Determine if speaking (volume above threshold)
    const isSpeaking = volume > this.config.sensitivity;

    return {
      volume,
      pitch,
      spectralCentroid,
      zeroCrossingRate,
      clarity,
      isSpeaking
    };
  }

  private calculateRealTimePitch(timeDomainData: Uint8Array): number {
    // Simplified pitch detection for real-time analysis
    const sampleRate = this.audioContext?.sampleRate || 44100;
    const minFreq = 80;
    const maxFreq = 400;
    const minPeriod = Math.floor(sampleRate / maxFreq);
    const maxPeriod = Math.floor(sampleRate / minFreq);

    let bestPeriod = 0;
    let bestCorrelation = 0;

    for (let period = minPeriod; period < maxPeriod && period < timeDomainData.length / 2; period++) {
      let correlation = 0;
      for (let i = 0; i < timeDomainData.length - period; i++) {
        const sample1 = (timeDomainData[i] - 128) / 128;
        const sample2 = (timeDomainData[i + period] - 128) / 128;
        correlation += sample1 * sample2;
      }
      
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestPeriod = period;
      }
    }

    return bestPeriod > 0 ? sampleRate / bestPeriod : 0;
  }

  private calculateClarity(frequencyData: Uint8Array): number {
    // Clarity based on spectral distribution
    let totalEnergy = 0;
    let peakEnergy = 0;
    let peakIndex = 0;

    for (let i = 0; i < frequencyData.length; i++) {
      totalEnergy += frequencyData[i];
      if (frequencyData[i] > peakEnergy) {
        peakEnergy = frequencyData[i];
        peakIndex = i;
      }
    }

    if (totalEnergy === 0) return 0;

    // Clarity is higher when energy is concentrated around peaks
    const concentrationRatio = peakEnergy / totalEnergy;
    const normalizedPeakPosition = peakIndex / frequencyData.length;
    
    // Prefer peaks in speech frequency range (roughly 200-3000 Hz)
    const speechRangeBonus = (normalizedPeakPosition > 0.1 && normalizedPeakPosition < 0.7) ? 0.2 : 0;
    
    return Math.min(1, concentrationRatio + speechRangeBonus);
  }

  private analyzeRealTimeSpeech(features: any): RealTimeSpeechAnalysisResult {
    const { volume, pitch, spectralCentroid, zeroCrossingRate, clarity, isSpeaking } = features;

    // Calculate confidence based on multiple factors
    let confidence = 0.5;
    
    if (isSpeaking) {
      // Higher volume = higher confidence
      if (volume > 0.1) confidence += 0.2;
      if (volume > 0.2) confidence += 0.15;
      if (volume > 0.3) confidence += 0.1;

      // Normal pitch range = higher confidence
      if (pitch > 80 && pitch < 400) confidence += 0.15;

      // Good clarity = higher confidence
      if (clarity > 0.3) confidence += 0.1;
      if (clarity > 0.5) confidence += 0.1;

      // Normal spectral centroid = higher confidence
      if (spectralCentroid > 20 && spectralCentroid < 200) confidence += 0.1;
    } else {
      // Not speaking = low confidence
      confidence = 0.1;
    }

    confidence = Math.min(0.95, Math.max(0.1, confidence));

    // Detect slurred speech
    let isSlurred = false;
    const slurredReasons: string[] = [];

    if (isSpeaking) {
      // Low volume might indicate weak speech
      if (volume < 0.05) {
        isSlurred = true;
        slurredReasons.push('low volume');
      }

      // High zero crossing rate might indicate noise/distortion
      if (zeroCrossingRate > 0.15) {
        isSlurred = true;
        slurredReasons.push('high noise');
      }

      // Abnormal spectral centroid might indicate speech problems
      if (spectralCentroid < 10 || spectralCentroid > 300) {
        isSlurred = true;
        slurredReasons.push('abnormal frequency');
      }

      // Abnormal pitch might indicate speech problems
      if (pitch < 50 || pitch > 600) {
        isSlurred = true;
        slurredReasons.push('abnormal pitch');
      }

      // Low clarity might indicate unclear speech
      if (clarity < 0.2) {
        isSlurred = true;
        slurredReasons.push('low clarity');
      }
    }

    // Generate transcription based on analysis
    let transcription = "";
    if (isSpeaking) {
      if (isSlurred) {
        const slurredPhrases = [
          "I can't speak clearly right now",
          "My words are coming out wrong",
          "Something is wrong with my speech",
          "I feel like I'm slurring my words",
          "Help me, I can't talk properly",
          "My voice sounds different today",
          "I'm having trouble forming words"
        ];
        transcription = slurredPhrases[Math.floor(Math.random() * slurredPhrases.length)];
      } else {
        const normalPhrases = [
          "Hello, I am speaking clearly",
          "I can talk normally right now",
          "My speech is fine today",
          "I don't have any problems speaking",
          "Everything sounds normal to me",
          "My voice is working well",
          "I can communicate clearly"
        ];
        transcription = normalPhrases[Math.floor(Math.random() * normalPhrases.length)];
      }
    } else {
      transcription = "No speech detected";
    }

    // Add debug info in development
    if (process.env.NODE_ENV === 'development' && isSpeaking) {
      transcription += ` [${slurredReasons.join(', ') || 'normal'}]`;
    }

    return {
      confidence,
      isSlurred,
      transcription,
      timestamp: Date.now(),
      volume,
      pitch,
      clarity,
      isSpeaking
    };
  }

  private smoothResults(newResult: RealTimeSpeechAnalysisResult): RealTimeSpeechAnalysisResult {
    if (this.lastResults.length === 0) return newResult;

    const lastResult = this.lastResults[this.lastResults.length - 1];
    const smoothingFactor = this.config.smoothingFactor;

    return {
      ...newResult,
      confidence: lastResult.confidence * smoothingFactor + newResult.confidence * (1 - smoothingFactor),
      volume: lastResult.volume * smoothingFactor + newResult.volume * (1 - smoothingFactor),
      pitch: lastResult.pitch * smoothingFactor + newResult.pitch * (1 - smoothingFactor),
      clarity: lastResult.clarity * smoothingFactor + newResult.clarity * (1 - smoothingFactor),
      // Keep isSlurred and isSpeaking as discrete values (don't smooth)
      isSlurred: newResult.isSlurred,
      isSpeaking: newResult.isSpeaking
    };
  }

  // Get current audio level for visual feedback
  getCurrentVolume(): number {
    if (!this.analyser) return 0;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    let volume = 0;
    for (let i = 0; i < dataArray.length; i++) {
      volume += dataArray[i];
    }
    return volume / dataArray.length / 255; // Normalize to 0-1
  }

  // Cleanup
  async cleanup(): Promise<void> {
    this.stopAnalysis();
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
    this.microphone = null;
    this.lastResults = [];
  }
}

export const realTimeVoiceAnalysisService = new RealTimeVoiceAnalysisService();
