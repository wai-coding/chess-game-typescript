import { BoardState, Piece, Position } from "./types";

export function initializeBoard(): BoardState {
  const board: BoardState = Array.from({ length: 8 }, () =>
    Array<Piece | null>(8).fill(null)
  );

  const backRow: PieceRow = ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"];

  for (let col = 0; col < 8; col++) {
    board[0][col] = { type: backRow[col], color: "white" };
    board[1][col] = { type: "pawn", color: "white" };
    board[6][col] = { type: "pawn", color: "black" };
    board[7][col] = { type: backRow[col], color: "black" };
  }

  return board;
}

type PieceRow = readonly Piece["type"][];

export function cloneBoard(board: BoardState): BoardState {
  return board.map((row) => row.map((piece) => (piece ? { ...piece } : null)));
}

export function getPiece(board: BoardState, pos: Position): Piece | null {
  return board[pos.row][pos.col];
}

export function setPiece(board: BoardState, pos: Position, piece: Piece | null): void {
  board[pos.row][pos.col] = piece;
}

export function movePiece(board: BoardState, from: Position, to: Position): void {
  const piece = getPiece(board, from);
  setPiece(board, to, piece ? { ...piece, hasMoved: true } : null);
  setPiece(board, from, null);
}

export function findKing(board: BoardState, color: Piece["color"]): Position | null {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const p = board[row][col];
      if (p && p.type === "king" && p.color === color) {
        return { row, col };
      }
    }
  }
  return null;
}
