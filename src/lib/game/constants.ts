
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

export const PADDLE_WIDTH = 120;
export const PADDLE_HEIGHT = 20;
export const BALL_RADIUS = 8;

export const INITIAL_BALL_SPEED = 5;
export const MAX_BALL_SPEED = 15;
export const SPEED_INCREMENT_PER_LEVEL = 0.4;

export const BRICK_WIDTH = 64;
export const BRICK_HEIGHT = 32;
export const BRICK_PADDING = 8;
export const LEVEL_PADDING_TOP = 60;

export enum BrickType {
  NORMAL = 'NORMAL',
  TOUGH = 'TOUGH', // Needs 2 hits
  INDESTRUCTIBLE = 'INDESTRUCTIBLE',
  POWERUP = 'POWERUP',
}

export enum PowerUpType {
  EXTEND_PADDLE = 'EXTEND_PADDLE',
  EXTRA_BALL = 'EXTRA_BALL',
  SLOW_BALL = 'SLOW_BALL',
  EXTRA_LIFE = 'EXTRA_LIFE',
  FIRE_BALL = 'FIRE_BALL',
  SHOOTER = 'SHOOTER',
}

export const POWERUP_DROP_SPEED = 3;
export const POWERUP_RADIUS = 12;
export const POWERUP_DURATION = 10000; // 10 seconds
export const EXTENDED_PADDLE_WIDTH = 180;
export const SHRUNK_BALL_SPEED_FACTOR = 0.7;

export const BULLET_SPEED = 8;
export const BULLET_COOLDOWN = 400; // ms
export const BULLET_WIDTH = 4;
export const BULLET_HEIGHT = 12;

export const COLORS = {
  PADDLE: '#ffffff',
  BALL: '#ffffff',
  BRICKS: {
    [BrickType.NORMAL]: '#00d2ff',
    [BrickType.TOUGH]: '#ff007a',
    [BrickType.INDESTRUCTIBLE]: '#333333',
    [BrickType.POWERUP]: '#39ff14',
  },
  ACCENT: '#00d2ff',
  BACKGROUND: '#000000',
};
