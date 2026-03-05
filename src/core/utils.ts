import { Position, Color } from "./types";

const FILES = "abcdefgh";

export function posToAlgebraic(pos: Position): string {
  return FILES[pos.col] + (pos.row + 1);
}

export function algebraicToPos(sq: string): Position | null {
  if (sq.length !== 2) return null;
  const col = FILES.indexOf(sq[0]);
  const row = parseInt(sq[1], 10) - 1;
  if (col < 0 || row < 0 || row > 7) return null;
  return { row, col };
}

export function opponent(color: Color): Color {
  return color === "white" ? "black" : "white";
}
