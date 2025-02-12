import { createClient } from 'redis';

let redisClient;

const initRedisClient = async () => {
    if (!redisClient) {
        const redisHost = process.env.REDISHOST || 'localhost';
        const redisPort = process.env.REDISPORT || 6379;

        redisClient = createClient({
            url: `redis://${redisHost}:${redisPort}`
        });

        redisClient.on('error', (err) => {
            console.error('Redis connection error:', err);
        });

        // console.log('Redis Host:', redisHost);
        // console.log('Redis Port:', redisPort);

        try {
            await redisClient.connect();
            console.log('Redis connected successfully.');
        } catch (err) {
            console.error('Error connecting to Redis:', err);
        }
    }
    return redisClient;
};

export const redisClientSet = async (key, value, ttl = 5) => {
    const client = await initRedisClient();
    // console.log(client);
    try {
        await client.set(key, JSON.stringify(value), { EX: ttl }); // Serialize value to JSON string
        console.log(`Successfully set ${key} in Redis.`);
    } catch (error) {
        console.error('Error setting value in Redis:', error);
    }
};

export const redisClientGet = async (key) => {
    const client = await initRedisClient();
    try {
        const value = await client.get(key);
        console.log(`Retrieved ${key} from Redis: ${value}`);
        return value;
    } catch (error) {
        console.error('Error getting value from Redis:', error);
        return null;
    }
};