import axios from 'axios';
import { generateWeatherKitToken } from '../utils/jwt';

export async function getWeatherData(lat: string, lon: string) {
  const useWeatherKit = process.env.USE_WEATHER_KIT === 'true';

  if (useWeatherKit) {
    const token = generateWeatherKitToken();
    const response = await axios.get(
      `https://weatherkit.apple.com/api/v1/weather/${lat}/${lon}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.data;
  } else {
    const response = await axios.get(
      `https://api.openweathermap.org/data/3.0/onecall`,
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
    return response.data;
  }
}


