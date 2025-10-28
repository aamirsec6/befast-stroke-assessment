'use client';

import React from 'react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-gray-800 mb-6">
            B.E.F.A.S.T.
          </h1>
          <h2 className="text-3xl font-semibold text-gray-700 mb-4">
            Stroke Assessment Tool
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            A comprehensive AI-powered stroke assessment tool that helps detect stroke symptoms 
            through facial analysis, speech evaluation, and interactive questionnaires.
          </p>
        </div>

        {/* Main CTA */}
        <div className="text-center mb-16">
          <Link href="/test">
            <button className="px-12 py-6 bg-red-600 text-white font-bold text-2xl rounded-2xl hover:bg-red-700 transition-all duration-300 transform hover:scale-105 shadow-2xl">
              🚀 Start Stroke Assessment
            </button>
          </Link>
          <p className="text-gray-600 mt-4 text-lg">
            Quick, accurate, and AI-enhanced stroke detection
          </p>
            </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-center">
              <div className="text-4xl mb-4">📷</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Face Analysis</h3>
              <p className="text-gray-600">
                AI-powered facial asymmetry detection using advanced computer vision 
                to identify potential stroke-related facial drooping.
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-center">
              <div className="text-4xl mb-4">🎤</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Voice Analysis</h3>
              <p className="text-gray-600">
                Real-time speech analysis with offline processing to detect slurred speech 
                and communication difficulties associated with stroke.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-center">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Instant Results</h3>
              <p className="text-gray-600">
                Get immediate risk assessment with detailed analysis and recommendations 
                for immediate medical attention if needed.
              </p>
            </div>
          </div>
        </div>

        {/* B.E.F.A.S.T. Explanation */}
        <div className="bg-white rounded-2xl p-8 shadow-lg mb-16">
          <h3 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            What is B.E.F.A.S.T.?
          </h3>
          <div className="grid md:grid-cols-5 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-red-600 mb-2">B</div>
              <h4 className="font-semibold text-gray-800 mb-2">Balance</h4>
              <p className="text-sm text-gray-600">Loss of balance or coordination</p>
                    </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-red-600 mb-2">E</div>
              <h4 className="font-semibold text-gray-800 mb-2">Eyes</h4>
              <p className="text-sm text-gray-600">Vision loss in one or both eyes</p>
                    </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-red-600 mb-2">F</div>
              <h4 className="font-semibold text-gray-800 mb-2">Face</h4>
              <p className="text-sm text-gray-600">Facial drooping on one side</p>
                </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-red-600 mb-2">A</div>
              <h4 className="font-semibold text-gray-800 mb-2">Arms</h4>
              <p className="text-sm text-gray-600">Arm weakness or drift</p>
                </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-red-600 mb-2">S</div>
              <h4 className="font-semibold text-gray-800 mb-2">Speech</h4>
              <p className="text-sm text-gray-600">Slurred or unclear speech</p>
            </div>
          </div>
          <div className="text-center mt-6">
            <div className="text-4xl font-bold text-red-600 mb-2">T</div>
            <h4 className="font-semibold text-gray-800 mb-2">Time</h4>
            <p className="text-sm text-gray-600">Time to call emergency services</p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white mb-16">
          <h3 className="text-3xl font-bold mb-6 text-center">How It Works</h3>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-3">1️⃣</div>
              <h4 className="font-semibold mb-2">Answer Questions</h4>
              <p className="text-sm opacity-90">Complete the B.E.F.A.S.T. questionnaire</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-3">2️⃣</div>
              <h4 className="font-semibold mb-2">AI Analysis</h4>
              <p className="text-sm opacity-90">Use face and voice analysis tools</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-3">3️⃣</div>
              <h4 className="font-semibold mb-2">Get Results</h4>
              <p className="text-sm opacity-90">Receive instant risk assessment</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-3">4️⃣</div>
              <h4 className="font-semibold mb-2">Take Action</h4>
              <p className="text-sm opacity-90">Follow recommendations for care</p>
            </div>
        </div>
        </div>

        {/* Emergency Notice */}
        <div className="bg-red-100 border-2 border-red-300 rounded-2xl p-6 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-2xl font-bold text-red-800 mb-3">
            Emergency Notice
          </h3>
          <p className="text-red-700 text-lg font-medium">
            If you or someone you know is experiencing stroke symptoms, 
            <span className="font-bold"> call 108 immediately</span>. 
            This tool is for assessment purposes only and should not replace emergency medical care.
          </p>
        </div>

      </div>
    </div>
  );
}