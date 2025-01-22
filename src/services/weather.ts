import axios from 'axios';
import { ApiTracker } from './apiTracker';
import { redis } from './redis';

interface WeatherResponse {
  currently: any;
  hourly: any;
  daily: any;
  alerts?: any;
  flags: any;
}

const CACHE_TTL = 300; // 5 minutes cache

export async function getWeatherData(lat: string, lon: string) {
  const cacheKey = `weather:${lat}:${lon}`;

  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Try Pirate Weather first
  const canUsePirateWeather = await ApiTracker.incrementAndCheck('pirate-sky');

  if (canUsePirateWeather) {
    try {
      const response = await axios.get<WeatherResponse>(
        `https://api.pirateweather.net/forecast/${process.env.PIRATE_WEATHER_API_KEY}/${lat},${lon}`,
        {
          params: {
            units: 'us', // Imperial units to match OpenWeather
            exclude: 'minutely', // Match OpenWeather's exclude
            version: '2' // Include extended fields
          },
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      // Cache the successful response
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(response.data));

      // Track rate limits from headers
      const remainingCalls = response.headers['ratelimit-remaining'];
      if (remainingCalls) {
        await redis.set('pirate_weather_remaining', remainingCalls);
      }

      return response.data;
    } catch (error: any) {
      console.error('Pirate Weather API error:', error.response?.data || error.message);
      // Fall through to OpenWeather
    }
  }

  // Fallback to OpenWeather
  console.log('Falling back to OpenWeather API');
  await ApiTracker.incrementAndCheck('openweather');

  const response = await axios.get(
    'https://api.openweathermap.org/data/3.0/onecall',
    {
      params: {
        lat,
        lon,
        units: 'imperial',
        appid: process.env.OPENWEATHER_API_KEY,
        exclude: 'minutely'
      }
    }
  );

  // Cache the successful response
  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(response.data));

  return response.data;
}

// Add API usage endpoint
export async function getApiUsage() {
  const usage = await ApiTracker.getCurrentUsage();
  const pirateWeatherRemaining = await redis.get('pirate_weather_remaining');

  return {
    usage,
    pirateWeatherRemaining: pirateWeatherRemaining ? parseInt(pirateWeatherRemaining) : null,
    currentProvider: (usage['pirate-sky'] || 0) < 9500 ? 'Pirate Weather' : 'OpenWeather'
  };
}

// Optional: Add detailed weather response type
export interface WeatherDataResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  offset: number;
  currently: {
    time: number;
    summary: string;
    icon: string;
    precipIntensity: number;
    precipProbability: number;
    temperature: number;
    apparentTemperature: number;
    dewPoint: number;
    humidity: number;
    pressure: number;
    windSpeed: number;
    windGust: number;
    windBearing: number;
    cloudCover: number;
    uvIndex: number;
    visibility: number;
    [key: string]: any;
  };
  hourly?: {
    summary: string;
    icon: string;
    data: Array<{
      time: number;
      [key: string]: any;
    }>;
  };
  daily?: {
    summary: string;
    icon: string;
    data: Array<{
      time: number;
      [key: string]: any;
    }>;
  };
  alerts?: Array<{
    title: string;
    regions: string[];
    severity: string;
    time: number;
    expires: number;
    description: string;
    uri: string;
  }>;
  flags: {
    sources: string[];
    units: string;
    version: string;
    [key: string]: any;
  };
}