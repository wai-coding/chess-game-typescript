# Changelog

## 1.0.0 - 2026-03-03

### Engine

- Rewrote `createGame()` to remove unreachable code after return
- Fixed `makeMove()` to use matched legal move flags instead of raw input (castling and en passant were silently ignored when called without flags)
- Fixed `makeMove()` missing return value on success
- Added `undoMove()` with full state restoration (board, castling rights, en passant target, half-move clock, full-move number)
- Fixed en passant target not being cleared on non-pawn moves
- Fixed `isCheckmate()` and `isStalemate()` not receiving en passant and castling context
- Fixed `initializeBoard()` pawn rows using `Array.fill()` with shared object references
- Added rook existence check to castling generation
- Added king-in-check guard before allowing castling
- Added half-move clock and full-move number tracking
- Added insufficient material draw detection in status computation
- Added 50-move rule draw detection
- Implemented Standard Algebraic Notation generation with captures, disambiguation, check, and checkmate suffixes
- Implemented FEN export, import, and validation
- Added `findKing()` utility to board module
- Populated `utils.ts` with coordinate conversion helpers
- Removed unused `posEq` from move generator
- Changed `GameStatus` value from `"normal"` to `"playing"` for clarity

### UI

- Fixed board orientation (white at bottom, black at top)
- Added file and rank labels (a-h, 1-8)
- Replaced flat legal move highlighting with dot indicators for empty squares and ring indicators for capturable pieces
- Added smooth background transitions on squares
- Improved check indication color
- Added move history panel with numbered SAN move pairs
- Added FEN display with copy button
- Added FEN input field with validation and load support
- Removed `moveToSAN` from UI layer (chess logic moved to engine)
- Added piece shadows for depth
- Promotion modal now shows piece symbols instead of text labels, with overlay backdrop
- Added global base styles in `index.html`
- Changed "Reset" button label to "New Game"

### Code Quality

- Installed `@types/react` and `@types/react-dom`
- Removed duplicate `vite.config.mjs`
- Rewrote `useGame` hook with proper deep cloning and `useCallback` memoization
- Fixed `useGame` referencing undefined `undoMove` import
- Made all engine modules framework-agnostic with zero React imports
- Removed all unused imports and type parameters
- Removed `row` and `col` props from `Square` component (unused internally)
- Strict TypeScript throughout with no `any` casts

### Tests

- Rewrote all tests with correct board setups
- Fixed en passant test (was testing wrong rank configuration)
- Added tests for: castling execution, en passant capture, undo of castling/en passant/promotion, FEN round-trip, FEN loading, FEN rejection, SAN recording, insufficient material

### Documentation

- Rewrote README with accurate feature list and architecture description
- Rewrote Changelog with structured technical entries

## 0.1.0 - 2026-03-03

- Initial implementation: board rendering, move generation, basic rules, React UI
- Castling, en passant, promotion, check/checkmate/stalemate detection
- Board interaction: click-to-select, move highlighting, promotion modal
- Move history panel, undo and reset
- Unit tests for core rules
