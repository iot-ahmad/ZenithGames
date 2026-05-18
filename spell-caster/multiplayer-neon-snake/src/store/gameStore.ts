/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { GameState, Player, Orb, WORLD_SIZE, INITIAL_LENGTH, SEGMENT_SPACING, TURN_SPEED, BOOST_SPEED, BASE_SPEED } from '../shared/types';

interface GameStore {
  socket: Socket | null;
  gameState: GameState | null;
  playerId: string | null;
  isOffline: boolean;
  connect: () => void;
  joinGame: () => void;
  sendPlayerState: (data: any) => void;
  sendCollectOrb: (orbId: string) => void;
  switchToOfflineMode: () => void;
}

export const globalGameState: { current: GameState | null } = { current: null };
let lastUiUpdate = 0;
let offlineLoopInterval: any = null;

export const useGameStore = create<GameStore>((set, get) => ({
  socket: null,
  gameState: null,
  playerId: null,
  isOffline: false,
  connect: () => {
    if (get().socket || get().isOffline) return;

    // Start a 1-second timeout to fall back to offline mode if server is unreachable
    const fallbackTimeout = setTimeout(() => {
      if (!get().playerId && !get().isOffline) {
        console.log('Server connection timed out. Switching to offline single-player mode...');
        get().switchToOfflineMode();
      }
    }, 1000);

    try {
      const socket = io({
        timeout: 1000,
        reconnectionAttempts: 1,
        transports: ['websocket']
      });

      socket.on('connect', () => {
        console.log('Connected to multiplayer server successfully');
        clearTimeout(fallbackTimeout);
      });

      socket.on('connect_error', () => {
        console.warn('Socket connection error. Falling back to offline mode...');
        clearTimeout(fallbackTimeout);
        if (!get().playerId && !get().isOffline) {
          get().switchToOfflineMode();
        }
      });

      socket.on('init', (id: string) => {
        set({ playerId: id });
      });

      socket.on('state', (state: GameState) => {
        globalGameState.current = state;
        const now = Date.now();
        if (now - lastUiUpdate > 100) { // Throttle React updates to 10Hz
          set({ gameState: state });
          lastUiUpdate = now;
        }
      });

      set({ socket });
    } catch (e) {
      console.warn('Socket initialization failed. Falling back to offline mode...', e);
      clearTimeout(fallbackTimeout);
      get().switchToOfflineMode();
    }
  },
  switchToOfflineMode: () => {
    if (get().isOffline) return;
    
    // Clear any existing socket connection to be safe
    const { socket } = get();
    if (socket) {
      try { socket.disconnect(); } catch (e) {}
    }

    console.log('Initializing Offline Arena with AI Bots...');

    const COLORS = ['#ff7eb3', '#ffb86c', '#f1fa8c', '#50fa7b', '#8be9fd', '#bd93f9'];
    
    // Generate initial orbs
    const initialOrbs: Record<string, Orb> = {};
    for (let i = 0; i < 150; i++) {
      const id = `orb-${i}-${Math.random()}`;
      initialOrbs[id] = {
        id,
        x: (Math.random() - 0.5) * WORLD_SIZE,
        y: (Math.random() - 0.5) * WORLD_SIZE,
        value: 1,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      };
    }

    const initialGameState: GameState = {
      players: {},
      orbs: initialOrbs,
      leaderboard: [],
    };

    // Populate AI Bots
    const botNames = ['Cyber-Viper', 'Neon-Python', 'Glow-Worm', 'Quantum-Cobb', 'Pixel-Slayer', 'Glitch-Snake'];
    botNames.forEach((name, idx) => {
      const id = `bot-${idx}`;
      const color = COLORS[(idx + 1) % COLORS.length];
      const angle = Math.random() * Math.PI * 2;
      const startX = (Math.random() - 0.5) * (WORLD_SIZE - 30);
      const startY = (Math.random() - 0.5) * (WORLD_SIZE - 30);
      
      const segments = [];
      for (let i = 0; i < INITIAL_LENGTH; i++) {
        segments.push({
          x: startX - Math.cos(angle) * i * SEGMENT_SPACING,
          y: startY - Math.sin(angle) * i * SEGMENT_SPACING,
        });
      }

      initialGameState.players[id] = {
        id,
        name,
        color,
        segments,
        score: INITIAL_LENGTH,
        isBoosting: false,
        state: 'alive',
        currentAngle: angle,
        inputs: { left: false, right: false, boost: false },
      };
    });

    globalGameState.current = initialGameState;
    set({
      isOffline: true,
      playerId: 'local-player',
      gameState: initialGameState,
      socket: null
    });

    // Start 60Hz Local Simulation Loop
    if (offlineLoopInterval) clearInterval(offlineLoopInterval);
    
    const dt = 1 / 60;
    offlineLoopInterval = setInterval(() => {
      const state = globalGameState.current;
      if (!state) return;

      // 1. Move and update AI bots
      for (const id in state.players) {
        if (!id.startsWith('bot-')) continue;
        const bot = state.players[id];
        if (bot.state !== 'alive') continue;

        const head = bot.segments[0];
        if (!head) continue;

        // Find nearest orb to target
        let nearestOrb: Orb | null = null;
        let minDist = Infinity;
        for (const orbId in state.orbs) {
          const orb = state.orbs[orbId];
          const dx = orb.x - head.x;
          const dy = orb.y - head.y;
          const d = dx * dx + dy * dy;
          if (d < minDist) {
            minDist = d;
            nearestOrb = orb;
          }
        }

        // Steer bot towards nearest orb
        let targetAngle = bot.currentAngle;
        if (nearestOrb) {
          targetAngle = Math.atan2(nearestOrb.y - head.y, nearestOrb.x - head.x);
        }

        // Add a bit of noise/wandering
        if (Math.random() < 0.05) {
          targetAngle += (Math.random() - 0.5) * 1.5;
        }

        // Smooth steering
        let angleDiff = targetAngle - bot.currentAngle;
        angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff)); // Normalize to [-PI, PI]
        const maxTurn = TURN_SPEED * dt;
        bot.currentAngle += Math.min(maxTurn, Math.max(-maxTurn, angleDiff));

        // Boosting simulation (AI boosts sometimes when close to food or other bots)
        bot.isBoosting = bot.score > 15 && Math.random() < 0.02;

        const speed = bot.isBoosting ? BOOST_SPEED : BASE_SPEED;
        const newHead = {
          x: head.x + Math.cos(bot.currentAngle) * speed * dt,
          y: head.y + Math.sin(bot.currentAngle) * speed * dt
        };

        // Arena Boundaries
        const boundary = WORLD_SIZE / 2;
        if (newHead.x < -boundary) newHead.x = -boundary;
        if (newHead.x > boundary) newHead.x = boundary;
        if (newHead.y < -boundary) newHead.y = -boundary;
        if (newHead.y > boundary) newHead.y = boundary;

        bot.segments.unshift(newHead);

        // Consume orbs
        for (const orbId in state.orbs) {
          const orb = state.orbs[orbId];
          const dx = newHead.x - orb.x;
          const dy = newHead.y - orb.y;
          if (dx * dx + dy * dy < 4) {
            bot.score += orb.value;
            delete state.orbs[orbId];
            
            // Spawn replacement orb
            const newOrbId = `orb-${Math.random()}`;
            state.orbs[newOrbId] = {
              id: newOrbId,
              x: (Math.random() - 0.5) * WORLD_SIZE,
              y: (Math.random() - 0.5) * WORLD_SIZE,
              value: 1,
              color: COLORS[Math.floor(Math.random() * COLORS.length)]
            };
          }
        }

        // Check if Bot collided with any other alive snake's body segments
        let botDied = false;
        for (const otherId in state.players) {
          const other = state.players[otherId];
          if (other.state !== 'alive') continue;

          // If colliding with self, start checking from segment index 3
          const startIdx = otherId === bot.id ? 3 : 0;
          for (let s = startIdx; s < other.segments.length; s++) {
            const seg = other.segments[s];
            const dx = newHead.x - seg.x;
            const dy = newHead.y - seg.y;
            if (dx * dx + dy * dy < 2.25) {
              botDied = true;
              break;
            }
          }
          if (botDied) break;
        }

        if (botDied) {
          bot.state = 'dead';
          // Drop bot's body parts as glowing orbs
          bot.segments.forEach((seg, i) => {
            if (i % 2 === 0) {
              const newOrbId = `orb-${Math.random()}`;
              state.orbs[newOrbId] = {
                id: newOrbId,
                x: seg.x,
                y: seg.y,
                value: 1,
                color: bot.color
              };
            }
          });

          // Respawn bot after 3 seconds
          setTimeout(() => {
            const currentGs = globalGameState.current;
            if (currentGs && currentGs.players[bot.id]) {
              const b = currentGs.players[bot.id];
              const angle = Math.random() * Math.PI * 2;
              const startX = (Math.random() - 0.5) * (WORLD_SIZE - 30);
              const startY = (Math.random() - 0.5) * (WORLD_SIZE - 30);
              const segments = [];
              for (let i = 0; i < INITIAL_LENGTH; i++) {
                segments.push({
                  x: startX - Math.cos(angle) * i * SEGMENT_SPACING,
                  y: startY - Math.sin(angle) * i * SEGMENT_SPACING,
                });
              }
              b.segments = segments;
              b.score = INITIAL_LENGTH;
              b.state = 'alive';
              b.currentAngle = angle;
            }
          }, 3000);
        } else {
          // Adjust segment length to match score
          const targetLength = Math.floor(bot.score);
          while (bot.segments.length > targetLength) {
            bot.segments.pop();
          }
        }
      }

      // 2. Spawn random orbs up to cap
      if (Object.keys(state.orbs).length < 150 && Math.random() < 0.2) {
        const id = `orb-${Math.random()}`;
        state.orbs[id] = {
          id,
          x: (Math.random() - 0.5) * WORLD_SIZE,
          y: (Math.random() - 0.5) * WORLD_SIZE,
          value: 1,
          color: COLORS[Math.floor(Math.random() * COLORS.length)]
        };
      }

      // 3. Update leaderboard
      state.leaderboard = Object.values(state.players)
        .filter(p => p.state === 'alive')
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map(p => ({ id: p.id, name: p.name, score: Math.floor(p.score), color: p.color }));

      // 4. Throttle React State Updates to 10Hz to save CPU
      const now = Date.now();
      if (now - lastUiUpdate > 100) {
        set({ gameState: { ...state } });
        lastUiUpdate = now;
      }
    }, 1000 / 60);
  },
  joinGame: () => {
    const { isOffline, socket } = get();
    if (isOffline) {
      const state = globalGameState.current;
      if (state) {
        const playerId = 'local-player';
        const name = 'You';
        const color = '#3b82f6'; // Bright neon blue for local player
        const angle = Math.random() * Math.PI * 2;
        const startX = (Math.random() - 0.5) * (WORLD_SIZE - 30);
        const startY = (Math.random() - 0.5) * (WORLD_SIZE - 30);
        
        const segments = [];
        for (let i = 0; i < INITIAL_LENGTH; i++) {
          segments.push({
            x: startX - Math.cos(angle) * i * SEGMENT_SPACING,
            y: startY - Math.sin(angle) * i * SEGMENT_SPACING,
          });
        }
        
        state.players[playerId] = {
          id: playerId,
          name,
          color,
          segments,
          score: INITIAL_LENGTH,
          isBoosting: false,
          state: 'alive',
          currentAngle: angle,
          inputs: { left: false, right: false, boost: false }
        };
        
        set({ playerId, gameState: { ...state } });
      }
    } else if (socket) {
      socket.emit('join');
    }
  },
  sendPlayerState: (data) => {
    const { isOffline, socket } = get();
    if (isOffline) {
      const state = globalGameState.current;
      if (state) {
        const player = state.players['local-player'];
        if (player) {
          player.segments = data.segments;
          player.score = data.score;
          player.currentAngle = data.currentAngle;
          player.isBoosting = data.isBoosting;
          
          if (data.state === 'dead') {
            player.state = 'dead';
            // Drop segments as orbs
            player.segments.forEach((seg, i) => {
              if (i % 2 === 0) {
                const newOrbId = `orb-${Math.random()}`;
                state.orbs[newOrbId] = {
                  id: newOrbId,
                  x: seg.x,
                  y: seg.y,
                  value: 1,
                  color: player.color
                };
              }
            });
          }
        }
      }
    } else if (socket) {
      socket.emit('update_state', data);
    }
  },
  sendCollectOrb: (orbId) => {
    const { isOffline, socket } = get();
    if (isOffline) {
      const state = globalGameState.current;
      if (state && state.orbs[orbId]) {
        delete state.orbs[orbId];
        
        // Spawn a replacement orb
        const COLORS = ['#ff7eb3', '#ffb86c', '#f1fa8c', '#50fa7b', '#8be9fd', '#bd93f9'];
        const newOrbId = `orb-${Math.random()}`;
        state.orbs[newOrbId] = {
          id: newOrbId,
          x: (Math.random() - 0.5) * WORLD_SIZE,
          y: (Math.random() - 0.5) * WORLD_SIZE,
          value: 1,
          color: COLORS[Math.floor(Math.random() * COLORS.length)]
        };
      }
    } else if (socket) {
      socket.emit('collect_orb', orbId);
    }
  },
}));
