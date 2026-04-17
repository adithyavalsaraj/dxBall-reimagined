import { 
  BrickType, 
  PowerUpType, 
  GAME_HEIGHT, 
  GAME_WIDTH, 
  BALL_RADIUS, 
  PADDLE_HEIGHT, 
  PADDLE_WIDTH, 
  POWERUP_DROP_SPEED,
  POWERUP_DURATION,
  EXTENDED_PADDLE_WIDTH,
  SHRUNK_BALL_SPEED_FACTOR,
  INITIAL_BALL_SPEED,
  BULLET_SPEED,
  BULLET_COOLDOWN
} from './constants';
import { BrickData } from './levels';

export interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  isFireBall?: boolean;
}

export interface PowerUpItem {
  x: number;
  y: number;
  type: PowerUpType;
}

export interface Bullet {
  x: number;
  y: number;
}

export interface GameState {
  balls: Ball[];
  bullets: Bullet[];
  paddle: { x: number; y: number; width: number };
  bricks: BrickData[];
  fallingPowerUps: PowerUpItem[];
  activeEffects: { [key in PowerUpType]?: number }; // Map of type to expiration time
  score: number;
  lives: number;
  isGameOver: boolean;
  isPaused: boolean;
  isMenuOpen: boolean;
  level: number;
}

export type GameEvent = 'hit_brick' | 'hit_paddle' | 'hit_wall' | 'lose_life' | 'game_over' | 'level_start' | 'catch_powerup';

export class BallGameEngine {
  state: GameState;
  onStateUpdate?: (state: GameState) => void;
  onEvent?: (event: GameEvent) => void;
  private lastShotTime: number = 0;

  constructor(initialBricks: BrickData[]) {
    this.state = {
      balls: [{ x: GAME_WIDTH / 2, y: GAME_HEIGHT - 60, dx: INITIAL_BALL_SPEED * 0.8, dy: -INITIAL_BALL_SPEED }],
      bullets: [],
      paddle: { x: (GAME_WIDTH - PADDLE_WIDTH) / 2, y: GAME_HEIGHT - 30, width: PADDLE_WIDTH },
      bricks: initialBricks,
      fallingPowerUps: [],
      activeEffects: {},
      score: 0,
      lives: 3,
      isGameOver: false,
      isPaused: true,
      isMenuOpen: false,
      level: 0,
    };
  }

  resetBall() {
    this.state.balls = [{
      x: this.state.paddle.x + this.state.paddle.width / 2,
      y: this.state.paddle.y - 20,
      dx: (Math.random() - 0.5) * INITIAL_BALL_SPEED,
      dy: -INITIAL_BALL_SPEED,
      isFireBall: false,
    }];
    this.state.fallingPowerUps = [];
    this.state.bullets = [];
    this.state.activeEffects = {}; // Reset effects on loss
    this.state.paddle.width = PADDLE_WIDTH;
    this.state.isPaused = true;
    this.state.isMenuOpen = false;
    if (this.onEvent) this.onEvent('level_start');
  }

  update(dt: number) {
    if (this.state.isGameOver || this.state.isPaused) return;

    const { balls, paddle, bricks, fallingPowerUps, activeEffects } = this.state;
    const now = Date.now();

    // 1. Manage Active Effects
    Object.keys(activeEffects).forEach((key) => {
      const type = key as PowerUpType;
      if (activeEffects[type] && now > activeEffects[type]!) {
        delete activeEffects[type];
        // Reset specific values if needed
        if (type === PowerUpType.EXTEND_PADDLE) {
          this.state.paddle.width = PADDLE_WIDTH;
        }
      }
    });

    // Apply active effects to state
    if (activeEffects[PowerUpType.EXTEND_PADDLE]) {
      this.state.paddle.width = EXTENDED_PADDLE_WIDTH;
    }

    // 2. Move Falling Power-ups
    for (let i = fallingPowerUps.length - 1; i >= 0; i--) {
      const p = fallingPowerUps[i];
      p.y += POWERUP_DROP_SPEED;

      // Catch power-up
      if (
        p.y + 10 > paddle.y &&
        p.y - 10 < paddle.y + PADDLE_HEIGHT &&
        p.x > paddle.x &&
        p.x < paddle.x + paddle.width
      ) {
        this.applyPowerUp(p.type);
        fallingPowerUps.splice(i, 1);
        if (this.onEvent) this.onEvent('catch_powerup');
      } else if (p.y > GAME_HEIGHT) {
        fallingPowerUps.splice(i, 1);
      }
    }

    // 3. Move Bullets
    for (let i = this.state.bullets.length - 1; i >= 0; i--) {
      const bullet = this.state.bullets[i];
      bullet.y -= BULLET_SPEED;

      if (bullet.y < 0) {
        this.state.bullets.splice(i, 1);
        continue;
      }

      // Bullet brick collision
      for (let j = 0; j < bricks.length; j++) {
        const b = bricks[j];
        if (
          bullet.x > b.x &&
          bullet.x < b.x + 64 &&
          bullet.y > b.y &&
          bullet.y < b.y + 32
        ) {
          if (b.type !== BrickType.INDESTRUCTIBLE) {
            b.hits -= 1;
            this.state.score += 10;
            if (b.hits <= 0) {
              this.handleBrickDestruction(b);
              bricks.splice(j, 1);
            }
          }
          this.state.bullets.splice(i, 1);
          if (this.onEvent) this.onEvent('hit_brick');
          break;
        }
      }
    }

    // 4. Move and Collide Balls
    for (let bIndex = balls.length - 1; bIndex >= 0; bIndex--) {
      const ball = balls[bIndex];
      let speedFactor = 1.0;
      if (activeEffects[PowerUpType.SLOW_BALL]) {
        speedFactor = SHRUNK_BALL_SPEED_FACTOR;
      }

      ball.x += ball.dx * speedFactor;
      ball.y += ball.dy * speedFactor;

      // Wall collisions
      if (ball.x + BALL_RADIUS > GAME_WIDTH || ball.x - BALL_RADIUS < 0) {
        ball.dx = -ball.dx;
        ball.x = ball.x < BALL_RADIUS ? BALL_RADIUS : (ball.x > GAME_WIDTH - BALL_RADIUS ? GAME_WIDTH - BALL_RADIUS : ball.x);
        if (this.onEvent) this.onEvent('hit_wall');
      }
      if (ball.y - BALL_RADIUS < 0) {
        ball.dy = -ball.dy;
        ball.y = BALL_RADIUS;
        if (this.onEvent) this.onEvent('hit_wall');
      }

      // Bottom collision
      if (ball.y + BALL_RADIUS > GAME_HEIGHT) {
        balls.splice(bIndex, 1);
        if (balls.length === 0) {
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
        continue;
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
        ball.y = paddle.y - BALL_RADIUS; // Prevent stuck ball
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
          const isFireBall = activeEffects[PowerUpType.FIRE_BALL];
          const canPenetrate = isFireBall && b.type !== BrickType.INDESTRUCTIBLE;

          if (b.type !== BrickType.INDESTRUCTIBLE) {
            b.hits -= 1;
            this.state.score += 10;
            if (b.hits <= 0) {
              this.handleBrickDestruction(b);
              bricks.splice(i, 1);
            }
          }

          if (!canPenetrate) {
            ball.dy = -ball.dy;
          }
          if (this.onEvent) this.onEvent('hit_brick');
          break;
        }
      }
    }

    // Win check
    if (bricks.filter((b) => b.type !== BrickType.INDESTRUCTIBLE).length === 0) {
      this.nextLevel();
    }

    if (this.onStateUpdate) this.onStateUpdate({ ...this.state });
  }

  handleBrickDestruction(brick: BrickData) {
    let spawnChance = 0.12; // 12% base chance for normal bricks
    if (brick.type === BrickType.POWERUP) spawnChance = 1.0;

    if (Math.random() < spawnChance) {
      const rand = Math.random();
      let type: PowerUpType;

      if (rand < 0.35) {
        type = PowerUpType.EXTEND_PADDLE; // 35%
      } else if (rand < 0.65) {
        type = PowerUpType.SLOW_BALL; // 30%
      } else if (rand < 0.8) {
        type = PowerUpType.EXTRA_BALL; // 15%
      } else if (rand < 0.88) {
        type = PowerUpType.EXTRA_LIFE; // 8%
      } else if (rand < 0.94) {
        type = PowerUpType.FIRE_BALL; // 6% (Very Rare)
      } else {
        type = PowerUpType.SHOOTER; // 6% (Very Rare)
      }

      this.state.fallingPowerUps.push({
        x: brick.x + 32,
        y: brick.y + 16,
        type,
      });
    }
  }

  applyPowerUp(type: PowerUpType) {
    const now = Date.now();
    switch (type) {
      case PowerUpType.EXTRA_LIFE:
        this.state.lives = Math.min(5, this.state.lives + 1);
        break;
      case PowerUpType.EXTRA_BALL:
        const firstBall = this.state.balls[0] || { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2, dx: 4, dy: -4 };
        this.state.balls.push({
          x: firstBall.x,
          y: firstBall.y,
          dx: -firstBall.dx,
          dy: firstBall.dy,
        });
        break;
      default:
        this.state.activeEffects[type] = now + POWERUP_DURATION;
        break;
    }
  }

  nextLevel() {
    this.state.level += 1;
    this.state.activeEffects = {}; // Reset effects on level change
    this.state.paddle.width = PADDLE_WIDTH;
  }

  setPaddlePos(x: number) {
    const maxX = GAME_WIDTH - this.state.paddle.width;
    this.state.paddle.x = Math.max(0, Math.min(maxX, x));

    // Sticky ball logic
    if (this.state.isPaused && !this.state.isGameOver && this.state.balls.length === 1) {
      this.state.balls[0].x = this.state.paddle.x + this.state.paddle.width / 2;
    }
  }

  shoot() {
    if (this.state.isPaused || this.state.isGameOver) return;
    if (!this.state.activeEffects[PowerUpType.SHOOTER]) return;

    const now = Date.now();
    if (now - this.lastShotTime < BULLET_COOLDOWN) return;

    const { paddle } = this.state;
    this.state.bullets.push(
      { x: paddle.x + 10, y: paddle.y },
      { x: paddle.x + paddle.width - 10, y: paddle.y }
    );
    this.lastShotTime = now;
  }

  togglePause() {
    this.state.isMenuOpen = !this.state.isMenuOpen;
    this.state.isPaused = this.state.isMenuOpen;
  }

  resetLevel(bricks: BrickData[]) {
    this.state.bricks = bricks;
    this.state.score = 0;
    this.state.lives = 3;
    this.resetBall();
    this.state.isMenuOpen = false;
  }

  resetGame(initialBricks: BrickData[]) {
    this.state.level = 0;
    this.state.score = 0;
    this.state.lives = 3;
    this.state.bricks = initialBricks;
    this.resetBall();
    this.state.isMenuOpen = false;
  }
}
