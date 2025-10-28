'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Neurologist {
  name: string;
  place_id: string;
  vicinity: string;
  rating: number;
  user_ratings_total: number;
  price_level?: number;
  opening_hours?: {
    open_now: boolean;
  };
  formatted_address?: string;
  formatted_phone_number?: string;
  website?: string;
}

export default function NeurologistFinderPage() {
  const [neurologists, setNeurologists] = useState<Neurologist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isMockData, setIsMockData] = useState(false);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationError('Unable to get your location. Please enable location services.');
        }
      );
    } else {
      setLocationError('Geolocation is not supported by this browser.');
    }
  }, []);

  const searchNearbyNeurologists = async () => {
    if (!userLocation) {
      setError('Location not available. Please enable location services.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use our server-side API route to avoid CORS issues
      const response = await fetch(
        `/api/neurologists?query=neurologist&location=${userLocation.lat},${userLocation.lng}&radius=50000`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to search for neurologists');
      }

      const data = await response.json();

      if (data.success) {
        setNeurologists(data.neurologists);
        setIsMockData(data.mock || false);
      } else {
        throw new Error(data.error || 'Failed to search for neurologists');
      }

    } catch (error) {
      console.error('Error searching for neurologists:', error);
      setError(error instanceof Error ? error.message : 'Failed to search for neurologists');
    } finally {
      setLoading(false);
    }
  };

  const openInMaps = (placeId: string) => {
    if (placeId.startsWith('mock_')) {
      // For mock data, open a general search for neurologists
      window.open('https://www.google.com/maps/search/neurologist+near+me', '_blank');
    } else {
      window.open(`https://www.google.com/maps/place/?q=place_id:${placeId}`, '_blank');
    }
  };

  const callNeurologist = (phoneNumber: string) => {
    window.open(`tel:${phoneNumber}`, '_self');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/test" className="text-blue-600 hover:text-blue-800 text-lg font-medium mb-4 inline-block">
            ← Back to Assessment
          </Link>
          <h1 className="text-5xl font-bold text-red-600 mb-4">⚠️ Immediate Medical Attention Required</h1>
          <p className="text-xl text-gray-700 mb-6">
            Based on your BEFAST assessment, you may be experiencing stroke symptoms.
          </p>
        </div>


        {/* Search Button */}
        <div className="text-center mb-8">
          <button
            onClick={searchNearbyNeurologists}
            disabled={loading || !userLocation}
            className={`px-8 py-4 text-xl font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-2xl ${
              loading || !userLocation
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {loading ? '🔍 Searching...' : '🏥 Find Nearby Neurologists'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-8">
            <p className="text-red-800 font-semibold">❌ Error: {error}</p>
            <p className="text-red-600 text-sm mt-2">
              Please check your Google Places API key configuration or try again later.
            </p>
          </div>
        )}

        {/* Neurologists List */}
        {neurologists.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800 text-center mb-8">
              🏥 Nearby Neurologists ({neurologists.length} found)
            </h2>
            
            
            {neurologists.map((neurologist, index) => (
              <div key={neurologist.place_id} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                      {index + 1}. {neurologist.name}
                    </h3>
                    
                    <div className="space-y-2 mb-4">
                      <p className="text-gray-600">
                        📍 {neurologist.formatted_address || neurologist.vicinity}
                      </p>
                      
                      {neurologist.formatted_phone_number && (
                        <p className="text-gray-600">
                          📞 {neurologist.formatted_phone_number}
                        </p>
                      )}
                      
                      {neurologist.website && (
                        <p className="text-gray-600">
                          🌐 <a href={neurologist.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            Visit Website
                          </a>
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-4 mb-4">
                      {neurologist.rating && (
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">⭐</span>
                          <span className="font-semibold">{neurologist.rating}</span>
                          <span className="text-gray-500">
                            ({neurologist.user_ratings_total} reviews)
                          </span>
                        </div>
                      )}
                      
                      {neurologist.price_level && (
                        <div className="text-gray-600">
                          💰 Price Level: {'$'.repeat(neurologist.price_level)}
                        </div>
                      )}
                      
                      {neurologist.opening_hours && (
                        <div className={`font-semibold ${
                          neurologist.opening_hours.open_now ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {neurologist.opening_hours.open_now ? '🟢 Open Now' : '🔴 Closed'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => openInMaps(neurologist.place_id)}
                      className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      🗺️ Directions
                    </button>
                    
                    {neurologist.formatted_phone_number && (
                      <button
                        onClick={() => callNeurologist(neurologist.formatted_phone_number!)}
                        className="px-6 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors"
                      >
                        📞 Call Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Emergency Notice */}
        <div className="mt-12 bg-red-100 border-2 border-red-300 rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">🚨</div>
          <h2 className="text-3xl font-bold text-red-800 mb-4">Emergency Notice</h2>
          <p className="text-red-700 text-xl font-semibold mb-4">
            If you're experiencing stroke symptoms, don't wait!
          </p>
          <div className="space-y-2 text-red-600">
            <p>• Call 108 immediately</p>
            <p>• Don't drive yourself to the hospital</p>
            <p>• Note the time when symptoms started</p>
            <p>• Stay calm and follow emergency operator instructions</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-600">
          <p className="text-lg">Powered by Google Places API</p>
          <p className="text-sm mt-2">This tool helps you find nearby medical professionals for emergency situations</p>
        </div>
      </div>
    </div>
  );
}
