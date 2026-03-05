import { describe, it, expect } from "vitest";
import { createGame, makeMove, getLegalMoves, undoMove, exportFEN, loadFEN } from "../game";
import { isStalemate, isCheckmate, isInsufficientMaterial } from "../rules";

describe("Chess Engine", () => {
  describe("Castling", () => {
    it("allows king-side and queen-side castling when path is clear", () => {
      const game = createGame();
      game.board[0][1] = null;
      game.board[0][2] = null;
      game.board[0][3] = null;
      game.board[0][5] = null;
      game.board[0][6] = null;

      const kingMoves = getLegalMoves(game, { row: 0, col: 4 });
      expect(kingMoves.some((m) => m.isCastling && m.to.col === 6)).toBe(true);
      expect(kingMoves.some((m) => m.isCastling && m.to.col === 2)).toBe(true);
    });

    it("blocks castling when king has moved", () => {
      const game = createGame();
      game.board[0][1] = null;
      game.board[0][2] = null;
      game.board[0][3] = null;
      game.board[0][5] = null;
      game.board[0][6] = null;
      game.castlingRights.whiteKingSide = false;
      game.castlingRights.whiteQueenSide = false;

      const kingMoves = getLegalMoves(game, { row: 0, col: 4 });
      expect(kingMoves.some((m) => m.isCastling)).toBe(false);
    });

    it("executes castling and moves the rook", () => {
      const game = createGame();
      game.board[0][5] = null;
      game.board[0][6] = null;

      const castleMove = getLegalMoves(game, { row: 0, col: 4 }).find(
        (m) => m.isCastling && m.to.col === 6
      );
      expect(castleMove).toBeDefined();
      makeMove(game, castleMove!);

      expect(game.board[0][6]).toMatchObject({ type: "king" });
      expect(game.board[0][5]).toMatchObject({ type: "rook" });
      expect(game.board[0][4]).toBeNull();
      expect(game.board[0][7]).toBeNull();
    });
  });

  describe("En passant", () => {
    it("allows en passant immediately after double pawn push", () => {
      const game = createGame();
      for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) game.board[r][c] = null;
      game.board[0][4] = { type: "king", color: "white" };
      game.board[7][4] = { type: "king", color: "black" };
      game.board[4][4] = { type: "pawn", color: "white", hasMoved: true };
      game.board[6][3] = { type: "pawn", color: "black" };
      game.currentPlayer = "black";

      makeMove(game, { from: { row: 6, col: 3 }, to: { row: 4, col: 3 } });

      const epMoves = getLegalMoves(game, { row: 4, col: 4 }).filter((m) => m.isEnPassant);
      expect(epMoves.length).toBe(1);
      expect(epMoves[0].to.row).toBe(5);
      expect(epMoves[0].to.col).toBe(3);
    });

    it("disallows en passant after an intervening move", () => {
      const game = createGame();
      for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) game.board[r][c] = null;
      game.board[0][4] = { type: "king", color: "white" };
      game.board[7][4] = { type: "king", color: "black" };
      game.board[4][4] = { type: "pawn", color: "white", hasMoved: true };
      game.board[6][3] = { type: "pawn", color: "black" };
      game.board[7][0] = { type: "rook", color: "black" };
      game.board[0][0] = { type: "rook", color: "white" };
      game.currentPlayer = "black";

      makeMove(game, { from: { row: 6, col: 3 }, to: { row: 4, col: 3 } });
      makeMove(game, { from: { row: 0, col: 0 }, to: { row: 0, col: 1 } });
      makeMove(game, { from: { row: 7, col: 0 }, to: { row: 7, col: 1 } });

      const epMoves = getLegalMoves(game, { row: 4, col: 4 }).filter((m) => m.isEnPassant);
      expect(epMoves.length).toBe(0);
    });

    it("captures en passant and removes the correct pawn", () => {
      const game = createGame();
      for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) game.board[r][c] = null;
      game.board[0][4] = { type: "king", color: "white" };
      game.board[7][4] = { type: "king", color: "black" };
      game.board[4][4] = { type: "pawn", color: "white", hasMoved: true };
      game.board[6][5] = { type: "pawn", color: "black" };
      game.currentPlayer = "black";

      makeMove(game, { from: { row: 6, col: 5 }, to: { row: 4, col: 5 } });

      const epMove = getLegalMoves(game, { row: 4, col: 4 }).find((m) => m.isEnPassant);
      expect(epMove).toBeDefined();
      makeMove(game, epMove!);

      expect(game.board[5][5]?.type).toBe("pawn");
      expect(game.board[5][5]?.color).toBe("white");
      expect(game.board[4][5]).toBeNull();
      expect(game.board[4][4]).toBeNull();
    });
  });

  describe("Promotion", () => {
    it("promotes a pawn to chosen piece", () => {
      const game = createGame();
      for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) game.board[r][c] = null;
      game.board[0][0] = { type: "king", color: "white" };
      game.board[7][7] = { type: "king", color: "black" };
      game.board[6][0] = { type: "pawn", color: "white", hasMoved: true };

      makeMove(game, { from: { row: 6, col: 0 }, to: { row: 7, col: 0 }, promotion: "knight" });
      expect(game.board[7][0]?.type).toBe("knight");
      expect(game.board[7][0]?.color).toBe("white");
    });
  });

  describe("Check and Checkmate", () => {
    it("detects fool's mate", () => {
      const game = createGame();
      makeMove(game, { from: { row: 1, col: 5 }, to: { row: 2, col: 5 } });
      makeMove(game, { from: { row: 6, col: 4 }, to: { row: 4, col: 4 } });
      makeMove(game, { from: { row: 1, col: 6 }, to: { row: 3, col: 6 } });
      makeMove(game, { from: { row: 7, col: 3 }, to: { row: 3, col: 7 } });
      expect(game.status).toBe("checkmate");
    });
  });

  describe("Stalemate", () => {
    it("detects stalemate", () => {
      const game = createGame();
      for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) game.board[r][c] = null;
      game.board[7][7] = { type: "king", color: "black" };
      game.board[6][5] = { type: "king", color: "white" };
      game.board[5][6] = { type: "queen", color: "white" };
      game.currentPlayer = "black";
      expect(isStalemate(game.board, "black")).toBe(true);
    });
  });

  describe("Insufficient material", () => {
    it("king vs king", () => {
      const game = createGame();
      for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) game.board[r][c] = null;
      game.board[0][0] = { type: "king", color: "white" };
      game.board[7][7] = { type: "king", color: "black" };
      expect(isInsufficientMaterial(game.board)).toBe(true);
    });

    it("king and bishop vs king", () => {
      const game = createGame();
      for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) game.board[r][c] = null;
      game.board[0][0] = { type: "king", color: "white" };
      game.board[7][7] = { type: "king", color: "black" };
      game.board[2][2] = { type: "bishop", color: "white" };
      expect(isInsufficientMaterial(game.board)).toBe(true);
    });
  });

  describe("Undo", () => {
    it("restores board, player, and status after undo", () => {
      const game = createGame();
      const fenBefore = exportFEN(game);
      makeMove(game, { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } });
      expect(game.currentPlayer).toBe("black");
      undoMove(game);
      expect(game.currentPlayer).toBe("white");
      expect(exportFEN(game)).toBe(fenBefore);
    });

    it("undoes castling correctly", () => {
      const game = createGame();
      game.board[0][5] = null;
      game.board[0][6] = null;

      const castleMove = getLegalMoves(game, { row: 0, col: 4 }).find(
        (m) => m.isCastling && m.to.col === 6
      );
      const fenBefore = exportFEN(game);
      makeMove(game, castleMove!);
      undoMove(game);
      expect(exportFEN(game)).toBe(fenBefore);
    });

    it("undoes en passant correctly", () => {
      const game = createGame();
      for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) game.board[r][c] = null;
      game.board[0][4] = { type: "king", color: "white" };
      game.board[7][4] = { type: "king", color: "black" };
      game.board[4][4] = { type: "pawn", color: "white", hasMoved: true };
      game.board[6][3] = { type: "pawn", color: "black" };
      game.currentPlayer = "black";
      game.castlingRights = { whiteKingSide: false, whiteQueenSide: false, blackKingSide: false, blackQueenSide: false };

      makeMove(game, { from: { row: 6, col: 3 }, to: { row: 4, col: 3 } });
      const fenBefore = exportFEN(game);
      const epMove = getLegalMoves(game, { row: 4, col: 4 }).find((m) => m.isEnPassant);
      makeMove(game, epMove!);
      undoMove(game);
      expect(exportFEN(game)).toBe(fenBefore);
    });

    it("undoes promotion correctly", () => {
      const game = createGame();
      for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) game.board[r][c] = null;
      game.board[0][0] = { type: "king", color: "white" };
      game.board[7][7] = { type: "king", color: "black" };
      game.board[6][0] = { type: "pawn", color: "white", hasMoved: true };
      game.castlingRights = { whiteKingSide: false, whiteQueenSide: false, blackKingSide: false, blackQueenSide: false };

      const fenBefore = exportFEN(game);
      makeMove(game, { from: { row: 6, col: 0 }, to: { row: 7, col: 0 }, promotion: "queen" });
      undoMove(game);
      expect(exportFEN(game)).toBe(fenBefore);
    });
  });

  describe("FEN", () => {
    it("exports starting position FEN", () => {
      const game = createGame();
      const fen = exportFEN(game);
      expect(fen).toBe("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    });

    it("round-trips FEN correctly", () => {
      const game = createGame();
      makeMove(game, { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } });
      const fen = exportFEN(game);
      const loaded = loadFEN(fen);
      expect(loaded).not.toBeNull();
      expect(exportFEN(loaded!)).toBe(fen);
    });

    it("loads a custom FEN", () => {
      const fen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";
      const game = loadFEN(fen);
      expect(game).not.toBeNull();
      expect(game!.currentPlayer).toBe("black");
      expect(game!.board[3][4]?.type).toBe("pawn");
      expect(game!.enPassantTarget).toEqual({ row: 2, col: 4 });
    });

    it("rejects invalid FEN", () => {
      const game = loadFEN("invalid fen string");
      expect(game).toBeNull();
    });
  });

  describe("SAN notation", () => {
    it("records moves in SAN format", () => {
      const game = createGame();
      makeMove(game, { from: { row: 1, col: 4 }, to: { row: 3, col: 4 } });
      expect(game.history[0].san).toBe("e4");
    });
  });
});
