import {
  MouseEvent as ReactMouseEvent,
  TouchEvent as ReactTouchEvent,
  useEffect,
  useRef,
} from "react";
import {
  BALL_RADIUS,
  BRICK_HEIGHT,
  BRICK_WIDTH,
  COLORS,
  GAME_HEIGHT,
  GAME_WIDTH,
  PADDLE_HEIGHT,
  PowerUpType,
  POWERUP_RADIUS,
  BULLET_WIDTH,
  BULLET_HEIGHT,
} from "../../lib/game/constants";
import { GameState } from "../../lib/game/engine";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

interface GameCanvasProps {
  gameState: GameState | null;
  onMouseMove: (e: ReactMouseEvent | ReactTouchEvent) => void;
  onClick: () => void;
}

export default function GameCanvas({
  gameState,
  onMouseMove,
  onClick,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const prevBrickCountRef = useRef<number>(0);

  useEffect(() => {
    // Check for brick hits to spawn particles
    if (gameState && gameState.bricks.length < prevBrickCountRef.current) {
      // Find rough location (just helper)
      const firstBall = gameState.balls[0] || { x: 0, y: 0 };
      for (let i = 0; i < 15; i++) {
        particlesRef.current.push({
          x: firstBall.x,
          y: firstBall.y,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6,
          life: 1.0,
          color: COLORS.ACCENT,
        });
      }
    }
    prevBrickCountRef.current = gameState?.bricks.length || 0;
  }, [gameState?.bricks.length, gameState?.balls]);

  useEffect(() => {
    const handlePointerLockChange = () => {
      if (document.pointerLockElement !== canvasRef.current) {
        // Pointer lock lost - pause the game
        if (gameState && !gameState.isPaused && !gameState.isGameOver) {
          onClick(); // Using onClick as toggle for now in App, but better to have explicit pause
        }
      }
    };

    document.addEventListener("pointerlockchange", handlePointerLockChange);
    return () =>
      document.removeEventListener("pointerlockchange", handlePointerLockChange);
  }, [gameState, onClick]);

  const handleCanvasClick = () => {
    if (!gameState?.isPaused) return;

    const canvas = canvasRef.current;
    if (canvas && canvas.requestPointerLock) {
      canvas.requestPointerLock();
    }
    onClick();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameState) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear background
    ctx.fillStyle = COLORS.BACKGROUND;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw Bricks
    gameState.bricks.forEach((brick) => {
      ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = COLORS.BRICKS[brick.type];
      ctx.fillStyle = COLORS.BRICKS[brick.type];

      // Draw brick body
      ctx.fillRect(brick.x, brick.y, BRICK_WIDTH, BRICK_HEIGHT);

      // Draw brick border
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.strokeRect(brick.x, brick.y, BRICK_WIDTH, BRICK_HEIGHT);

      // Add "shine" to bricks
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
      ctx.fillRect(brick.x, brick.y, BRICK_WIDTH, 4);

      ctx.restore();
    });

    // Draw Paddle
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = COLORS.PADDLE;
    ctx.fillStyle = COLORS.PADDLE;
    ctx.beginPath();
    ctx.roundRect(
      gameState.paddle.x,
      gameState.paddle.y,
      gameState.paddle.width,
      PADDLE_HEIGHT,
      5,
    );
    ctx.fill();

    // Paddle highlight
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.fillRect(
      gameState.paddle.x + 5,
      gameState.paddle.y + 2,
      gameState.paddle.width - 10,
      4,
    );
    ctx.restore();

    // Draw Balls
    const isFireBallActive = !!gameState.activeEffects[PowerUpType.FIRE_BALL];

    gameState.balls.forEach((ball) => {
      ctx.save();
      ctx.shadowBlur = isFireBallActive ? 25 : 12;
      ctx.shadowColor = isFireBallActive ? "#ff4500" : COLORS.BALL;
      ctx.fillStyle = isFireBallActive ? "#ff8c00" : COLORS.BALL;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // Inner core
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(ball.x - 2, ball.y - 2, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Draw Bullets
    gameState.bullets.forEach((bullet) => {
      ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#ff0000";
      ctx.fillStyle = "#ff3333";
      ctx.fillRect(
        bullet.x - BULLET_WIDTH / 2,
        bullet.y,
        BULLET_WIDTH,
        BULLET_HEIGHT,
      );
      ctx.restore();
    });

    // Draw Falling Power-ups
    gameState.fallingPowerUps.forEach((p) => {
      ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = COLORS.BRICKS.POWERUP;
      ctx.fillStyle = COLORS.BRICKS.POWERUP;
      ctx.beginPath();
      ctx.arc(p.x, p.y, POWERUP_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // Power-up identifier letter
      ctx.fillStyle = "#000000";
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      let label = "?";
      if (p.type === PowerUpType.EXTEND_PADDLE) label = "E";
      if (p.type === PowerUpType.EXTRA_BALL) label = "M"; // M for Multiball
      if (p.type === PowerUpType.SLOW_BALL) label = "S";
      if (p.type === PowerUpType.EXTRA_LIFE) label = "L";
      if (p.type === PowerUpType.FIRE_BALL) label = "F";
      if (p.type === PowerUpType.SHOOTER) label = "G"; // G for Gun
      ctx.fillText(label, p.x, p.y);
      ctx.restore();
    });

    // Draw Particles
    particlesRef.current.forEach((p, i) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
      ctx.fillStyle = `${p.color}${Math.floor(p.life * 255)
        .toString(16)
        .padStart(2, "0")}`;
      ctx.fillRect(p.x, p.y, 2, 2);
      if (p.life <= 0) particlesRef.current.splice(i, 1);
    });

    // Pause / State UI
    if (gameState.isPaused && !gameState.isGameOver) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      ctx.fillStyle = "#00f2ff";
      ctx.font = 'bold 32px "Space Grotesk", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("CLICK TO START", GAME_WIDTH / 2, GAME_HEIGHT / 2);
    }

    if (gameState.isGameOver) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      ctx.fillStyle = "#ff0055";
      ctx.font = 'bold 48px "Space Grotesk", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("GAME OVER", GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20);
      ctx.font = '24px "Space Grotesk", sans-serif';
      ctx.fillStyle = "#ffffff";
      ctx.fillText(
        `Final Score: ${gameState.score}`,
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2 + 30,
      );
      ctx.font = '18px "Space Grotesk", sans-serif';
      ctx.fillText("CLICK TO TRY AGAIN", GAME_WIDTH / 2, GAME_HEIGHT / 2 + 70);
    }
  }, [gameState]);

  const handlePointerMove = (e: ReactMouseEvent | ReactTouchEvent) => {
    onMouseMove(e);
  };

  return (
    <div className="relative overflow-hidden w-full h-full">
      <canvas
        ref={canvasRef}
        width={GAME_WIDTH}
        height={GAME_HEIGHT}
        onMouseMove={handlePointerMove}
        onTouchMove={handlePointerMove}
        onClick={handleCanvasClick}
        className="cursor-none touch-none block bg-black w-full h-full"
      />
    </div>
  );
}
