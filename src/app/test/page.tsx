'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/store/useAppStore';
import { faceAnalysisService } from '@/services/faceAnalysis';
import { speechAnalysisService } from '@/services/speechAnalysis';
import { RealTimeSpeechAnalysisResult } from '@/services/realTimeVoiceAnalysis';

const BEFAST_QUESTIONS = [
  {
    key: 'balance' as const,
    title: 'B - Balance',
    question: 'Have you lost your balance or coordination?',
    description: 'Do you feel dizzy, unsteady, or have trouble walking straight?',
    hasAnalysis: false,
  },
  {
    key: 'eyes' as const,
    title: 'E - Eyes',
    question: 'Have you lost vision in one or both eyes?',
    description: 'Is your vision blurred, double, or completely lost in one or both eyes?',
    hasAnalysis: false,
  },
  {
    key: 'face' as const,
    title: 'F - Face',
    question: 'Has your face drooped on one side?',
    description: 'Does one side of your face look different or feel numb?',
    hasAnalysis: true,
    analysisType: 'face',
  },
  {
    key: 'arms' as const,
    title: 'A - Arms',
    question: 'Can you raise both arms equally?',
    description: 'Does one arm drift down or feel weak when you try to raise both?',
    hasAnalysis: false,
  },
  {
    key: 'speech' as const,
    title: 'S - Speech',
    question: 'Is your speech slurred or unclear?',
    description: 'Are you having trouble speaking clearly or understanding others?',
    hasAnalysis: true,
    analysisType: 'speech',
  },
];

export default function TestPage() {
  const { befastAnswers, updateBEFASTAnswer, setCurrentScreen, setFaceAnalysis, setSpeechAnalysis, resetApp } = useAppStore();
  const [showCamera, setShowCamera] = useState(false);
  const [showMicrophone, setShowMicrophone] = useState(false);
  const [showRealTimeAnalysis, setShowRealTimeAnalysis] = useState(false);
  const [realTimeResult, setRealTimeResult] = useState<RealTimeSpeechAnalysisResult | null>(null);
  const [isRealTimeAnalyzing, setIsRealTimeAnalyzing] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const volumeIntervalRef = useRef<number | null>(null);
  const [analysisResults, setAnalysisResults] = useState<{[key: string]: any}>({});

  const handleAnswer = (questionKey: string, answer: boolean) => {
    updateBEFASTAnswer(questionKey as any, answer);
    
    // If YES is clicked on any question, redirect to neurologist finder
    if (answer === true) {
      window.location.href = '/neurologist';
    }
  };

  const handleFaceAnalysis = async (imageData: ImageData) => {
    try {
      console.log('Running real face analysis...');
      const faceResult = await faceAnalysisService.analyzeFace(imageData);
      console.log('Face analysis result:', faceResult);
      
      setFaceAnalysis(faceResult);
      setAnalysisResults(prev => ({
        ...prev,
        face: {
          asymmetry: faceResult.asymmetry,
          confidence: faceResult.confidence,
        }
      }));
      
      setShowCamera(false);
      
      // Auto-suggest answer based on analysis
      if (faceResult.asymmetry > 10) {
        alert(`Face Analysis Complete\nFacial asymmetry detected!\nAsymmetry: ${faceResult.asymmetry.toFixed(1)}%\nConfidence: ${(faceResult.confidence * 100).toFixed(1)}%\n\nThis suggests facial drooping. Please answer the FACE question above.`);
      } else {
        alert(`Face Analysis Complete\nNo significant facial asymmetry detected.\nAsymmetry: ${faceResult.asymmetry.toFixed(1)}%\nConfidence: ${(faceResult.confidence * 100).toFixed(1)}%`);
      }
    } catch (error) {
      console.error('Face analysis failed:', error);
      if (error instanceof Error && error.message.includes('WebGL')) {
        alert('Face analysis requires WebGL support. Your browser may not support this feature. Please answer the question manually or try using a different browser.');
      } else {
        alert('Face analysis failed. Please try again or answer manually.');
      }
      setShowCamera(false);
    }
  };

  const handleSpeechAnalysis = async (audioBlob: Blob) => {
    try {
      console.log('Running real speech analysis...');
      const speechResult = await speechAnalysisService.analyzeSpeech(audioBlob);
      console.log('Speech analysis result:', speechResult);
      
      setSpeechAnalysis(speechResult);
      setAnalysisResults(prev => ({
        ...prev,
        speech: {
          isSlurred: speechResult.isSlurred,
          confidence: speechResult.confidence,
          transcription: speechResult.transcription,
          timestamp: speechResult.timestamp,
        }
      }));
      
      setShowMicrophone(false);
      
      // Auto-suggest answer based on analysis
      if (speechResult.isSlurred) {
        alert(`Voice Analysis Complete\nSlurred speech detected!\nConfidence: ${(speechResult.confidence * 100).toFixed(1)}%\nTranscription: "${speechResult.transcription}"\n\nThis suggests speech difficulties. Please answer the SPEECH question above.`);
      } else {
        alert(`Voice Analysis Complete\nNo slurred speech detected.\nConfidence: ${(speechResult.confidence * 100).toFixed(1)}%\nTranscription: "${speechResult.transcription}"`);
      }
    } catch (error) {
      console.error('Speech analysis failed:', error);
      if (error instanceof Error && error.message.includes('Inference Provider')) {
        alert('Voice analysis is not available in this environment. Using simulation mode instead. Please answer the question manually if needed.');
      } else {
        alert('Voice analysis failed. Please try again or answer manually.');
      }
      setShowMicrophone(false);
    }
  };

  // Real-time voice analysis functions
  const startRealTimeAnalysis = async () => {
    try {
      setIsRealTimeAnalyzing(true);
      setShowRealTimeAnalysis(true);
      
      await speechAnalysisService.startRealTimeAnalysis(
        (result: RealTimeSpeechAnalysisResult) => {
          setRealTimeResult(result);
          console.log('Real-time analysis result:', result);
        },
        (error: Error) => {
          console.error('Real-time analysis error:', error);
          alert('Real-time analysis failed: ' + error.message);
          stopRealTimeAnalysis();
        }
      );

      // Start volume monitoring
      volumeIntervalRef.current = window.setInterval(() => {
        const volume = speechAnalysisService.getCurrentVolume();
        setVolumeLevel(volume);
      }, 100);

    } catch (error) {
      console.error('Failed to start real-time analysis:', error);
      alert('Failed to start real-time analysis. Please check microphone permissions.');
      setIsRealTimeAnalyzing(false);
      setShowRealTimeAnalysis(false);
    }
  };

  const stopRealTimeAnalysis = async () => {
    setIsRealTimeAnalyzing(false);
    setShowRealTimeAnalysis(false);
    
    speechAnalysisService.stopRealTimeAnalysis();
    
    if (volumeIntervalRef.current) {
      clearInterval(volumeIntervalRef.current);
      volumeIntervalRef.current = null;
    }
    
    setVolumeLevel(0);
    
    // Show analysis results if we have data
    if (realTimeResult) {
      const { confidence, isSlurred, transcription, volume, pitch, clarity } = realTimeResult;
      
      // Store the analysis results
      setAnalysisResults(prev => ({
        ...prev,
        speech: {
          isSlurred,
          confidence,
          transcription,
          timestamp: Date.now(),
          volume,
          pitch,
          clarity
        }
      }));

      // Show detailed analysis results
      const analysisDetails = `
Real-Time Voice Analysis Complete!

📊 ANALYSIS RESULTS:
• Speech Quality: ${isSlurred ? 'SLURRED' : 'NORMAL'}
• Confidence: ${(confidence * 100).toFixed(1)}%
• Volume Level: ${(volume * 100).toFixed(1)}%
• Pitch: ${Math.round(pitch)} Hz
• Clarity: ${(clarity * 100).toFixed(1)}%

📝 TRANSCRIPTION:
"${transcription}"

${isSlurred ? 
  '⚠️ SLURRED SPEECH DETECTED!\n\nThis suggests speech difficulties that may indicate stroke symptoms.\n\nRECOMMENDATION: Consider seeking immediate medical attention.' :
  '✅ NORMAL SPEECH DETECTED!\n\nNo slurred speech detected in your analysis.\n\nRECOMMENDATION: Speech appears normal based on analysis.'
}`;

      alert(analysisDetails);
    }
    
    // Clean up resources
    await speechAnalysisService.cleanupRealTimeAnalysis();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (volumeIntervalRef.current) {
        clearInterval(volumeIntervalRef.current);
      }
      speechAnalysisService.cleanupRealTimeAnalysis();
    };
  }, []);

  const calculateScore = () => {
    let score = 0;
    const factors: string[] = [];

    // BEFAST scoring
    const befastAnswersArray = Object.values(befastAnswers);
    const positiveBEFAST = befastAnswersArray.filter(answer => answer === true).length;
    
    if (positiveBEFAST > 0) {
      score += positiveBEFAST * 20; // Each positive BEFAST sign adds 20 points
      factors.push(`${positiveBEFAST} BEFAST symptom(s) detected`);
    }

    // Face analysis scoring
    if (analysisResults.face) {
      const asymmetry = analysisResults.face.asymmetry;
      if (asymmetry > 15) {
        score += 25;
        factors.push(`Severe facial asymmetry (${asymmetry.toFixed(1)}%)`);
      } else if (asymmetry > 10) {
        score += 15;
        factors.push(`Moderate facial asymmetry (${asymmetry.toFixed(1)}%)`);
      }
    }

    // Speech analysis scoring
    if (analysisResults.speech) {
      if (analysisResults.speech.isSlurred) {
        score += 25;
        factors.push('Slurred speech detected');
      }
      if (analysisResults.speech.confidence < 0.7) {
        score += 10;
        factors.push('Low speech recognition confidence');
      }
    }

    // Determine risk level
    let level: 'LOW' | 'MEDIUM' | 'HIGH';
    let color: string;
    
    if (score >= 50) {
      level = 'HIGH';
      color = 'text-red-600';
    } else if (score >= 25) {
      level = 'MEDIUM';
      color = 'text-yellow-600';
    } else {
      level = 'LOW';
      color = 'text-green-600';
    }

    return { score, level, color, factors };
  };


  const { score, level, color, factors } = calculateScore();

  // Show camera component
  if (showCamera) {
    return <CameraComponent onCapture={handleFaceAnalysis} onClose={() => setShowCamera(false)} />;
  }

  // Show real-time analysis component
  if (showRealTimeAnalysis) {
    return (
      <RealTimeVoiceAnalysisComponent
        isAnalyzing={isRealTimeAnalyzing}
        result={realTimeResult}
        volumeLevel={volumeLevel}
        onStart={startRealTimeAnalysis}
        onStop={stopRealTimeAnalysis}
        onClose={() => setShowRealTimeAnalysis(false)}
      />
    );
  }

  // Show microphone component
  if (showMicrophone) {
    return <MicrophoneComponent onRecordingComplete={handleSpeechAnalysis} onClose={() => setShowMicrophone(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 text-lg font-medium mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">B.E.F.A.S.T. Stroke Assessment</h1>
          <p className="text-lg text-gray-600">Answer each question or use AI analysis tools</p>
        </div>

        {/* Risk Assessment Display */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Live Risk Assessment</h2>
          <div className="text-center mb-4">
            <div className="text-5xl font-bold mb-2">
              <span className={color}>{score}/100</span>
            </div>
            <div className={`text-2xl font-semibold ${color}`}>{level} RISK</div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-6 mb-4">
            <div 
              className={`h-6 rounded-full ${
                level === 'HIGH' ? 'bg-red-500' : 
                level === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(100, score)}%` }}
            />
          </div>
          {factors.length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">Risk Factors:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                {factors.map((factor, index) => (
                  <li key={index}>• {factor}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {BEFAST_QUESTIONS.map((question) => (
            <div key={question.key} className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold text-red-600 mb-4">{question.title}</h2>
              <p className="text-xl font-semibold text-gray-800 mb-2">{question.question}</p>
              <p className="text-gray-600 mb-6">{question.description}</p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {question.hasAnalysis ? (
                  question.analysisType === 'face' ? (
                    <button
                      className="px-8 py-4 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-colors text-lg"
                      onClick={() => setShowCamera(true)}
                    >
                      📷 Start Face Analysis
                    </button>
                  ) : (
                    <div className="flex gap-3 items-center">
                      <button
                        className="px-6 py-4 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition-colors text-lg"
                        onClick={() => setShowRealTimeAnalysis(true)}
                      >
                        🔴 Live Analysis
                      </button>
                      {analysisResults.speech && (
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-2 rounded-lg font-bold text-sm ${
                            analysisResults.speech.isSlurred 
                              ? 'bg-red-100 text-red-800 border border-red-300' 
                              : 'bg-green-100 text-green-800 border border-green-300'
                          }`}>
                            {analysisResults.speech.isSlurred ? 'SLURRED SPEECH' : 'NORMAL SPEECH'}
                          </span>
                          <button
                            className="px-4 py-2 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600 transition-colors text-sm"
                            onClick={() => {
                              const speech = analysisResults.speech;
                              const result = speech.isSlurred ? 'SLURRED SPEECH DETECTED' : 'NORMAL SPEECH DETECTED';
                              alert(result);
                            }}
                          >
                            📊 Details
                          </button>
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  <div className="flex gap-4">
                    <button
                      className={`px-8 py-3 font-bold rounded-lg transition-colors ${
                        befastAnswers[question.key] === false
                          ? 'bg-green-600 text-white'
                          : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                      onClick={() => handleAnswer(question.key, false)}
                    >
                      NO
                    </button>
                    <button
                      className={`px-8 py-3 font-bold rounded-lg transition-colors ${
                        befastAnswers[question.key] === true
                          ? 'bg-red-600 text-white'
                          : 'bg-red-500 text-white hover:bg-red-600'
                      }`}
                      onClick={() => handleAnswer(question.key, true)}
                    >
                      YES
                    </button>
                  </div>
                )}
              </div>

              {/* Current Answer Display */}
              {befastAnswers[question.key] !== null && (
                <div className={`mt-4 p-3 rounded-lg text-center font-bold ${
                  befastAnswers[question.key] 
                    ? 'bg-red-100 text-red-800 border border-red-300' 
                    : 'bg-green-100 text-green-800 border border-green-300'
                }`}>
                  Answer: {befastAnswers[question.key] ? 'YES' : 'NO'}
                </div>
              )}

              {/* Analysis Results Display */}
              {question.hasAnalysis && analysisResults[question.analysisType!] && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">AI Analysis Results:</h4>
                  {question.analysisType === 'face' && analysisResults.face && (
                    <div>
                      <p className="text-sm text-gray-700">
                        • Facial Asymmetry: {analysisResults.face.asymmetry.toFixed(1)}%
                      </p>
                      <p className="text-sm text-gray-700">
                        • Confidence: {(analysisResults.face.confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                  )}
                  {question.analysisType === 'speech' && analysisResults.speech && (
                    <div>
                      <p className="text-sm text-gray-700">
                        • Slurred Speech: {analysisResults.speech.isSlurred ? 'YES' : 'NO'}
                      </p>
                      <p className="text-sm text-gray-700">
                        • Confidence: {(analysisResults.speech.confidence * 100).toFixed(1)}%
                      </p>
                      <p className="text-sm text-gray-700">
                        • Transcription: "{analysisResults.speech.transcription}"
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="text-center mt-8">
          <button 
            className="px-8 py-4 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-900 transition-colors text-lg"
            onClick={() => {
              if (level === 'HIGH') {
                alert('HIGH RISK DETECTED!\n\nPlease call 108 immediately or go to the nearest emergency room.\n\nThis assessment suggests potential stroke symptoms that require immediate medical attention.');
              } else if (level === 'MEDIUM') {
                alert('MEDIUM RISK DETECTED!\n\nPlease consult with a healthcare provider as soon as possible.\n\nSome symptoms may indicate a need for medical evaluation.');
              } else {
                alert('LOW RISK DETECTED!\n\nNo significant stroke symptoms detected.\n\nContinue to monitor and seek medical attention if symptoms develop.');
              }
            }}
          >
            Complete Assessment
          </button>
        </div>
        
        <div className="text-center mt-4">
          <button 
            className="px-6 py-2 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
            onClick={() => {
              // Reset all answers using the resetApp function
              resetApp();
              setAnalysisResults({});
            }}
          >
            Start Over
          </button>
        </div>

        {/* Emergency Notice */}
        <div className="mt-8 bg-yellow-100 border border-yellow-300 rounded-lg p-4">
          <p className="text-center text-yellow-800 font-medium">
            ⚠️ If you experience any stroke symptoms, call emergency services immediately (108)
          </p>
        </div>
      </div>
    </div>
  );
}

// Real-time Voice Analysis Component
function RealTimeVoiceAnalysisComponent({ 
  isAnalyzing, 
  result, 
  volumeLevel, 
  onStart, 
  onStop, 
  onClose 
}: { 
  isAnalyzing: boolean;
  result: RealTimeSpeechAnalysisResult | null;
  volumeLevel: number;
  onStart: () => void;
  onStop: () => void;
  onClose: () => void;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 shadow-xl max-w-2xl w-full mx-4">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Real-Time Voice Analysis</h2>
          <p className="text-gray-600">Live monitoring of speech quality and clarity</p>
        </div>

        {/* Volume Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Volume Level</span>
            <span className="text-sm text-gray-500">{Math.round(volumeLevel * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className={`h-4 rounded-full transition-all duration-100 ${
                volumeLevel > 0.7 ? 'bg-red-500' : 
                volumeLevel > 0.4 ? 'bg-yellow-500' : 
                volumeLevel > 0.1 ? 'bg-green-500' : 'bg-gray-300'
              }`}
              style={{ width: `${Math.min(100, volumeLevel * 100)}%` }}
            />
          </div>
        </div>

        {/* Analysis Results */}
        {result && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${result.isSlurred ? 'text-red-600' : 'text-green-600'}`}>
                  {result.isSlurred ? 'SLURRED' : 'NORMAL'}
                </div>
                <div className="text-sm text-gray-600">Speech Quality</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(result.confidence * 100)}%
                </div>
                <div className="text-sm text-gray-600">Confidence</div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <div className="font-semibold text-gray-700">Volume</div>
                <div className="text-gray-600">{Math.round(result.volume * 100)}%</div>
              </div>
              <div>
                <div className="font-semibold text-gray-700">Pitch</div>
                <div className="text-gray-600">{Math.round(result.pitch)} Hz</div>
              </div>
              <div>
                <div className="font-semibold text-gray-700">Clarity</div>
                <div className="text-gray-600">{Math.round(result.clarity * 100)}%</div>
              </div>
            </div>

            {result.transcription && (
              <div className="mt-4 p-3 bg-white rounded border">
                <div className="text-sm font-semibold text-gray-700 mb-1">Transcription:</div>
                <div className="text-gray-800 italic">"{result.transcription}"</div>
              </div>
            )}
          </div>
        )}

        {/* Status Indicator */}
        <div className="text-center mb-6">
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
            isAnalyzing 
              ? 'bg-red-100 text-red-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            <div className={`w-3 h-3 rounded-full mr-2 ${
              isAnalyzing ? 'bg-red-500 animate-pulse' : 'bg-gray-400'
            }`} />
            {isAnalyzing ? 'Analyzing...' : 'Ready'}
          </div>
        </div>

               {/* Control Buttons */}
               <div className="flex gap-4 justify-center">
                 {!isAnalyzing ? (
                   <button
                     onClick={onStart}
                     className="px-8 py-3 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-colors flex items-center"
                   >
                     <div className="w-3 h-3 bg-white rounded-full mr-2" />
                     Start Live Analysis
                   </button>
                 ) : (
                   <div className="flex gap-2">
                     <button
                       onClick={onStop}
                       className="px-6 py-3 bg-gray-500 text-white font-bold rounded-lg hover:bg-gray-600 transition-colors"
                     >
                       Stop Analysis
                     </button>
                     {result && (
                       <button
                         onClick={() => {
                           const { confidence, isSlurred, transcription, volume, pitch, clarity } = result;
                           const analysisDetails = `
Current Analysis Results:

📊 LIVE ANALYSIS:
• Speech Quality: ${isSlurred ? 'SLURRED' : 'NORMAL'}
• Confidence: ${(confidence * 100).toFixed(1)}%
• Volume Level: ${(volume * 100).toFixed(1)}%
• Pitch: ${Math.round(pitch)} Hz
• Clarity: ${(clarity * 100).toFixed(1)}%

📝 TRANSCRIPTION:
"${transcription}"

${isSlurred ? 
  '⚠️ SLURRED SPEECH DETECTED!\n\nThis suggests speech difficulties that may indicate stroke symptoms.' :
  '✅ NORMAL SPEECH DETECTED!\n\nNo slurred speech detected in current analysis.'
}`;
                           alert(analysisDetails);
                         }}
                         className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
                       >
                         📊 Get Results
                       </button>
                     )}
                   </div>
                 )}
                 
                 <button
                   onClick={onClose}
                   className="px-6 py-3 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition-colors"
                 >
                   Close
                 </button>
               </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Instructions:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Click "Start Live Analysis" to begin monitoring</li>
            <li>• Speak normally into your microphone</li>
            <li>• Watch real-time analysis of your speech quality</li>
            <li>• The system will detect slurred speech automatically</li>
            <li>• Click "Stop Analysis" when finished</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Microphone Component
function MicrophoneComponent({ onRecordingComplete, onClose }: { onRecordingComplete: (audioBlob: Blob) => void; onClose: () => void }) {
  const [isRecording, setIsRecording] = React.useState(false);
  const [recordingTime, setRecordingTime] = React.useState(0);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        onRecordingComplete(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  };

  React.useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 shadow-xl max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Voice Test</h2>
          <p className="text-gray-600">Click to start recording and speak clearly</p>
        </div>

        <div className="text-center mb-6">
          {isRecording ? (
            <div className="text-6xl mb-4">🔴</div>
          ) : (
            <div className="text-6xl mb-4">🎤</div>
          )}
          
          <div className="text-2xl font-bold text-gray-800 mb-2">
            {isRecording ? 'Recording...' : 'Ready to Record'}
          </div>
          
          {isRecording && (
            <div className="text-lg text-gray-600">
              {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
            </div>
          )}
        </div>

        <div className="flex gap-4 justify-center">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="px-8 py-4 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-colors flex items-center"
            >
              <div className="w-4 h-4 bg-white rounded-full mr-2" />
              Start Recording
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="px-8 py-4 bg-gray-500 text-white font-bold rounded-lg hover:bg-gray-600 transition-colors"
            >
              Stop Recording
            </button>
          )}
          
          <button
            onClick={onClose}
            className="px-6 py-4 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition-colors"
          >
            X Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Camera Component
function CameraComponent({ onCapture, onClose }: { onCapture: (imageData: ImageData) => void; onClose: () => void }) {
  const [isCapturing, setIsCapturing] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  React.useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: 640, 
            height: 480,
            facingMode: 'user'
          } 
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        alert('Failed to access camera. Please check permissions.');
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);
    
    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) {
        throw new Error('Could not get canvas context');
      }
      
      context.drawImage(video, 0, 0);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      onCapture(imageData);
    } catch (error) {
      console.error('Error capturing photo:', error);
      alert('Failed to capture photo. Please try again or answer manually.');
      setIsCapturing(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 shadow-xl max-w-2xl w-full mx-4">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Face Analysis</h2>
          <p className="text-gray-600">Position your face in the camera and click capture</p>
        </div>

        <div className="mb-6">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full max-w-md mx-auto rounded-lg border-2 border-gray-300"
          />
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={capturePhoto}
            disabled={isCapturing}
            className="px-8 py-4 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCapturing ? 'Analyzing...' : '📷 Capture & Analyze'}
          </button>
          
          <button
            onClick={onClose}
            className="px-6 py-4 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition-colors"
          >
            X Close
          </button>
        </div>
      </div>
    </div>
  );
}
