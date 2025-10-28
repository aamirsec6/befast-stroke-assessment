export interface BEFASTAnswers {
  balance: boolean | null;
  eyes: boolean | null;
  face: boolean | null;
  arms: boolean | null;
  speech: boolean | null;
}

export interface FaceLandmarks {
  x: number;
  y: number;
  z: number;
}

export interface FaceAnalysisResult {
  asymmetry: number;
  confidence: number;
  timestamp: number;
  landmarks?: FaceLandmarks[];
}

export interface SpeechAnalysisResult {
  confidence: number;
  isSlurred: boolean;
  transcription: string;
  timestamp: number;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  distance: number;
  rating: number;
  phone?: string;
  website?: string;
}

export interface AIRiskScore {
  score: number;
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  factors: string[];
  timestamp: number;
}

export interface AppState {
  befastAnswers: BEFASTAnswers;
  faceAnalysis: FaceAnalysisResult | null;
  speechAnalysis: SpeechAnalysisResult | null;
  nearbyHospitals: Hospital[];
  aiRiskScore: AIRiskScore | null;
  isEmergencyMode: boolean;
  currentScreen: 'befast' | 'time' | 'analysis' | 'hospitals';
}
