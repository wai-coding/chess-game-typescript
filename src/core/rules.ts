import { BoardState, Color, Position, Piece } from "./types";
import { generatePseudoLegalMoves, generateLegalMoves, MoveGenOptions } from "./moveGenerator";
import { findKing } from "./board";

export function isSquareAttacked(
  board: BoardState,
  pos: Position,
  byColor: Color
): boolean {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === byColor) {
        const moves = generatePseudoLegalMoves(board, { row, col }, piece);
        if (moves.some((m) => m.to.row === pos.row && m.to.col === pos.col)) {
          return true;
        }
      }
    }
  }
  return false;
}

export function isKingInCheck(board: BoardState, color: Color): boolean {
  const kingPos = findKing(board, color);
  if (!kingPos) return false;
  const enemy: Color = color === "white" ? "black" : "white";
  return isSquareAttacked(board, kingPos, enemy);
}

export function isCheckmate(board: BoardState, color: Color, options: MoveGenOptions = {}): boolean {
  if (!isKingInCheck(board, color)) return false;
  const moves = generateLegalMoves(board, color, {
    ...options,
    isSquareAttacked,
  });
  return moves.length === 0;
}

export function isStalemate(board: BoardState, color: Color, options: MoveGenOptions = {}): boolean {
  if (isKingInCheck(board, color)) return false;
  const moves = generateLegalMoves(board, color, {
    ...options,
    isSquareAttacked,
  });
  return moves.length === 0;
}

export function isInsufficientMaterial(board: BoardState): boolean {
  const pieces: { piece: Piece; row: number; col: number }[] = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece) pieces.push({ piece, row, col });
    }
  }

  if (pieces.length === 2) return true;

  if (pieces.length === 3) {
    return pieces.some((p) => p.piece.type === "bishop" || p.piece.type === "knight");
  }

  if (pieces.length === 4) {
    const bishops = pieces.filter((p) => p.piece.type === "bishop");
    if (bishops.length === 2 && bishops[0].piece.color !== bishops[1].piece.color) {
      const sq0 = (bishops[0].row + bishops[0].col) % 2;
      const sq1 = (bishops[1].row + bishops[1].col) % 2;
      return sq0 === sq1;
    }
  }

  return false;
}
