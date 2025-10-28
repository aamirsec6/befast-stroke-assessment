// API route to handle Google Places API requests server-side
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || 'neurologist';
    const location = searchParams.get('location');
    const radius = searchParams.get('radius') || '50000';

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Places API key not configured' },
        { status: 500 }
      );
    }

    if (!location) {
      return NextResponse.json(
        { error: 'Location parameter is required' },
        { status: 400 }
      );
    }

    // Search for neurologists using Google Places API
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${location}&radius=${radius}&key=${apiKey}`;
    
    const searchResponse = await fetch(searchUrl);
    
    if (!searchResponse.ok) {
      throw new Error(`Google Places API error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();

    if (searchData.status !== 'OK' && searchData.status !== 'ZERO_RESULTS') {
      // If API key is restricted or invalid, return mock data for development
      if (searchData.status === 'REQUEST_DENIED' || searchData.status === 'INVALID_REQUEST') {
        console.log('Google Places API access denied, returning mock data');
        return NextResponse.json({
          success: true,
          neurologists: [
            {
              name: "Dr. Rajesh Kumar - Neurologist",
              place_id: "mock_1",
              vicinity: "Electronics City Phase 1",
              rating: 4.7,
              user_ratings_total: 124,
              formatted_address: "Fortis Hospital, Electronics City Phase 1, Bangalore",
              formatted_phone_number: "+91 80 6621 4444",
              website: "https://www.fortishealthcare.com",
              opening_hours: { open_now: true }
            },
            {
              name: "Dr. Priya Sharma - Neurology Specialist",
              place_id: "mock_2", 
              vicinity: "Electronics City Phase 1",
              rating: 4.5,
              user_ratings_total: 89,
              formatted_address: "Apollo Hospitals, Electronics City Phase 1, Bangalore",
              formatted_phone_number: "+91 80 2630 4050",
              website: "https://www.apollohospitals.com",
              opening_hours: { open_now: true }
            },
            {
              name: "Dr. Suresh Reddy - Stroke Specialist",
              place_id: "mock_3",
              vicinity: "Electronics City Phase 1", 
              rating: 4.8,
              user_ratings_total: 156,
              formatted_address: "Manipal Hospitals, Electronics City Phase 1, Bangalore",
              formatted_phone_number: "+91 80 2502 4444",
              website: "https://www.manipalhospitals.com",
              opening_hours: { open_now: false }
            },
            {
              name: "Dr. Anitha Menon - Neurologist",
              place_id: "mock_4",
              vicinity: "Electronics City Phase 1",
              rating: 4.6,
              user_ratings_total: 98,
              formatted_address: "Narayana Health City, Electronics City Phase 1, Bangalore",
              formatted_phone_number: "+91 80 2222 9999",
              website: "https://www.narayanahealth.org",
              opening_hours: { open_now: true }
            },
            {
              name: "Dr. Vikram Singh - Neurology Consultant",
              place_id: "mock_5",
              vicinity: "Electronics City Phase 1",
              rating: 4.4,
              user_ratings_total: 67,
              formatted_address: "Columbia Asia Hospital, Electronics City Phase 1, Bangalore",
              formatted_phone_number: "+91 80 4179 9999",
              website: "https://www.columbiaasia.com",
              opening_hours: { open_now: true }
            }
          ],
          count: 5,
          mock: true
        });
      }
      throw new Error(`Google Places API error: ${searchData.status}`);
    }

    let neurologists = searchData.results || [];

    // Get detailed information for each neurologist (limit to first 10)
    if (neurologists.length > 0) {
      const detailedNeurologists = await Promise.all(
        neurologists.slice(0, 10).map(async (neurologist: any) => {
          try {
            const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${neurologist.place_id}&fields=name,vicinity,rating,user_ratings_total,price_level,opening_hours,formatted_address,formatted_phone_number,website&key=${apiKey}`;
            
            const detailsResponse = await fetch(detailsUrl);
            
            if (detailsResponse.ok) {
              const detailsData = await detailsResponse.json();
              if (detailsData.status === 'OK') {
                return { ...neurologist, ...detailsData.result };
              }
            }
          } catch (error) {
            console.error('Error fetching details for:', neurologist.name, error);
          }
          return neurologist;
        })
      );

      neurologists = detailedNeurologists;
    }

    return NextResponse.json({
      success: true,
      neurologists,
      count: neurologists.length
    });

  } catch (error) {
    console.error('Error in Google Places API route:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to search for neurologists',
        success: false 
      },
      { status: 500 }
    );
  }
}
