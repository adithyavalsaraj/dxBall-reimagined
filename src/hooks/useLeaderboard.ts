
import { useState, useEffect } from 'react';

export interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
}

const DEFAULT_SCORES: LeaderboardEntry[] = [
  { name: "CYBER_PUNK", score: 45200, date: new Date().toISOString() },
  { name: "RETRO_KING", score: 38150, date: new Date().toISOString() },
  { name: "VOID_WALKER", score: 33900, date: new Date().toISOString() },
  { name: "PIXEL_MAGE", score: 29050, date: new Date().toISOString() },
  { name: "NEON_RIDER", score: 24800, date: new Date().toISOString() },
];

export function useLeaderboard() {
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);
  const [currentCallsign, setCurrentCallsign] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchScores = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/leaderboard');
      if (response.ok) {
        const data = await response.json();
        setScores(data.length > 0 ? data : DEFAULT_SCORES);
      } else {
        const text = await response.text();
        console.error(`Leaderboard API Error (${response.status}):`, text);
        throw new Error(`Failed to fetch global scores: ${response.status}`);
      }
    } catch (err) {
      console.error('Leaderboard Fetch Error:', err);
      // Fallback to local storage or defaults
      const saved = localStorage.getItem('dx-ball-highscores');
      setScores(saved ? JSON.parse(saved) : DEFAULT_SCORES);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchScores();

    const savedName = localStorage.getItem('dx-ball-callsign');
    if (savedName) {
      setCurrentCallsign(savedName);
    }
  }, []);

  const addScore = async (name: string, score: number) => {
    const upperName = name.toUpperCase().trim() || 'ANONYMOUS';
    
    // Save callsign locally for convenience
    localStorage.setItem('dx-ball-callsign', upperName);
    setCurrentCallsign(upperName);

    try {
      const response = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: upperName, score }),
      });

      if (response.ok) {
        const updated = await response.json();
        setScores(updated);
        localStorage.setItem('dx-ball-highscores', JSON.stringify(updated));
      } else {
        throw new Error('Failed to submit score');
      }
    } catch (err) {
      console.error('Leaderboard Submit Error:', err);
      // Local fallback
      const existingIndex = scores.findIndex(s => s.name === upperName);
      let updated = [...scores];
      const newEntry = { name: upperName, score, date: new Date().toISOString() };

      if (existingIndex !== -1) {
        if (score > scores[existingIndex].score) updated[existingIndex] = newEntry;
      } else {
        updated.push(newEntry);
      }

      updated = updated.sort((a, b) => b.score - a.score).slice(0, 10);
      setScores(updated);
      localStorage.setItem('dx-ball-highscores', JSON.stringify(updated));
    }
  };

  const isHighScore = (score: number) => {
    if (score <= 0) return false;
    if (scores.length < 10) return true;
    return score > scores[scores.length - 1].score;
  };

  return { scores, addScore, isHighScore, currentCallsign, isLoading, refresh: fetchScores };
}
