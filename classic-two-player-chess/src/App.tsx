

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useRef } from 'react';
import Chessboard from './components/Chessboard';
import { useChessGame } from './hooks/useChessGame';
import { useAppInteractions } from './hooks/useAppInteractions';

function App() {
  const boardRef = useRef<HTMLDivElement>(null);

  // Custom hook for managing the core chess game state and logic
  const chessGame = useChessGame({
    setImagePromptTemplate: () => {},
    setPieceImageUrls: () => {},
  });

  // Custom hook for managing user interactions and moves
  const interactions = useAppInteractions({
    game: chessGame.game,
    pieceInstances: chessGame.pieceInstances,
    executeMove: chessGame.executeMove,
  });

  const currentTurn = chessGame.game.turn() === 'w' ? 'White' : 'Black';
  const isGameOver = chessGame.game.isGameOver();
  const isCheck = chessGame.game.inCheck();
  let status = `Turn: ${currentTurn}`;
  
  if (isGameOver) {
    if (chessGame.game.isCheckmate()) {
        status = `Game Over: Checkmate! ${chessGame.game.turn() === 'w' ? 'Black' : 'White'} wins.`;
    } else if (chessGame.game.isDraw()) {
        status = "Game Over: Draw!";
    } else {
        status = "Game Over!";
    }
  } else if (isCheck) {
    status += " (Check!)";
  }

  return (
    <div className="App">
      <header className="game-header">
        <h1>Chess</h1>
        <div className="game-status">{status}</div>
      </header>
      {interactions.error && <p className="error-message">{interactions.error}</p>}
      <main className="game-container">
        <Chessboard
          ref={boardRef}
          game={chessGame.game}
          pieceInstances={chessGame.pieceInstances}
          selectedSquare={interactions.selectedSquare}
          onSquareClick={interactions.handleSquareClick}
          onSquareHover={interactions.setHoveredSquare}
          chattingWith={null}
          isRecording={false}
          talkingVolume={0}
          userVolume={0}
          orbPosition={null}
        />
      </main>
      <footer className="game-footer">
        <button className="reset-btn" onClick={() => window.location.reload()}>Reset Game</button>
      </footer>
    </div>
  );
}

export default App;
