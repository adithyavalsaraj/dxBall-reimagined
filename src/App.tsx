import { useCallback, useEffect, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent, useRef } from 'react';
import { Zap, Pause, Play, RotateCcw, LogOut } from 'lucide-react';
import GameCanvas from './components/game/GameCanvas';
import { useGameLoop } from './hooks/useGameLoop';
import { GAME_WIDTH } from './lib/game/constants';
import { soundService } from './lib/game/audio';

export default function App() {
  const { 
    gameState, 
    movePaddle, 
    startGame, 
    togglePause, 
    shoot, 
    resetLevel, 
    quitGame 
  } = useGameLoop();

  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = useCallback((e: ReactMouseEvent | ReactTouchEvent) => {
    soundService.init();
    
    if (document.pointerLockElement) {
      // Pointer lock active - use relative movement
      const movementX = (e.nativeEvent as MouseEvent).movementX || 0;
      if (gameState) {
        movePaddle(gameState.paddle.x + movementX);
      }
    } else {
      // Standard movement for touch or non-locked mouse
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
    }

    // Also try to shoot if the game is active
    if (gameState && !gameState.isPaused && !gameState.isGameOver) {
      shoot();
    }
  }, [movePaddle, gameState, shoot]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const step = 40;
      if (gameState) {
        if (e.key === 'ArrowLeft' || e.key === 'a') {
          movePaddle(gameState.paddle.x - step);
        } else if (e.key === 'ArrowRight' || e.key === 'd') {
          movePaddle(gameState.paddle.x + step);
        } else if (e.key === ' ') {
          if (gameState.isPaused || gameState.isGameOver) {
            startGame();
            // Try to request pointer lock when starting via keyboard too
            const canvas = document.querySelector('canvas');
            canvas?.requestPointerLock();
          } else {
            shoot();
          }
        } else if (e.key === 'p' || e.key === 'Escape') {
          togglePause();
          if (document.pointerLockElement) {
            document.exitPointerLock();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, movePaddle, startGame, togglePause, shoot]);

  return (
    <div className="min-h-screen bg-[#08090a] text-[#e0e0e0] font-sans flex items-center justify-center p-4">
      <div className="grid grid-cols-[240px_1fr_240px] grid-rows-[80px_1fr_140px] gap-4 w-full max-w-[1200px] h-[800px]">
        
        {/* Header Bento */}
        <div className="bento-card col-span-3 flex items-center justify-between px-8 relative">
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
        <div 
          ref={containerRef}
          onContextMenu={(e) => { e.preventDefault(); if (!gameState?.isPaused) togglePause(); }}
          className="row-start-2 col-start-2 bg-black border-2 border-[#00d2ff]/30 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(0,210,255,0.1)] relative"
        >
          <GameCanvas 
            gameState={gameState} 
            onMouseMove={handlePointerMove}
            onClick={() => {
                soundService.init();
                if (gameState?.isGameOver) startGame();
                else if (gameState?.isPaused) startGame();
                else togglePause();
            }}
          />

          {/* Pause Button (Touch/Mobile helper) */}
          {!gameState?.isPaused && !gameState?.isGameOver && (
            <button 
              onClick={(e) => { e.stopPropagation(); togglePause(); }}
              className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 transition-all z-40"
            >
              <Pause size={18} />
            </button>
          )}

          {/* Pause Menu Overlay */}
          {gameState?.isMenuOpen && !gameState?.isGameOver && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-[#14161a] border-2 border-[#00d2ff]/30 p-10 rounded-3xl flex flex-col gap-6 w-[320px] shadow-[0_0_50px_rgba(0,210,255,0.2)]">
                <div className="text-2xl font-black text-center tracking-tighter uppercase italic text-[#00d2ff]">Paused</div>
                
                <button 
                  onClick={startGame}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-[#00d2ff] text-black font-bold rounded-xl hover:scale-105 transition-transform"
                >
                  <Play size={20} fill="currentColor" /> RESUME
                </button>

                <button 
                  onClick={resetLevel}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-white/5 text-white font-bold rounded-xl border border-white/10 hover:bg-white/10 transition-all"
                >
                  <RotateCcw size={20} /> RESET LEVEL
                </button>

                <button 
                  onClick={quitGame}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-red-500/10 text-red-500 font-bold rounded-xl border border-red-500/20 hover:bg-red-500/20 transition-all"
                >
                  <LogOut size={20} /> QUIT GAME
                </button>
              </div>
            </div>
          )}
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
            <div className="key-cap">ESC</div>
            <span className="text-[10px] uppercase text-[#888] tracking-widest font-mono">Pause Menu</span>
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
