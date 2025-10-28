import { create } from 'zustand';
import { AppState, BEFASTAnswers, FaceAnalysisResult, SpeechAnalysisResult, Hospital, AIRiskScore } from '@/types';

interface AppStore extends AppState {
  // Actions
  updateBEFASTAnswer: (question: keyof BEFASTAnswers, answer: boolean) => void;
  setFaceAnalysis: (analysis: FaceAnalysisResult) => void;
  setSpeechAnalysis: (analysis: SpeechAnalysisResult) => void;
  setNearbyHospitals: (hospitals: Hospital[]) => void;
  setAIRiskScore: (score: AIRiskScore) => void;
  setEmergencyMode: (isEmergency: boolean) => void;
  setCurrentScreen: (screen: AppState['currentScreen']) => void;
  resetApp: () => void;
  checkForEmergency: () => boolean;
}

const initialBEFASTAnswers: BEFASTAnswers = {
  balance: null,
  eyes: null,
  face: null,
  arms: null,
  speech: null,
};

const initialState: AppState = {
  befastAnswers: initialBEFASTAnswers,
  faceAnalysis: null,
  speechAnalysis: null,
  nearbyHospitals: [],
  aiRiskScore: null,
  isEmergencyMode: false,
  currentScreen: 'befast',
};

export const useAppStore = create<AppStore>((set, get) => ({
  ...initialState,

  updateBEFASTAnswer: (question, answer) => {
    set((state) => ({
      befastAnswers: {
        ...state.befastAnswers,
        [question]: answer,
      },
    }));
    
    // Don't auto-navigate on individual answers - let user complete assessment first
    // Emergency navigation is handled by the completeAssessment function
  },

  setFaceAnalysis: (analysis) => {
    set({ faceAnalysis: analysis });
  },

  setSpeechAnalysis: (analysis) => {
    set({ speechAnalysis: analysis });
  },

  setNearbyHospitals: (hospitals) => {
    set({ nearbyHospitals: hospitals });
  },

  setAIRiskScore: (score) => {
    set({ aiRiskScore: score });
    
    // Auto-trigger emergency if score > 70
    if (score.score > 70) {
      set({ isEmergencyMode: true, currentScreen: 'time' });
    }
  },

  setEmergencyMode: (isEmergency) => {
    set({ isEmergencyMode: isEmergency });
  },

  setCurrentScreen: (screen) => {
    set({ currentScreen: screen });
  },

  resetApp: () => {
    set(initialState);
  },

  checkForEmergency: () => {
    const state = get();
    const hasPositiveBEFAST = Object.values(state.befastAnswers).some(answer => answer === true);
    const highRiskScore = state.aiRiskScore && state.aiRiskScore.score > 70;
    
    return hasPositiveBEFAST || highRiskScore || false;
  },
}));
