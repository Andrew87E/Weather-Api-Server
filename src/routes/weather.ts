import { Router } from 'express';
import { getWeatherData } from '../services/weather';
import { redis } from '../services/redis';

const router = Router();

router.get('/:lat/:lon', async (req, res) => {
  try {
    const { lat, lon } = req.params;
    const cacheKey = `weather:${lat}:${lon}`;

    // Check cache first
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    // Fetch fresh data
    const weatherData = await getWeatherData(lat, lon);

    // Cache the result
    await redis.setex(cacheKey, 300, JSON.stringify(weatherData)); // 5 min TTL

    res.json(weatherData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

export { router as weatherRouter };

