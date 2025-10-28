# Google Places API Setup Guide

## Current Status
✅ **API Key Added**: Your Google Places API key is configured
❌ **API Access Denied**: The API key needs proper restrictions configuration

## The Issue
The Google Places API is returning "REQUEST_DENIED" because the API key needs to be configured with proper restrictions and enabled APIs.

## How to Fix This

### Step 1: Go to Google Cloud Console
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)

### Step 2: Enable Required APIs
1. Go to "APIs & Services" > "Library"
2. Search for and enable these APIs:
   - **Places API**
   - **Maps JavaScript API**
   - **Geocoding API**

### Step 3: Configure API Key Restrictions
1. Go to "APIs & Services" > "Credentials"
2. Click on your API key
3. Under "Application restrictions":
   - Select "HTTP referrers (web sites)"
   - Add these referrers:
     - `http://localhost:3001/*`
     - `http://localhost:3000/*`
     - `https://yourdomain.com/*` (for production)
4. Under "API restrictions":
   - Select "Restrict key"
   - Choose these APIs:
     - Places API
     - Maps JavaScript API
     - Geocoding API

### Step 4: Billing Setup
1. Go to "Billing" in Google Cloud Console
2. Link a billing account to your project
3. Google Places API requires billing to be enabled

### Step 5: Test the Configuration
1. Wait 5-10 minutes for changes to propagate
2. Test the neurologist finder again
3. Check the browser console for any remaining errors

## Current Demo Mode
While the API key is being configured, the application shows **sample neurologist data** so you can:
- ✅ Test the complete user flow
- ✅ See how the interface works
- ✅ Experience the emergency features
- ✅ Use all other BEFAST assessment features

## Production Deployment
For production deployment, you'll also need to:
1. Add your production domain to API key restrictions
2. Consider using server-side API calls for better security
3. Implement rate limiting and error handling
4. Add proper logging and monitoring

## Troubleshooting
- **REQUEST_DENIED**: API not enabled or restrictions too strict
- **INVALID_REQUEST**: Missing required parameters
- **OVER_QUERY_LIMIT**: Billing not set up or quota exceeded
- **ZERO_RESULTS**: No neurologists found in the area (try larger radius)

## Cost Information
- Google Places API has usage-based pricing
- Text Search: $32 per 1,000 requests
- Place Details: $17 per 1,000 requests
- First $200 of usage per month is free

## Security Best Practices
- Never expose API keys in client-side code
- Use server-side API calls when possible
- Implement proper rate limiting
- Monitor API usage regularly
- Rotate API keys periodically