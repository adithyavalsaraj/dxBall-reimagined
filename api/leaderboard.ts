
import Redis from 'ioredis';

// Initialize Redis client using the standard REDIS_URL
const redis = new Redis(process.env.REDIS_URL || '');

const LEADERBOARD_KEY = 'dx-ball-leaderboard';

export default async function handler(req: any, res: any) {
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
    if (!process.env.REDIS_URL) {
      throw new Error('REDIS_URL is missing. Please ensure it is set in Vercel environment variables.');
    }

    if (req.method === 'GET') {
      const data = await redis.get(LEADERBOARD_KEY);
      const scores = data ? JSON.parse(data) : [];
      return res.status(200).json(scores);
    }

    if (req.method === 'POST') {
      const { name, score } = req.body;
      
      if (!name || typeof score !== 'number') {
        return res.status(400).json({ error: 'Invalid name or score' });
      }

      const upperName = name.toUpperCase().trim();
      const data = await redis.get(LEADERBOARD_KEY);
      let scores: any[] = data ? JSON.parse(data) : [];
      
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
      await redis.set(LEADERBOARD_KEY, JSON.stringify(scores));
      
      return res.status(200).json(scores);
    }
  } catch (error: any) {
    console.error('Leaderboard API Error:', error);
    return res.status(500).json({ 
      error: error.message,
      hasRedisUrl: !!process.env.REDIS_URL
    });
  }
}
