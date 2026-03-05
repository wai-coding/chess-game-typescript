import React, { useState } from "react";
import Square from "./Square";
import PieceView from "./Piece";
import PromotionModal from "./PromotionModal";
import { useGame } from "../hooks/useGame";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const SQUARE_SIZE = 56;
const BOARD_SIZE = SQUARE_SIZE * 8;

const Board: React.FC = () => {
  const {
    board,
    selected,
    handleSelect,
    legalMoves,
    lastMove,
    status,
    currentPlayer,
    promotion,
    handlePromotion,
    handleUndo,
    handleReset,
    moveHistory,
    fen,
    handleLoadFEN,
  } = useGame();

  const [fenInput, setFenInput] = useState("");
  const [fenError, setFenError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function isLegalTarget(row: number, col: number) {
    return legalMoves.some((m) => m.to.row === row && m.to.col === col);
  }

  function isLastMove(row: number, col: number) {
    if (!lastMove) return false;
    return (
      (lastMove.from.row === row && lastMove.from.col === col) ||
      (lastMove.to.row === row && lastMove.to.col === col)
    );
  }

  function isSelected(row: number, col: number) {
    return !!selected && selected.row === row && selected.col === col;
  }

  function isKingInCheck(row: number, col: number) {
    if (status !== "check" && status !== "checkmate") return false;
    const piece = board[row][col];
    return !!piece && piece.type === "king" && piece.color === currentPlayer;
  }

  function copyFEN() {
    navigator.clipboard.writeText(fen).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function submitFEN() {
    const err = handleLoadFEN(fenInput.trim());
    if (err) {
      setFenError(err);
    } else {
      setFenError(null);
      setFenInput("");
    }
  }

  const rows = [];
  for (let r = 7; r >= 0; r--) {
    for (let c = 0; c < 8; c++) {
      rows.push({ row: r, col: c, piece: board[r][c] });
    }
  }

  const statusText =
    status === "checkmate"
      ? `${currentPlayer === "white" ? "Black" : "White"} wins by checkmate`
      : status === "stalemate"
        ? "Draw by stalemate"
        : status === "draw"
          ? "Draw by insufficient material"
          : status === "check"
            ? `${currentPlayer === "white" ? "White" : "Black"} is in check`
            : `${currentPlayer === "white" ? "White" : "Black"} to move`;

  const formattedMoves: string[] = [];
  for (let i = 0; i < moveHistory.length; i += 2) {
    const num = Math.floor(i / 2) + 1;
    const white = moveHistory[i];
    const black = moveHistory[i + 1] ?? "";
    formattedMoves.push(`${num}. ${white}${black ? " " + black : ""}`);
  }

  const gameOver = status === "checkmate" || status === "stalemate" || status === "draw";

  return (
    <div style={{ display: "flex", gap: 24, padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <div>
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex" }}>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-around", paddingRight: 4, width: 20 }}>
              {[8, 7, 6, 5, 4, 3, 2, 1].map((rank) => (
                <span key={rank} style={{ fontSize: 12, color: "#666", textAlign: "center", lineHeight: `${SQUARE_SIZE}px` }}>
                  {rank}
                </span>
              ))}
            </div>
            <div>
              <div
                style={{
                  display: "grid",
                  gridTemplateRows: `repeat(8, ${SQUARE_SIZE}px)`,
                  gridTemplateColumns: `repeat(8, ${SQUARE_SIZE}px)`,
                  border: "2px solid #333",
                  borderRadius: 4,
                  overflow: "hidden",
                  width: BOARD_SIZE,
                  height: BOARD_SIZE,
                }}
              >
                {rows.map(({ row, col, piece }) => (
                  <Square
                    key={`${row}-${col}`}
                    isLight={(row + col) % 2 === 1}
                    isSelected={isSelected(row, col)}
                    isLegal={isLegalTarget(row, col)}
                    isLastMove={isLastMove(row, col)}
                    isCheck={isKingInCheck(row, col)}
                    onClick={() => handleSelect({ row, col })}
                  >
                    {piece && <PieceView piece={piece} />}
                  </Square>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-around", paddingTop: 4, width: BOARD_SIZE }}>
                {FILES.map((f) => (
                  <span key={f} style={{ fontSize: 12, color: "#666", width: SQUARE_SIZE, textAlign: "center" }}>
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {promotion && (
            <PromotionModal
              options={promotion.options}
              color={currentPlayer}
              onSelect={handlePromotion}
            />
          )}
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={handleUndo} disabled={gameOver} style={btnStyle}>
            Undo
          </button>
          <button onClick={handleReset} style={btnStyle}>
            New Game
          </button>
        </div>

        <div style={{ marginTop: 8, fontWeight: 600, fontSize: 14, color: statusColor(status) }}>
          {statusText}
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              type="text"
              value={fen}
              readOnly
              style={{
                fontFamily: "monospace",
                fontSize: 12,
                padding: "4px 8px",
                width: 340,
                border: "1px solid #ccc",
                borderRadius: 4,
              }}
            />
            <button onClick={copyFEN} style={{ ...btnStyle, fontSize: 13, padding: "4px 10px" }}>
              {copied ? "Copied" : "Copy FEN"}
            </button>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 6 }}>
            <input
              type="text"
              value={fenInput}
              onChange={(e) => {
                setFenInput(e.target.value);
                setFenError(null);
              }}
              placeholder="Paste FEN to load position"
              style={{
                fontFamily: "monospace",
                fontSize: 12,
                padding: "4px 8px",
                width: 340,
                border: `1px solid ${fenError ? "#e84040" : "#ccc"}`,
                borderRadius: 4,
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitFEN();
              }}
            />
            <button onClick={submitFEN} style={{ ...btnStyle, fontSize: 13, padding: "4px 10px" }}>
              Load
            </button>
          </div>
          {fenError && (
            <div style={{ color: "#e84040", fontSize: 12, marginTop: 4 }}>{fenError}</div>
          )}
        </div>
      </div>

      <div style={{ minWidth: 180 }}>
        <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14, borderBottom: "1px solid #ddd", paddingBottom: 6 }}>
          Moves
        </div>
        <div
          style={{
            maxHeight: BOARD_SIZE,
            overflowY: "auto",
            fontFamily: "monospace",
            fontSize: 13,
            lineHeight: 1.8,
          }}
        >
          {formattedMoves.length === 0 ? (
            <span style={{ color: "#999", fontStyle: "italic", fontFamily: "system-ui, sans-serif" }}>
              No moves yet
            </span>
          ) : (
            formattedMoves.map((line, i) => (
              <div key={i}>{line}</div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const btnStyle: React.CSSProperties = {
  padding: "6px 14px",
  fontSize: 14,
  cursor: "pointer",
  border: "1px solid #bbb",
  borderRadius: 4,
  background: "#f5f5f5",
  fontFamily: "system-ui, sans-serif",
};

function statusColor(status: string): string {
  switch (status) {
    case "checkmate":
      return "#c0392b";
    case "check":
      return "#e67e22";
    case "stalemate":
    case "draw":
      return "#7f8c8d";
    default:
      return "#2c3e50";
  }
}

export default Board;
