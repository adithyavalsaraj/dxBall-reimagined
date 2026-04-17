
import { BrickType, GAME_HEIGHT, GAME_WIDTH, BALL_RADIUS, PADDLE_HEIGHT, PADDLE_WIDTH } from './constants';
import { BrickData } from './levels';

export interface GameState {
  ball: { x: number; y: number; dx: number; dy: number };
  paddle: { x: number; y: number; width: number };
  bricks: BrickData[];
  score: number;
  lives: number;
  isGameOver: boolean;
  isPaused: boolean;
  level: number;
}

export type GameEvent = 'hit_brick' | 'hit_paddle' | 'hit_wall' | 'lose_life' | 'game_over' | 'level_start';

export class BallGameEngine {
  state: GameState;
  onStateUpdate?: (state: GameState) => void;
  onEvent?: (event: GameEvent) => void;

  constructor(initialBricks: BrickData[]) {
    this.state = {
      ball: { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 60, dx: 4, dy: -4 },
      paddle: { x: (GAME_WIDTH - PADDLE_WIDTH) / 2, y: GAME_HEIGHT - 30, width: PADDLE_WIDTH },
      bricks: initialBricks,
      score: 0,
      lives: 3,
      isGameOver: false,
      isPaused: true,
      level: 0,
    };
  }

  resetBall() {
    this.state.ball = {
      x: this.state.paddle.x + this.state.paddle.width / 2,
      y: this.state.paddle.y - 20,
      dx: (Math.random() - 0.5) * 4,
      dy: -5,
    };
    this.state.isPaused = true;
    if (this.onEvent) this.onEvent('level_start');
  }

  update(dt: number) {
    if (this.state.isGameOver || this.state.isPaused) return;

    const { ball, paddle, bricks } = this.state;

    // Move ball
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Wall collisions
    if (ball.x + ball.dx > GAME_WIDTH - BALL_RADIUS || ball.x + ball.dx < BALL_RADIUS) {
      ball.dx = -ball.dx;
      if (this.onEvent) this.onEvent('hit_wall');
    }
    if (ball.y + ball.dy < BALL_RADIUS) {
      ball.dy = -ball.dy;
      if (this.onEvent) this.onEvent('hit_wall');
    }

    // Bottom collision (lose life)
    if (ball.y + ball.dy > GAME_HEIGHT - BALL_RADIUS) {
      this.state.lives -= 1;
      if (this.state.lives <= 0) {
        this.state.isGameOver = true;
        if (this.onEvent) this.onEvent('game_over');
      } else {
        if (this.onEvent) this.onEvent('lose_life');
        this.resetBall();
      }
      return;
    }

    // Paddle collision
    if (
      ball.y + BALL_RADIUS > paddle.y &&
      ball.y - BALL_RADIUS < paddle.y + PADDLE_HEIGHT &&
      ball.x > paddle.x &&
      ball.x < paddle.x + paddle.width
    ) {
      const hitPos = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
      const angle = hitPos * (Math.PI / 3); 
      const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
      
      ball.dx = speed * Math.sin(angle);
      ball.dy = -speed * Math.cos(angle);
      if (this.onEvent) this.onEvent('hit_paddle');
    }

    // Brick collision
    for (let i = 0; i < bricks.length; i++) {
        const b = bricks[i];
        if (
            ball.x + BALL_RADIUS > b.x &&
            ball.x - BALL_RADIUS < b.x + 64 && 
            ball.y + BALL_RADIUS > b.y &&
            ball.y - BALL_RADIUS < b.y + 32  
        ) {
            if (b.type !== BrickType.INDESTRUCTIBLE) {
                b.hits -= 1;
                this.state.score += 10;
                if (b.hits <= 0) {
                    bricks.splice(i, 1);
                }
            }
            ball.dy = -ball.dy;
            if (this.onEvent) this.onEvent('hit_brick');
            break; 
        }
    }

    // Win check
    if (bricks.filter(b => b.type !== BrickType.INDESTRUCTIBLE).length === 0) {
        this.nextLevel();
    }

    if (this.onStateUpdate) this.onStateUpdate({ ...this.state });
  }

  nextLevel() {
    this.state.level += 1;
    // We need levels.ts but engine.ts doesn't import parseLevel directly to avoid circularity if possible
    // but here I can just reset and let the hook handle it or import it.
    // I'll import parseLevel in engine.ts (assuming no circularity since levels.ts only imports BrickType which is in constants.ts)
  }

  setPaddlePos(x: number) {
    const maxX = GAME_WIDTH - this.state.paddle.width;
    this.state.paddle.x = Math.max(0, Math.min(maxX, x));
    if (this.state.isPaused && !this.state.isGameOver) {
        // Sticky ball logic if we wanted it, but for now just move ball if not started? 
        // Actually letting the player position before launch is better.
    }
  }

  togglePause() {
    this.state.isPaused = !this.state.isPaused;
  }
}
