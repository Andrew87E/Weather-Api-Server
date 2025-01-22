// src/services/apiTracker.ts
import { PrismaClient } from '@prisma/client';
import { redis } from './redis';

const prisma = new PrismaClient();
const PIRATE_SKY_LIMIT = 9500; // Buffer zone before 10,000 limit
const CACHE_KEY_PREFIX = 'api_calls:';

export class ApiTracker {
    static async incrementAndCheck(service: 'pirate-sky' | 'openweather'): Promise<boolean> {
        const now = new Date();
        const monthKey = `${CACHE_KEY_PREFIX}${service}:${now.getFullYear()}-${now.getMonth() + 1}`;

        // Increment monthly counter in Redis
        const currentCalls = await redis.incr(monthKey);

        // Set expiration for Redis key at the end of the month
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const ttlSeconds = Math.floor((lastDayOfMonth.getTime() - now.getTime()) / 1000);
        await redis.expire(monthKey, ttlSeconds);

        // Update database every 100 calls
        if (currentCalls % 100 === 0) {
            const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            await prisma.apiUsage.upsert({
                where: {
                    service_month: {
                        service,
                        month: firstOfMonth
                    }
                },
                update: {
                    calls: currentCalls,
                    updatedAt: now
                },
                create: {
                    service,
                    month: firstOfMonth,
                    calls: currentCalls
                }
            });
        }

        // Check if we can use the service
        if (service === 'pirate-sky') {
            return currentCalls < PIRATE_SKY_LIMIT;
        }

        return true; // Always allow OpenWeather as fallback
    }

    static async getCurrentUsage(): Promise<Record<string, number>> {
        const now = new Date();
        const monthKey = now.getFullYear() + '-' + (now.getMonth() + 1);

        // Get current usage from Redis
        const pirateKey = `${CACHE_KEY_PREFIX}pirate-sky:${monthKey}`;
        const openWeatherKey = `${CACHE_KEY_PREFIX}openweather:${monthKey}`;

        const [pirateCalls, openWeatherCalls] = await Promise.all([
            redis.get(pirateKey),
            redis.get(openWeatherKey)
        ]);

        return {
            'pirate-sky': parseInt(pirateCalls || '0'),
            'openweather': parseInt(openWeatherCalls || '0')
        };
    }
}