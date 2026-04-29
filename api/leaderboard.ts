
import { Redis } from '@upstash/redis';

const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) 
  ? Redis.fromEnv() 
  : new Redis({
      url: process.env.KV_REST_API_URL || '',
      token: process.env.KV_REST_API_TOKEN || '',
    });

const LEADERBOARD_KEY = 'dx-ball-leaderboard';

export default async function handler(req: any, res: any) {
  // Log available environment keys (safely)
  console.log('Available Env Keys:', Object.keys(process.env).filter(k => k.includes('REDIS') || k.includes('KV')));

  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Basic connection health check
    if (!process.env.KV_REST_API_URL && !process.env.UPSTASH_REDIS_REST_URL) {
      throw new Error('Redis configuration missing. Please ensure KV_REST_API_URL and KV_REST_API_TOKEN are set in Vercel.');
    }

    if (req.method === 'GET') {
      const scores = await redis.get(LEADERBOARD_KEY);
      return res.status(200).json(scores || []);
    }

    if (req.method === 'POST') {
      const { name, score } = req.body;
      
      if (!name || typeof score !== 'number') {
        return res.status(400).json({ error: 'Invalid name or score' });
      }

      const upperName = name.toUpperCase().trim();
      let scores: any[] = (await redis.get(LEADERBOARD_KEY)) || [];
      
      const newEntry = {
        name: upperName,
        score,
        date: new Date().toISOString(),
      };

      const existingIndex = scores.findIndex((s) => s.name === upperName);
      if (existingIndex !== -1) {
        if (score > scores[existingIndex].score) {
          scores[existingIndex] = newEntry;
        }
      } else {
        scores.push(newEntry);
      }

      scores = scores.sort((a, b) => b.score - a.score).slice(0, 10);
      await redis.set(LEADERBOARD_KEY, scores);
      
      return res.status(200).json(scores);
    }
  } catch (error: any) {
    console.error('Leaderboard API Error:', error);
    return res.status(500).json({ 
      error: error.message,
      keysFound: Object.keys(process.env).filter(k => k.includes('REDIS') || k.includes('KV'))
    });
  }
}
