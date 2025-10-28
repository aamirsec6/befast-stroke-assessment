// Google Maps Places API service for finding nearby hospitals
export interface Hospital {
  id: string;
  name: string;
  address: string;
  distance: number;
  rating: number;
  phone?: string;
  website?: string;
}

class MapsService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  }

  async findNearbyHospitals(latitude: number, longitude: number, radius: number = 5000): Promise<Hospital[]> {
    if (!this.apiKey) {
      console.warn('Google Maps API key not found, returning mock data');
      return this.getMockHospitals();
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=hospital&key=${this.apiKey}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Google Places API error: ${data.status}`);
      }

      return data.results.map((place: any, index: number) => ({
        id: place.place_id || `hospital_${index}`,
        name: place.name || 'Unknown Hospital',
        address: place.vicinity || 'Address not available',
        distance: this.calculateDistance(latitude, longitude, place.geometry.location.lat, place.geometry.location.lng),
        rating: place.rating || 0,
        phone: place.formatted_phone_number,
        website: place.website,
      })).sort((a: Hospital, b: Hospital) => a.distance - b.distance);

    } catch (error) {
      console.error('Error fetching nearby hospitals:', error);
      return this.getMockHospitals();
    }
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return Math.round(distance * 1000); // Convert to meters
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private getMockHospitals(): Hospital[] {
    return [
      {
        id: 'hospital_1',
        name: 'City General Hospital',
        address: '123 Medical Center Dr, City, State 12345',
        distance: 1200,
        rating: 4.2,
        phone: '(555) 123-4567',
        website: 'https://citygeneral.com',
      },
      {
        id: 'hospital_2',
        name: 'Regional Medical Center',
        address: '456 Health Ave, City, State 12345',
        distance: 2100,
        rating: 4.5,
        phone: '(555) 234-5678',
        website: 'https://regionalmedical.com',
      },
      {
        id: 'hospital_3',
        name: 'Emergency Care Clinic',
        address: '789 Urgent St, City, State 12345',
        distance: 3400,
        rating: 3.8,
        phone: '(555) 345-6789',
      },
    ];
  }
}

export const mapsService = new MapsService();
