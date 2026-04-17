
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

export const PADDLE_WIDTH = 120;
export const PADDLE_HEIGHT = 20;
export const BALL_RADIUS = 8;

export const INITIAL_BALL_SPEED = 5;
export const MAX_BALL_SPEED = 12;

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
  LASER = 'LASER', // Not implemented yet but placeholder
  SLOW_BALL = 'SLOW_BALL',
}

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
