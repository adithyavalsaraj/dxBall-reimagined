import { useCallback, useEffect, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import { Zap } from 'lucide-react';
import GameCanvas from './components/game/GameCanvas';
import { useGameLoop } from './hooks/useGameLoop';
import { GAME_WIDTH } from './lib/game/constants';

import { soundService } from './lib/game/audio';

export default function App() {
  const { gameState, movePaddle, startGame, togglePause } = useGameLoop();

  const handlePointerMove = useCallback((e: ReactMouseEvent | ReactTouchEvent) => {
    soundService.init();
    let clientX;
    if ('touches' in e && (e as ReactTouchEvent).touches[0]) {
      clientX = (e as ReactTouchEvent).touches[0].clientX;
    } else {
      clientX = (e as ReactMouseEvent).clientX;
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = clientX - rect.left;
    const scaledX = (x / rect.width) * GAME_WIDTH;
    movePaddle(scaledX - (gameState?.paddle.width || 120) / 2);
  }, [movePaddle, gameState?.paddle.width]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const step = 40;
      if (gameState) {
        if (e.key === 'ArrowLeft' || e.key === 'a') {
          movePaddle(gameState.paddle.x - step);
        } else if (e.key === 'ArrowRight' || e.key === 'd') {
          movePaddle(gameState.paddle.x + step);
        } else if (e.key === ' ') {
          if (gameState.isPaused || gameState.isGameOver) startGame();
          else togglePause();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, movePaddle, startGame, togglePause]);

  return (
    <div className="min-h-screen bg-[#08090a] text-[#e0e0e0] font-sans flex items-center justify-center p-4">
      <div className="grid grid-cols-[240px_1fr_240px] grid-rows-[80px_1fr_140px] gap-4 w-full max-w-[1200px] h-[800px]">
        
        {/* Header Bento */}
        <div className="bento-card col-span-3 flex items-center justify-between px-8">
          <div className="text-2xl font-extrabold tracking-widest uppercase bg-gradient-to-r from-[#00d2ff] to-[#ff007a] bg-clip-text text-transparent italic">
            DX-BALL // NEON
          </div>
          <div className="flex gap-10">
            <div className="text-center">
              <div className="text-[10px] uppercase text-[#888] tracking-widest mb-1">Score</div>
              <div className="text-xl font-bold font-mono">{(gameState?.score || 0).toString().padStart(6, '0')}</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] uppercase text-[#888] tracking-widest mb-1">High Score</div>
              <div className="text-xl font-bold font-mono text-white">045,000</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] uppercase text-[#888] tracking-widest mb-1">Lives</div>
              <div className="text-xl font-bold text-[#ff007a]">
                {Array.from({ length: gameState?.lives || 0 }).map(() => '▲ ').join('')}
              </div>
            </div>
          </div>
        </div>

        {/* Left Sidebar Bento */}
        <div className="bento-card row-start-2 p-6 flex flex-col gap-8">
          <div>
            <div className="text-[10px] uppercase text-[#888] tracking-widest mb-1">Current Level</div>
            <div className="text-lg font-bold">0{(gameState?.level || 0) + 1}: NEON CORE</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-[#888] tracking-widest mb-1">Multipliers</div>
            <div className="text-3xl font-bold text-[#39ff14]">x2.5</div>
          </div>
          <div className="mt-auto">
            <div className="text-[10px] uppercase text-[#888] tracking-widest mb-1">Difficulty</div>
            <div className="flex gap-1 mt-2">
              <div className="h-1 flex-1 bg-[#00d2ff]"></div>
              <div className="h-1 flex-1 bg-[#00d2ff]"></div>
              <div className="h-1 flex-1 bg-[#333]"></div>
            </div>
          </div>
        </div>

        {/* Main Game Center */}
        <div className="row-start-2 col-start-2 bg-black border-2 border-[#00d2ff]/30 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(0,210,255,0.1)] relative">
          <GameCanvas 
            gameState={gameState} 
            onMouseMove={handlePointerMove}
            onClick={() => {
                soundService.init();
                startGame();
            }}
          />
        </div>

        {/* Right Sidebar Bento */}
        <div className="bento-card row-start-2 p-6 flex flex-col">
          <div className="text-sm font-bold text-[#ff007a] mb-4 uppercase tracking-wider">Global Rankings</div>
          <div className="space-y-3">
            {[
              { name: '1. CYBER_PUNK', score: '45,200' },
              { name: '2. RETRO_KING', score: '38,150' },
              { name: '3. VOID_WALKER', score: '33,900' },
              { name: '4. PIXEL_MAGE', score: '29,050' },
              { name: '5. NEON_RIDER', score: '24,800' },
            ].map((entry, i) => (
              <div key={i} className="flex justify-between text-xs font-mono">
                <span className="text-[#888]">{entry.name}</span>
                <span className="font-bold">{entry.score}</span>
              </div>
            ))}
          </div>
          <div className="mt-auto text-[10px] text-[#888] text-center italic">
            Season 12 ends in 4 days
          </div>
        </div>

        {/* Footer Controls Bento */}
        <div className="bento-card col-span-2 row-start-3 flex items-center px-10 gap-12">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <div className="key-cap">←</div><div className="key-cap">→</div>
            </div>
            <span className="text-[10px] uppercase text-[#888] tracking-widest font-mono">Move Paddle</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="key-cap">SPACE</div>
            <span className="text-[10px] uppercase text-[#888] tracking-widest font-mono">Launch Ball</span>
          </div>
          <div className="flex items-center gap-3 text-cyan-400">
            <Zap size={16} />
            <span className="text-[10px] uppercase tracking-widest font-mono">High Energy Mode Active</span>
          </div>
        </div>

        {/* Inventory Bento */}
        <div className="bento-card col-start-3 row-start-3 flex items-center justify-center gap-3">
          <div className="w-12 h-12 border-2 border-[#39ff14] text-[#39ff14] rounded-xl flex items-center justify-center text-xl shadow-[0_0_10px_rgba(57,255,20,0.3)] bg-[#39ff14]/5">★</div>
          <div className="w-12 h-12 border-2 border-white/5 text-[#333] rounded-xl flex items-center justify-center text-xl">◈</div>
          <div className="w-12 h-12 border-2 border-white/5 text-[#333] rounded-xl flex items-center justify-center text-xl">⚄</div>
        </div>

      </div>
    </div>
  );
}
