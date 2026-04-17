
import { BrickType } from './constants';

export interface BrickData {
  x: number;
  y: number;
  type: BrickType;
  hits: number;
}

export const LEVELS = [
  // Level 1: Simple grid
  [
    'NNNNNNNNNN',
    'NNNNNNNNNN',
    'TTTTTTTTTT',
    'NNNNNNNNNN',
  ],
  // Level 2: Diamond shape
  [
    '    NN    ',
    '   NNNN   ',
    '  NNTTNN  ',
    ' NNTTTTNN ',
    '  NNTTNN  ',
    '   NNNN   ',
    '    NN    ',
  ],
  // Level 3: Walls
  [
    'IIIIIIIIII',
    'T N N N N T',
    'T N N N N T',
    'IIIIIIIIII',
  ]
];

export function parseLevel(levelIndex: number): BrickData[] {
  const layout = LEVELS[levelIndex % LEVELS.length];
  const bricks: BrickData[] = [];
  
  const brickTotalWidth = 64 + 8; // BRICK_WIDTH + PADDING
  const brickTotalHeight = 32 + 8; // BRICK_HEIGHT + PADDING
  const startX = (800 - (layout[0].length * brickTotalWidth)) / 2;
  const startY = 80;

  layout.forEach((row, rowIndex) => {
    [...row].forEach((char, colIndex) => {
      let type: BrickType | null = null;
      let hits = 1;

      if (char === 'N') type = BrickType.NORMAL;
      if (char === 'T') {
        type = BrickType.TOUGH;
        hits = 2;
      }
      if (char === 'I') type = BrickType.INDESTRUCTIBLE;
      if (char === 'P') type = BrickType.POWERUP;

      if (type) {
        bricks.push({
          x: startX + colIndex * brickTotalWidth,
          y: startY + rowIndex * brickTotalHeight,
          type,
          hits
        });
      }
    });
  });

  return bricks;
}
