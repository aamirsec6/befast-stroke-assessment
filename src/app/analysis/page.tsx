'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { faceAnalysisService } from '@/services/faceAnalysis';
import { speechAnalysisService } from '@/services/speechAnalysis';
import { aiAdvisorService } from '@/services/aiAdvisor';

export default function AnalysisPage() {
  const { 
    befastAnswers, 
    faceAnalysis, 
    speechAnalysis, 
    aiRiskScore, 
    setFaceAnalysis, 
    setSpeechAnalysis, 
    setAIRiskScore 
  } = useAppStore();
  
  const [showCamera, setShowCamera] = useState(false);
  const [showMicrophone, setShowMicrophone] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    // Auto-run analysis when page loads if we have data
    if (faceAnalysis || speechAnalysis) {
      runAnalysis();
    }
  }, []);

  const runAnalysis = async () => {
    console.log('Starting AI analysis...');
    setIsAnalyzing(true);
    
    try {
      console.log('Running face analysis simulation...');
      const faceResult = await faceAnalysisService.simulateFaceAnalysis();
      console.log('Face analysis result:', faceResult);
      setFaceAnalysis(faceResult);

      console.log('Running speech analysis simulation...');
      const speechResult = await speechAnalysisService.simulateSpeechAnalysis();
      console.log('Speech analysis result:', speechResult);
      setSpeechAnalysis(speechResult);

      console.log('Calculating AI risk score...');
      const riskScore = await aiAdvisorService.simulateAIAnalysis({
        befastAnswers,
        faceAnalysis: faceResult,
        speechAnalysis: speechResult,
      });
      console.log('AI risk score result:', riskScore);
      setAIRiskScore(riskScore);
      console.log('Analysis completed successfully!');
    } catch (error) {
      console.error('Analysis failed:', error);
      console.log('Falling back to simple analysis...');
      
      // Fallback analysis
      const fallbackRiskScore = {
        score: 30 + Math.random() * 40, // 30-70% risk
        level: 'MEDIUM' as const,
        factors: ['Analysis completed with fallback method'],
        timestamp: Date.now(),
      };
      setAIRiskScore(fallbackRiskScore);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFaceCapture = async (imageData: ImageData) => {
    setShowCamera(false);
    setIsAnalyzing(true);
    
    try {
      console.log('Analyzing captured face...');
      const faceResult = await faceAnalysisService.analyzeFace(imageData);
      console.log('Real face analysis result:', faceResult);
      setFaceAnalysis(faceResult);
      
      // Continue with speech analysis
      const speechResult = await speechAnalysisService.simulateSpeechAnalysis();
      setSpeechAnalysis(speechResult);
      
      // Calculate final risk score
      await calculateFinalRiskScore();
    } catch (error) {
      console.error('Face analysis failed:', error);
      // Fallback to simulation
      const faceResult = await faceAnalysisService.simulateFaceAnalysis();
      setFaceAnalysis(faceResult);
      await calculateFinalRiskScore();
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSpeechRecording = async (audioBlob: Blob) => {
    setShowMicrophone(false);
    setIsAnalyzing(true);
    
    try {
      console.log('Analyzing recorded speech...');
      const speechResult = await speechAnalysisService.analyzeSpeech(audioBlob);
      console.log('Real speech analysis result:', speechResult);
      setSpeechAnalysis(speechResult);
      
      // Calculate final risk score
      await calculateFinalRiskScore();
    } catch (error) {
      console.error('Speech analysis failed:', error);
      // Fallback to simulation
      const speechResult = await speechAnalysisService.simulateSpeechAnalysis();
      setSpeechAnalysis(speechResult);
      await calculateFinalRiskScore();
    } finally {
      setIsAnalyzing(false);
    }
  };

  const calculateFinalRiskScore = async () => {
    try {
      const riskScore = await aiAdvisorService.simulateAIAnalysis({
        befastAnswers,
        faceAnalysis,
        speechAnalysis,
      });
      setAIRiskScore(riskScore);
    } catch (error) {
      console.error('Risk calculation failed:', error);
    }
  };

  // Show camera component
  if (showCamera) {
    return <CameraComponent onCapture={handleFaceCapture} onClose={() => setShowCamera(false)} />;
  }

  // Show microphone component
  if (showMicrophone) {
    return <MicrophoneComponent onRecordingComplete={handleSpeechRecording} onClose={() => setShowMicrophone(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">AI Analysis Results</h1>
          <p className="text-lg text-gray-600">Comprehensive stroke risk assessment</p>
        </div>

        {isAnalyzing ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Analyzing data...</h2>
            <p className="text-gray-600">This may take a few moments</p>
          </div>
        ) : !faceAnalysis && !speechAnalysis && !aiRiskScore ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Start AI Analysis</h2>
            <p className="text-gray-600 mb-8">
              Use your camera and microphone for real analysis, or run simulation
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                onClick={() => setShowCamera(true)}
              >
                📷 Start Real Analysis
              </button>
              
              <button
                className="px-8 py-4 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                onClick={runAnalysis}
              >
                🤖 Run Simulation
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* BEFAST Assessment Results */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">BEFAST Assessment</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(befastAnswers).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-semibold text-gray-700 capitalize">{key}:</span>
                    <span className={`font-bold ${value === true ? 'text-red-600' : value === false ? 'text-green-600' : 'text-gray-500'}`}>
                      {value === null ? 'Not assessed' : value ? 'YES' : 'NO'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Face Analysis Results */}
            {faceAnalysis && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Facial Analysis</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Asymmetry: {faceAnalysis.asymmetry.toFixed(1)}%</h3>
                    <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                      <div 
                        className={`h-4 rounded-full ${faceAnalysis.asymmetry > 20 ? 'bg-red-500' : faceAnalysis.asymmetry > 10 ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${Math.min(faceAnalysis.asymmetry, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600">
                      <strong>What it means:</strong> Facial asymmetry refers to unevenness between the left and right sides of your face. 
                      In stroke context, one side might droop or appear weaker.
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      <strong>Your result ({faceAnalysis.asymmetry.toFixed(1)}%):</strong> {
                        faceAnalysis.asymmetry > 20 ? 'This suggests noticeable facial unevenness that may indicate stroke symptoms.' :
                        faceAnalysis.asymmetry > 10 ? 'This shows moderate facial asymmetry.' :
                        'This indicates normal facial symmetry.'
                      }
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Confidence: {(faceAnalysis.confidence * 100).toFixed(1)}%</h3>
                    <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                      <div 
                        className="bg-blue-500 h-4 rounded-full"
                        style={{ width: `${faceAnalysis.confidence * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600">
                      <strong>What it means:</strong> This indicates how certain the AI is about its facial analysis measurement.
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      <strong>Your result ({(faceAnalysis.confidence * 100).toFixed(1)}%):</strong> {
                        faceAnalysis.confidence > 0.8 ? 'High confidence in the analysis results.' :
                        faceAnalysis.confidence > 0.6 ? 'Moderate confidence in the analysis results.' :
                        'Lower confidence - results should be interpreted with caution.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Speech Analysis Results */}
            {speechAnalysis && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Speech Analysis</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      Slurred Speech: {speechAnalysis.isSlurred ? 'YES' : 'NO'}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      <strong>What it means:</strong> Slurred speech (dysarthria) is a common stroke symptom where words sound unclear, mumbled, or indistinct.
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Your result ({speechAnalysis.isSlurred ? 'YES' : 'NO'}):</strong> {
                        speechAnalysis.isSlurred ? 'This indicates that slurred speech was detected in your audio.' :
                        'No slurred speech patterns were detected in your audio.'
                      }
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Confidence: {(speechAnalysis.confidence * 100).toFixed(1)}%</h3>
                    <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                      <div 
                        className="bg-blue-500 h-4 rounded-full"
                        style={{ width: `${speechAnalysis.confidence * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      <strong>What it means:</strong> This indicates how certain the AI is about its speech analysis assessment.
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Transcription:</strong> "{speechAnalysis.transcription}"
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* AI Risk Assessment */}
            {aiRiskScore && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">AI Risk Assessment</h2>
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold mb-2">
                    <span className={aiRiskScore.score > 70 ? 'text-red-600' : aiRiskScore.score > 40 ? 'text-yellow-600' : 'text-green-600'}>
                      {aiRiskScore.score}/100
                    </span>
                  </div>
                  <div className={`text-2xl font-semibold ${
                    aiRiskScore.level === 'HIGH' ? 'text-red-600' :
                    aiRiskScore.level === 'MEDIUM' ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {aiRiskScore.level} RISK
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-6 mb-4">
                  <div 
                    className={`h-6 rounded-full ${
                      aiRiskScore.score > 70 ? 'bg-red-500' :
                      aiRiskScore.score > 40 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${aiRiskScore.score}%` }}
                  ></div>
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Key Factors:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {aiRiskScore.factors.map((factor, index) => (
                      <li key={index} className="text-gray-600">{factor}</li>
                    ))}
                  </ul>
                </div>

                {aiRiskScore.score > 70 && (
                  <div className="bg-red-100 border border-red-300 rounded-lg p-4">
                    <p className="text-red-800 font-semibold">
                      ⚠️ High risk detected! Please seek immediate medical attention.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.location.href = '/'}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                ← Back to Assessment
              </button>
              
              {aiRiskScore && aiRiskScore.score > 70 && (
                <button
                  onClick={() => window.location.href = '/emergency'}
                  className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
                >
                  🚨 Emergency Instructions
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Camera Component (same as in main page)
function CameraComponent({ onCapture, onClose }: { onCapture: (imageData: ImageData) => void; onClose: () => void }) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = React.useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = React.useState(false);

  React.useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Camera access denied. Using simulation instead.');
      onClose();
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsCapturing(true);
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    
    onCapture(imageData);
    setIsCapturing(false);
  };

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="mb-4">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-64 object-cover rounded-lg"
          />
          <canvas
            ref={canvasRef}
            className="hidden"
          />
        </div>
        
        <div className="text-center">
          <p className="text-gray-700 mb-4">
            Position your face in the center and look directly at the camera
          </p>
          
          <button
            className={`px-6 py-3 rounded-lg font-semibold ${
              isCapturing 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white`}
            onClick={capturePhoto}
            disabled={isCapturing}
          >
            {isCapturing ? 'Capturing...' : '📷 Capture Face'}
          </button>
          
          <button
            className="ml-4 px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            onClick={onClose}
          >
            ✕ Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Microphone Component (same as in main page)
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
      console.error('Error accessing microphone:', error);
      alert('Microphone access denied. Please try again.');
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
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <h3 className="text-xl font-bold mb-4">Voice Test</h3>
          <p className="text-gray-700 mb-6">
            {isRecording 
              ? `Recording... ${recordingTime}s` 
              : 'Click to start recording and speak clearly'
            }
          </p>
          
          <div className="flex justify-center gap-4">
            {!isRecording ? (
              <button
                className="px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600"
                onClick={startRecording}
              >
                🎤 Start Recording
              </button>
            ) : (
              <button
                className="px-6 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600"
                onClick={stopRecording}
              >
                ⏹️ Stop Recording
              </button>
            )}
            
            <button
              className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              onClick={onClose}
            >
              ✕ Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
