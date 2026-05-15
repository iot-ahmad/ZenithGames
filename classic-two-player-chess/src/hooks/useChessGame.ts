
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
// FIX: Import `React` to make the `React.*` type annotations available.
import { useState, useEffect, useCallback } from 'react';
import { Chess, Move, Square } from 'chess.js';
import { PieceInstance } from '../types';

interface UseChessGameProps {
  setImagePromptTemplate: (template: string) => void;
  setPieceImageUrls: (val: any) => void;
}

const pieceTypeMap: Record<string, string> = { p: "Pawn", n: "Knight", b: "Bishop", r: "Rook", q: "Queen", k: "King" };

export function useChessGame({
  setImagePromptTemplate, setPieceImageUrls
}: UseChessGameProps) {
  const [game, setGame] = useState(new Chess());
  const [pieceInstances, setPieceInstances] = useState<Record<string, PieceInstance | null>>({});

  useEffect(() => {
    const initializeGame = async (loadedData: any | null) => {
      const initialGame = new Chess();
      
      const initialInstances: Record<string, PieceInstance> = {};
      initialGame.board().forEach((row, rowIndex) => {
        row.forEach((piece, colIndex) => {
          if (piece) {
            const square = `${String.fromCharCode(97 + colIndex)}${8 - rowIndex}` as Square;
            const id = `${piece.color}_${piece.type}_${square}`;
            
            initialInstances[square] = { 
              id, 
              name: pieceTypeMap[piece.type], 
              personality: { names: [pieceTypeMap[piece.type]], description: "", voice: "", voicePrompt: "" }, 
              ...piece 
            };
          }
        });
      });
      setPieceInstances(initialInstances);
      setGame(initialGame);
    };

    initializeGame(null);
  }, []);

  const executeMove = useCallback((move: Move) => {
    const newGame = new Chess(game.fen());
    try {
      const moveResult = newGame.move(move);
      if (!moveResult) return;
      
      setPieceInstances(prevInstances => {
        const newInstances = { ...prevInstances };
        
        // Handle move
        const movedPiece = newInstances[moveResult.from];
        if (movedPiece) {
          newInstances[moveResult.to] = { ...movedPiece, square: moveResult.to };
          newInstances[moveResult.from] = null;
        }

        // Handle promotion
        if (moveResult.promotion) {
          const { color } = moveResult;
          const id = `${color}_q_${moveResult.to}_promo`;
          newInstances[moveResult.to] = { 
            id, 
            name: "Queen", 
            personality: { names: ["Queen"], description: "", voice: "", voicePrompt: "" }, 
            type: 'q', 
            color, 
            square: moveResult.to 
          };
        }
        
        // Handle Castling
        if (moveResult.flags && (moveResult.flags.includes('k') || moveResult.flags.includes('q'))) {
          const isKingside = moveResult.flags.includes('k');
          const rank = moveResult.color === 'w' ? '1' : '8';
          const rookFrom = `${isKingside ? 'h' : 'a'}${rank}`;
          const rookTo = `${isKingside ? 'f' : 'd'}${rank}`;
          const rook = newInstances[rookFrom];
          if (rook) {
            newInstances[rookTo] = { ...rook, square: rookTo as Square };
            newInstances[rookFrom] = null;
          }
        }

        // Handle en passant
        if (moveResult.flags && moveResult.flags.includes('e')) {
            const capturedSquare = (moveResult.to[0] + moveResult.from[1]) as Square;
            newInstances[capturedSquare] = null;
        }

        return newInstances;
      });
      
      setGame(newGame);
    } catch (e) {
      console.error("Invalid move", e);
    }
  }, [game]);

  return {
    game,
    pieceInstances,
    setPieceInstances,
    executeMove
  };
}
