
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useMemo, useState, useEffect } from 'react';
import { Chess, Square as ChessJSSquare } from 'chess.js';
import { PieceInstance } from '../types';
import Square from './Square';
import Piece from './Piece';

// Define the props interface for the Chessboard component
interface ChessboardProps {
  game: Chess;
  pieceInstances: Record<string, PieceInstance | null>;
  selectedSquare: ChessJSSquare | null;
  onSquareClick: (square: ChessJSSquare) => void;
  onSquareHover: (square: ChessJSSquare | null) => void;
}

/**
 * A React component that renders an interactive chessboard by mapping over
 * ranks and files to create individual Square components.
 */
const Chessboard = React.forwardRef<HTMLDivElement, ChessboardProps>((props, ref) => {
  const files = useMemo(() => ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], []);
  const ranks = useMemo(() => ['8', '7', '6', '5', '4', '3', '2', '1'], []);
  const [boardSize, setBoardSize] = useState(0);

  useEffect(() => {
    const boardEl = (ref as React.RefObject<HTMLDivElement>)?.current;
    if (!boardEl) return;
  
    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0]) {
        setBoardSize(entries[0].contentRect.width);
      }
    });
  
    resizeObserver.observe(boardEl);
    // Initial size set
    setBoardSize(boardEl.offsetWidth);
    return () => resizeObserver.disconnect();
  }, [ref]);
  
  const squareSize = boardSize / 8;
  const pieces = Object.values(props.pieceInstances)
    .filter((p): p is PieceInstance => !!p)
    .sort((a, b) => a.id.localeCompare(b.id)); // Ensure stable order for animations

  return (
    <div className="board-container">
      <div className="chessboard" ref={ref} onMouseLeave={() => props.onSquareHover(null)}>
        {ranks.map((rank, rankIndex) =>
          files.map((file, fileIndex) => {
            const squareName = `${file}${rank}` as ChessJSSquare;
            return (
              <Square
                key={squareName}
                squareName={squareName}
                isLight={(rankIndex + fileIndex) % 2 === 0}
                pieceOnSquare={props.game.get(squareName)}
                isSelected={props.selectedSquare === squareName}
                onSquareClick={props.onSquareClick}
                onSquareHover={props.onSquareHover}
              />
            );
          })
        )}
        <div className="piece-layer">
          {pieces.map(piece => (
            <Piece
              key={piece.id}
              piece={piece}
              squareSize={squareSize}
              isSelected={props.selectedSquare === piece.square}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

export default Chessboard;
