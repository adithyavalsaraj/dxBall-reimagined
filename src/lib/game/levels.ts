
import { BrickType } from './constants';

export interface BrickData {
  x: number;
  y: number;
  type: BrickType;
  hits: number;
  maxHits: number;
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
  ],
  // Level 4: Zig Zag
  [
    'N N N N N ',
    ' N N N N N',
    'N N N N N ',
    ' N N N N N',
    'TTTTTTTTTT',
  ],
  // Level 5: The Eye
  [
    '  NNNNNN  ',
    ' NNNTTNNN ',
    'NNNTITNNN',
    ' NNNTTNNN ',
    '  NNNNNN  ',
  ],
  // Level 6: Pillars
  [
    'I N I N I ',
    'I T I T I ',
    'I N I N I ',
    'I T I T I ',
    'I N I N I ',
  ],
  // Level 7: Random Chaos (using ?)
  [
    '??????????',
    '?        ?',
    '?  ????  ?',
    '?        ?',
    '??????????',
  ],
  // Level 8: Space Invader
  [
    '  N    N  ',
    '   N  N   ',
    '  NNNNNN  ',
    ' NN NN NN ',
    'NNNNNNNNNN',
    'N NNNNNN N',
    'N N    N N',
    '   NNNN   ',
  ],
  // Level 9: Spiral
  [
    'NNNNNNNNNN',
    'N        N',
    'N TTTTTT N',
    'N T    T N',
    'N T II T N',
    'N T    T N',
    'N TTTTTT N',
    'N        N',
    'NNNNNNNNNN',
  ],
  // Level 10: Final Challenge
  [
    'IIIIIIIIII',
    'ITTTTTTTTI',
    'ITNNNNNNTI',
    'ITNPPPPNTI',
    'ITNNNNNNTI',
    'ITTTTTTTTI',
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
      
      let finalChar = char;
      if (char === '?') {
        const rand = Math.random();
        if (rand < 0.6) finalChar = 'N';
        else if (rand < 0.85) finalChar = 'T';
        else if (rand < 0.95) finalChar = 'P';
        else finalChar = 'I';
      }

      // Randomly upgrade normal bricks in higher levels
      if (finalChar === 'N' && levelIndex > 2) {
          if (Math.random() < 0.05 * (levelIndex - 2)) {
              finalChar = 'T';
          }
      }

      if (finalChar === 'N') type = BrickType.NORMAL;
      if (finalChar === 'T') {
        type = BrickType.TOUGH;
        hits = 2 + Math.floor(levelIndex / 5); // Tougher as levels go up
      }
      if (finalChar === 'I') type = BrickType.INDESTRUCTIBLE;
      if (finalChar === 'P') type = BrickType.POWERUP;

      if (type) {
        bricks.push({
          x: startX + colIndex * brickTotalWidth,
          y: startY + rowIndex * brickTotalHeight,
          type,
          hits,
          maxHits: hits
        });
      }
    });
  });

  return bricks;
}
