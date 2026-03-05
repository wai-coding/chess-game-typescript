import { BoardState, Color, Move, Piece, PieceType, Position } from "./types";
import { getPiece, cloneBoard, findKing } from "./board";

const ROOK_DIRS = [
  { dr: 1, dc: 0 },
  { dr: -1, dc: 0 },
  { dr: 0, dc: 1 },
  { dr: 0, dc: -1 },
];
const BISHOP_DIRS = [
  { dr: 1, dc: 1 },
  { dr: 1, dc: -1 },
  { dr: -1, dc: 1 },
  { dr: -1, dc: -1 },
];
const QUEEN_DIRS = [...ROOK_DIRS, ...BISHOP_DIRS];
const KNIGHT_JUMPS = [
  { dr: 2, dc: 1 },
  { dr: 2, dc: -1 },
  { dr: -2, dc: 1 },
  { dr: -2, dc: -1 },
  { dr: 1, dc: 2 },
  { dr: 1, dc: -2 },
  { dr: -1, dc: 2 },
  { dr: -1, dc: -2 },
];

function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function generateSlidingMoves(
  board: BoardState,
  from: Position,
  color: Color,
  directions: { dr: number; dc: number }[]
): Move[] {
  const moves: Move[] = [];
  for (const { dr, dc } of directions) {
    let r = from.row + dr;
    let c = from.col + dc;
    while (inBounds(r, c)) {
      const target = board[r][c];
      if (!target) {
        moves.push({ from, to: { row: r, col: c } });
      } else {
        if (target.color !== color) {
          moves.push({ from, to: { row: r, col: c } });
        }
        break;
      }
      r += dr;
      c += dc;
    }
  }
  return moves;
}

function generatePawnMoves(
  board: BoardState,
  from: Position,
  color: Color,
  enPassantTarget?: Position
): Move[] {
  const moves: Move[] = [];
  const dir = color === "white" ? 1 : -1;
  const startRow = color === "white" ? 1 : 6;
  const promoRow = color === "white" ? 7 : 0;
  const { row, col } = from;

  const fwd1 = { row: row + dir, col };
  if (inBounds(fwd1.row, fwd1.col) && !board[fwd1.row][fwd1.col]) {
    if (fwd1.row === promoRow) {
      for (const p of ["queen", "rook", "bishop", "knight"] as PieceType[]) {
        moves.push({ from, to: fwd1, promotion: p });
      }
    } else {
      moves.push({ from, to: fwd1 });
    }

    if (row === startRow) {
      const fwd2 = { row: row + 2 * dir, col };
      if (!board[fwd2.row][fwd2.col]) {
        moves.push({ from, to: fwd2 });
      }
    }
  }

  for (const dc of [-1, 1]) {
    const cap = { row: row + dir, col: col + dc };
    if (!inBounds(cap.row, cap.col)) continue;
    const target = board[cap.row][cap.col];
    if (target && target.color !== color) {
      if (cap.row === promoRow) {
        for (const p of ["queen", "rook", "bishop", "knight"] as PieceType[]) {
          moves.push({ from, to: cap, promotion: p });
        }
      } else {
        moves.push({ from, to: cap });
      }
    }
  }

  if (enPassantTarget) {
    const epRow = color === "white" ? 4 : 3;
    if (
      row === epRow &&
      enPassantTarget.row === row + dir &&
      Math.abs(enPassantTarget.col - col) === 1
    ) {
      const capturedPawn = board[row][enPassantTarget.col];
      if (
        capturedPawn &&
        capturedPawn.type === "pawn" &&
        capturedPawn.color !== color
      ) {
        moves.push({
          from,
          to: { row: enPassantTarget.row, col: enPassantTarget.col },
          isEnPassant: true,
        });
      }
    }
  }

  return moves;
}

function generateKnightMoves(
  board: BoardState,
  from: Position,
  color: Color
): Move[] {
  const moves: Move[] = [];
  for (const { dr, dc } of KNIGHT_JUMPS) {
    const r = from.row + dr;
    const c = from.col + dc;
    if (inBounds(r, c)) {
      const target = board[r][c];
      if (!target || target.color !== color) {
        moves.push({ from, to: { row: r, col: c } });
      }
    }
  }
  return moves;
}

function generateKingMoves(
  board: BoardState,
  from: Position,
  color: Color,
  canCastleKingSide: boolean,
  canCastleQueenSide: boolean,
  isSquareAttacked: (board: BoardState, pos: Position, byColor: Color) => boolean
): Move[] {
  const moves: Move[] = [];
  const enemy: Color = color === "white" ? "black" : "white";

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = from.row + dr;
      const c = from.col + dc;
      if (inBounds(r, c)) {
        const target = board[r][c];
        if (!target || target.color !== color) {
          moves.push({ from, to: { row: r, col: c } });
        }
      }
    }
  }

  const row = color === "white" ? 0 : 7;
  if (from.row !== row || from.col !== 4) return moves;
  if (isSquareAttacked(board, from, enemy)) return moves;

  if (canCastleKingSide) {
    const rook = board[row][7];
    if (
      rook && rook.type === "rook" && rook.color === color &&
      !board[row][5] && !board[row][6] &&
      !isSquareAttacked(board, { row, col: 5 }, enemy) &&
      !isSquareAttacked(board, { row, col: 6 }, enemy)
    ) {
      moves.push({ from, to: { row, col: 6 }, isCastling: true });
    }
  }

  // Queenside: b-file square (col 1) must be empty for the rook to pass,
  // but unlike c1/d1, it does not need to be unattacked per FIDE rules.
  if (canCastleQueenSide) {
    const rook = board[row][0];
    if (
      rook && rook.type === "rook" && rook.color === color &&
      !board[row][1] && !board[row][2] && !board[row][3] &&
      !isSquareAttacked(board, { row, col: 3 }, enemy) &&
      !isSquareAttacked(board, { row, col: 2 }, enemy)
    ) {
      moves.push({ from, to: { row, col: 2 }, isCastling: true });
    }
  }

  return moves;
}

export interface MoveGenOptions {
  enPassantTarget?: Position;
  canCastleKingSide?: boolean;
  canCastleQueenSide?: boolean;
  isSquareAttacked?: (board: BoardState, pos: Position, byColor: Color) => boolean;
}

export function generatePseudoLegalMoves(
  board: BoardState,
  from: Position,
  piece: Piece,
  options: MoveGenOptions = {}
): Move[] {
  switch (piece.type) {
    case "pawn":
      return generatePawnMoves(board, from, piece.color, options.enPassantTarget);
    case "rook":
      return generateSlidingMoves(board, from, piece.color, ROOK_DIRS);
    case "bishop":
      return generateSlidingMoves(board, from, piece.color, BISHOP_DIRS);
    case "queen":
      return generateSlidingMoves(board, from, piece.color, QUEEN_DIRS);
    case "knight":
      return generateKnightMoves(board, from, piece.color);
    case "king":
      return generateKingMoves(
        board,
        from,
        piece.color,
        !!options.canCastleKingSide,
        !!options.canCastleQueenSide,
        options.isSquareAttacked || (() => false)
      );
  }
}

export function generateLegalMoves(
  board: BoardState,
  color: Color,
  options: MoveGenOptions = {}
): Move[] {
  const enemy: Color = color === "white" ? "black" : "white";
  const moves: Move[] = [];

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (!piece || piece.color !== color) continue;

      const from = { row, col };
      const pseudoMoves = generatePseudoLegalMoves(board, from, piece, options);

      for (const move of pseudoMoves) {
        const copy = cloneBoard(board);

        if (move.isEnPassant) {
          const dir = color === "white" ? 1 : -1;
          copy[move.to.row - dir][move.to.col] = null;
        }

        if (move.isCastling) {
          if (move.to.col === 6) {
            copy[row][5] = copy[row][7];
            copy[row][7] = null;
          } else if (move.to.col === 2) {
            copy[row][3] = copy[row][0];
            copy[row][0] = null;
          }
        }

        if (move.promotion) {
          copy[move.to.row][move.to.col] = { type: move.promotion, color, hasMoved: true };
        } else {
          copy[move.to.row][move.to.col] = { ...piece, hasMoved: true };
        }
        copy[from.row][from.col] = null;

        const kingPos = piece.type === "king" ? move.to : findKing(copy, color);
        if (!kingPos) continue;

        const attackFn = options.isSquareAttacked || (() => false);
        if (!attackFn(copy, kingPos, enemy)) {
          moves.push(move);
        }
      }
    }
  }

  return moves;
}
