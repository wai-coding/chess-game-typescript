# Chess

A complete chess engine and interactive UI built from scratch in TypeScript.

## Features

- Full legal move generation with check, pin, and absolute pin detection
- Castling (king-side and queen-side) with all intermediate square checks
- En passant with correct timing enforcement
- Pawn promotion with piece selection
- Check, checkmate, and stalemate detection
- Draw detection: insufficient material, 50-move rule
- Standard Algebraic Notation (SAN) with disambiguation, captures, check (+), and checkmate (#)
- FEN import/export with validation
- Undo support that correctly restores all game state (castling rights, en passant, clocks)
- Move history panel with numbered move pairs

## Architecture

The engine (`src/core/`) is fully framework-agnostic. It exposes a pure functional API with no DOM or React dependencies. The UI (`src/ui/`) consumes the engine through a single React hook.

```
src/core/       Chess engine (types, board, rules, move generation, notation)
src/ui/         React components and hooks
```

## Getting Started

```sh
npm install
npm run dev
```

## Testing

```sh
npm test
```

## Build

```sh
npm run build
```

## Tech Stack

- TypeScript
- React 18
- Vite
- Vitest

