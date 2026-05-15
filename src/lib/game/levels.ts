import { BrickType } from "./constants";

export interface BrickData {
  x: number;
  y: number;
  type: BrickType;
  hits: number;
  maxHits: number;
}

const EASY_LEVELS: string[][] = [
  // Level 1: Simple grid
  ["NNNNNNNNNN", "NNNNNNNNNN", "TTTTTTTTTT", "NNNNNNNNNN"],
  // Level 2: Diamond shape
  [
    "    NN    ",
    "   NNNN   ",
    "  NNTTNN  ",
    " NNTTTTNN ",
    "  NNTTNN  ",
    "   NNNN   ",
    "    NN    ",
  ],
  // Level 3: Zig Zag
  ["N N N N N ", " N N N N N", "N N N N N ", " N N N N N", "TTTTTTTTTT"],
];

const MEDIUM_LEVELS: string[][] = [
  // Level 4: Walls
  ["IIIIIIIIII", "T N N N N T", "T N N N N T", "IIIIIIIIII"],
  // Level 5: The Eye
  ["  NNNNNN  ", " NNNTTNNN ", "NNNTITNNN", " NNNTTNNN ", "  NNNNNN  "],
  // Level 6: Pillars
  ["I N I N I ", "I T I T I ", "I N I N I ", "I T I T I ", "I N I N I "],
  // Level 7: Random Chaos (using ?)
  ["??????????", "?        ?", "?  ????  ?", "?        ?", "??????????"],
  // Level 8: Space Invader
  [
    "  N    N  ",
    "   N  N   ",
    "  NNNNNN  ",
    " NN NN NN ",
    "NNNNNNNNNN",
    "N NNNNNN N",
    "N N    N N",
    "   NNNN   ",
  ],
  // Level 9: Castle Battlement (Alternating guard towers with hidden loot)
  [
    "I  I  I  I",
    "I  I  I  I",
    "ITTI  ITTI",
    "INNI  INNI",
    "IPPI  IPPI",
    "TTTTTTTTTT",
  ],
  // Level 10: Plinko / Pachinko (Ball bounces unpredictably off pegs)
  [" I  I  I  ", "  I  I  I ", "? ? ? ? ? ", " I  I  I  ", "NNNNNNNNNN"],
  // Level 11: Space DNA / Double Helix
  [
    "NN      NN",
    "  TT  TT  ",
    "    II    ",
    "  PP  PP  ",
    "NN      NN",
    "  TT  TT  ",
    "    II    ",
  ],
];

const HARD_LEVELS: string[][] = [
  // Level 12: Spiral
  [
    "NNNNNNNNNN",
    "N        N",
    "N TTTTTT N",
    "N T    T N",
    "N T II T N",
    "N T    T N",
    "N TTTTTT N",
    "N        N",
    "NNNNNNNNNN",
  ],
  // Level 13: Final Challenge
  [
    "IIIIIIIIII",
    "ITTTTTTTTI",
    "ITNNNNNNTI",
    "ITNPPPPNTI",
    "ITNNNNNNTI",
    "ITTTTTTTTI",
    "IIIIIIIIII",
  ],
  // Level 14: The Gauntlet (Funneling the ball into a tight center)
  ["IIII  IIII", "NNNN  NNNN", "TTTT  TTTT", "PPPP  PPPP", "  NNNNNN  "],
  // Level 15: Hourglass (Indestructible core forces side bounce shots)
  [
    "NNNNNNNNNN",
    " TTTTTTTT ",
    "  IIIIII  ",
    "   IIII   ",
    "  PPPPPP  ",
    " TTTTTTTT ",
    "NNNNNNNNNN",
  ],
  // Level 16: Checkered Vault (Unbreakable bricks isolate the powerups)
  ["I N I P I ", "N I N I N ", "I T I T I ", "P I N I P ", "I N I N I "],
  // Level 17: Shielded Core (Must sneak ball around or through the top)
  ["NNNNNNNNNN", "NIIIIIIIIN", "NIIPPPPIIN", "NIIIIIIIIN", "NNNNNNNNNN"],
  // Level 18: Stepping Stones (Diagonal lanes that create fast ricochets)
  [
    "I         ",
    "TI        ",
    "NTI       ",
    "PNTI      ",
    " PNTI     ",
    "  PNTI    ",
  ],
  // Level 19: The Matrix (High distribution of random chaos locked behind walls)
  [
    "IIIIIIIIII",
    "I????????I",
    "I?I??I???I",
    "I???I??I?I",
    "I????????I",
    "IIIIIIIIII",
  ],
  // Level 20: Omega Fortress (The ultimate test of precision)
  ["I I I I I ", "ITTTTTTTTI", "IIPPPPPTII", "IINNNNNTII", "IIIIIIIIII"],
];

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export const LEVELS = [
  ...shuffle(EASY_LEVELS),
  ...shuffle(MEDIUM_LEVELS),
  ...shuffle(HARD_LEVELS)
];

export function parseLevel(levelIndex: number): BrickData[] {
  const layout = LEVELS[levelIndex % LEVELS.length];
  const bricks: BrickData[] = [];

  const brickTotalWidth = 64 + 8; // BRICK_WIDTH + PADDING
  const brickTotalHeight = 32 + 8; // BRICK_HEIGHT + PADDING
  const startX = (800 - layout[0].length * brickTotalWidth) / 2;
  const startY = 80;

  layout.forEach((row, rowIndex) => {
    [...row].forEach((char, colIndex) => {
      let type: BrickType | null = null;
      let hits = 1;

      let finalChar = char;
      if (char === "?") {
        const rand = Math.random();
        if (rand < 0.6) finalChar = "N";
        else if (rand < 0.85) finalChar = "T";
        else if (rand < 0.95) finalChar = "P";
        else finalChar = "I";
      }

      // Randomly upgrade normal bricks in higher levels
      if (finalChar === "N" && levelIndex > 2) {
        if (Math.random() < 0.05 * (levelIndex - 2)) {
          finalChar = "T";
        }
      }

      if (finalChar === "N") type = BrickType.NORMAL;
      if (finalChar === "T") {
        type = BrickType.TOUGH;
        hits = 2 + Math.floor(levelIndex / 5); // Tougher as levels go up
      }
      if (finalChar === "I") type = BrickType.INDESTRUCTIBLE;
      if (finalChar === "P") type = BrickType.POWERUP;

      if (type) {
        bricks.push({
          x: startX + colIndex * brickTotalWidth,
          y: startY + rowIndex * brickTotalHeight,
          type,
          hits,
          maxHits: hits,
        });
      }
    });
  });

  return bricks;
}
