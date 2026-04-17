
import { useEffect, useRef, useState } from 'react';
import { BallGameEngine, GameState } from '../lib/game/engine';
import { parseLevel } from '../lib/game/levels';
import { soundService } from '../lib/game/audio';

export function useGameLoop() {
  const engineRef = useRef<BallGameEngine | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const prevLevelRef = useRef<number>(0);

  useEffect(() => {
    const initialBricks = parseLevel(0);
    const engine = new BallGameEngine(initialBricks);
    
    // Wire up sound events
    engine.onEvent = (event) => {
      switch (event) {
        case 'hit_brick': soundService.playBrickHit(); break;
        case 'hit_paddle': soundService.playPaddleHit(); break;
        case 'hit_wall': soundService.playWallHit(); break;
        case 'lose_life': soundService.playLoseLife(); break;
        case 'game_over': soundService.playGameOver(); break;
        case 'level_start': soundService.playLevelStart(); break;
      }
    };

    engineRef.current = engine;
    setGameState({ ...engine.state });

    const animate = (time: number) => {
      if (lastTimeRef.current !== undefined) {
        const deltaTime = time - lastTimeRef.current;
        engine.update(deltaTime);
        
        // Level change detection
        if (engine.state.level > prevLevelRef.current) {
            engine.state.bricks = parseLevel(engine.state.level);
            engine.resetBall();
            prevLevelRef.current = engine.state.level;
            soundService.playLevelStart();
        }

        setGameState({ ...engine.state });
      }
      lastTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  const movePaddle = (x: number) => {
    if (engineRef.current) {
      engineRef.current.setPaddlePos(x);
    }
  };

  const startGame = () => {
    if (engineRef.current) {
      if (engineRef.current.state.isGameOver) {
          // Restart logic
          engineRef.current.state.isGameOver = false;
          engineRef.current.state.lives = 3;
          engineRef.current.state.score = 0;
          engineRef.current.state.bricks = parseLevel(engineRef.current.state.level);
          engineRef.current.resetBall();
      }
      engineRef.current.state.isPaused = false;
    }
  };

  return {
    gameState,
    movePaddle,
    startGame,
    togglePause: () => engineRef.current?.togglePause(),
  };
}
