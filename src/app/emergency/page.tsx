'use client';

import React from 'react';

export default function EmergencyPage() {
  const callEmergency = () => {
    // In a real app, this would trigger actual emergency call
    window.open('tel:108');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100">
      <div className="container mx-auto px-4 py-8">
        {/* Emergency Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🚨</div>
          <h1 className="text-5xl font-bold text-red-800 mb-4">EMERGENCY</h1>
          <h2 className="text-3xl font-bold text-red-700 mb-2">T.I.M.E. - Time is Critical</h2>
          <p className="text-xl text-red-600">Stroke symptoms detected - Immediate action required</p>
        </div>

        {/* Emergency Instructions */}
        <div className="bg-white rounded-2xl p-8 shadow-xl mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Immediate Actions Required:</h3>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h4 className="text-xl font-semibold text-gray-800 mb-2">Call Emergency Services</h4>
                <p className="text-gray-600">Dial 108 immediately. Time is critical for stroke treatment.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h4 className="text-xl font-semibold text-gray-800 mb-2">Note the Time</h4>
                <p className="text-gray-600">Record when symptoms first appeared. This is crucial for treatment decisions.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h4 className="text-xl font-semibold text-gray-800 mb-2">Stay Calm</h4>
                <p className="text-gray-600">Keep the person calm and comfortable while waiting for emergency services.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h4 className="text-xl font-semibold text-gray-800 mb-2">Do NOT Give Food or Water</h4>
                <p className="text-gray-600">Avoid giving anything to eat or drink as it may cause choking.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Call Button */}
        <div className="text-center mb-8">
          <button
            onClick={callEmergency}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-6 px-12 rounded-2xl text-2xl shadow-2xl transform hover:scale-105 transition-all duration-200"
          >
            📞 CALL 108 NOW
          </button>
        </div>

        {/* Stroke Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
          <h3 className="text-xl font-bold text-blue-800 mb-4">Why Time Matters:</h3>
          <ul className="space-y-2 text-blue-700">
            <li>• <strong>Golden Hour:</strong> Best treatment outcomes within 1 hour</li>
            <li>• <strong>Clot-Busting Drugs:</strong> Most effective within 3-4.5 hours</li>
            <li>• <strong>Every Minute Counts:</strong> 1.9 million brain cells die per minute during stroke</li>
            <li>• <strong>Early Treatment:</strong> Reduces disability and improves recovery</li>
          </ul>
        </div>

        {/* Additional Resources */}
        <div className="bg-gray-50 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Additional Resources:</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">American Stroke Association</h4>
              <p className="text-sm text-gray-600">1-888-4STROKE (1-888-478-7653)</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">National Stroke Association</h4>
              <p className="text-sm text-gray-600">1-800-STROKES (1-800-787-6537)</p>
            </div>
          </div>
        </div>

        {/* Back to Assessment */}
        <div className="text-center mt-8">
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            ← Back to Assessment
          </button>
        </div>
      </div>
    </div>
  );
}
