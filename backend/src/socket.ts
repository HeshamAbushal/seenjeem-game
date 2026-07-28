import { Server, Socket } from 'socket.io';
import { GameState, GameStage, createInitialState, Question } from './game-state';

const rooms = new Map<string, GameState>();
const activeTimers = new Map<string, NodeJS.Timeout>();

export function setupSockets(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    // Helper: Find room by socket ID (used on disconnect)
    const findRoomBySocket = (socketId: string) => {
      for (const [roomId, state] of rooms.entries()) {
        if (state.teams.team_1.leaderSocketId === socketId) return { roomId, teamId: 'team_1' as const };
        if (state.teams.team_2.leaderSocketId === socketId) return { roomId, teamId: 'team_2' as const };
      }
      return null;
    };

    // Helper: Send state update to room
    const sendStateUpdate = (roomId: string) => {
      const state = rooms.get(roomId);
      if (state) {
        io.to(roomId).emit('sync_state', state);
      }
    };

    // Helper: Clear active timers for a room
    const clearRoomTimer = (roomId: string) => {
      const timer = activeTimers.get(roomId);
      if (timer) {
        clearInterval(timer);
        activeTimers.delete(roomId);
      }
    };

    // TV creates the room
    socket.on('create_room', () => {
      // Generate a short 5-letter room code
      const roomId = Math.random().toString(36).substring(2, 7).toUpperCase();
      const initialState = createInitialState(roomId);
      
      rooms.set(roomId, initialState);
      socket.join(roomId);
      
      console.log(`Room created: ${roomId}`);
      socket.emit('room_created', { roomId, state: initialState });
    });

    // Mobile controller joins the room as a leader
    socket.on('join_room', (data: { roomId: string; teamId: 'team_1' | 'team_2' }) => {
      const { roomId, teamId } = data;
      const state = rooms.get(roomId);

      if (!state) {
        socket.emit('join_error', { message: 'الغرفة غير موجودة' }); // Room does not exist
        return;
      }

      if (teamId !== 'team_1' && teamId !== 'team_2') {
        socket.emit('join_error', { message: 'الفريق غير صالح' }); // Invalid team
        return;
      }

      // Assign socket as leader
      state.teams[teamId].leaderSocketId = socket.id;
      socket.join(roomId);

      console.log(`Socket ${socket.id} joined room ${roomId} as leader for ${teamId}`);
      socket.emit('join_success', { teamId, state });
      sendStateUpdate(roomId);
    });

    // Start Game
    socket.on('start_game', (data: { roomId: string }) => {
      const state = rooms.get(data.roomId);
      if (state && state.stage === GameStage.LOBBY) {
        state.stage = GameStage.BOARD;
        sendStateUpdate(data.roomId);
      }
    });

    // Select Question
    socket.on('select_question', (data: { roomId: string; questionId: string }) => {
      const { roomId, questionId } = data;
      const state = rooms.get(roomId);
      if (!state || state.stage !== GameStage.BOARD) return;

      const question = state.questions[questionId];
      if (!question || question.played) return;

      clearRoomTimer(roomId);

      state.activeQuestionId = questionId;
      state.stage = GameStage.QUESTION_ACTIVE;
      state.buzzedTeamId = null;
      state.buzzTimeRemaining = 20; // 20 seconds to buzz

      sendStateUpdate(roomId);

      // Start buzz countdown timer
      const interval = setInterval(() => {
        const current = rooms.get(roomId);
        if (!current || current.stage !== GameStage.QUESTION_ACTIVE) {
          clearRoomTimer(roomId);
          return;
        }

        current.buzzTimeRemaining -= 1;
        io.to(roomId).emit('timer_tick', { timerType: 'BUZZ', secondsRemaining: current.buzzTimeRemaining });

        if (current.buzzTimeRemaining <= 0) {
          clearRoomTimer(roomId);
          // Auto reveal question as played with no winner, go back to board after a short delay
          question.played = true;
          current.stage = GameStage.ANSWER_REVEAL;
          current.activeQuestionId = questionId;
          sendStateUpdate(roomId);

          setTimeout(() => {
            current.stage = GameStage.BOARD;
            current.activeQuestionId = null;
            sendStateUpdate(roomId);
          }, 3000);
        }
      }, 1000);

      activeTimers.set(roomId, interval);
    });

    // Buzz in
    socket.on('buzz_in', (data: { roomId: string; teamId: 'team_1' | 'team_2' }) => {
      const { roomId, teamId } = data;
      const state = rooms.get(roomId);
      if (!state || state.stage !== GameStage.QUESTION_ACTIVE) return;

      // Lock it in for the first buzzer
      clearRoomTimer(roomId);
      state.stage = GameStage.BUZZED_IN;
      state.buzzedTeamId = teamId;
      state.answerTimeRemaining = 12; // 12 seconds to answer

      sendStateUpdate(roomId);

      // Start answer countdown timer
      const interval = setInterval(() => {
        const current = rooms.get(roomId);
        if (!current || current.stage !== GameStage.BUZZED_IN) {
          clearRoomTimer(roomId);
          return;
        }

        current.answerTimeRemaining -= 1;
        io.to(roomId).emit('timer_tick', { timerType: 'ANSWER', secondsRemaining: current.answerTimeRemaining });

        if (current.answerTimeRemaining <= 0) {
          clearRoomTimer(roomId);
          // Treat as incorrect answer due to timeout
          handleAnswer(roomId, teamId, -1);
        }
      }, 1000);

      activeTimers.set(roomId, interval);
    });

    // Submit Answer
    socket.on('submit_answer', (data: { roomId: string; teamId: 'team_1' | 'team_2'; answerIndex: number }) => {
      const { roomId, teamId, answerIndex } = data;
      const state = rooms.get(roomId);
      if (!state || state.stage !== GameStage.BUZZED_IN || state.buzzedTeamId !== teamId) return;

      clearRoomTimer(roomId);
      handleAnswer(roomId, teamId, answerIndex);
    });

    // Shared handler for answer evaluation
    function handleAnswer(roomId: string, teamId: 'team_1' | 'team_2', answerIndex: number) {
      const state = rooms.get(roomId);
      if (!state || !state.activeQuestionId) return;

      const question = state.questions[state.activeQuestionId];
      if (!question) return;

      const isCorrect = answerIndex === question.correctOptionIndex;
      question.played = true;

      // Scoring
      if (isCorrect) {
        state.teams[teamId].score += question.points;
        // The team that got it correct gets to select next
        state.selectingTeamId = teamId;
      } else {
        // Deduct points
        state.teams[teamId].score = Math.max(0, state.teams[teamId].score - question.points);
        // Switch selector to the other team
        state.selectingTeamId = teamId === 'team_1' ? 'team_2' : 'team_1';
      }

      state.stage = GameStage.ANSWER_REVEAL;
      sendStateUpdate(roomId);

      // After 5 seconds, transition back to board or game over
      setTimeout(() => {
        const current = rooms.get(roomId);
        if (!current) return;

        // Check if all questions have been played
        const allPlayed = Object.values(current.questions).every((q: Question) => q.played);
        
        if (allPlayed) {
          current.stage = GameStage.GAME_OVER;
          
          const score1 = current.teams.team_1.score;
          const score2 = current.teams.team_2.score;
          if (score1 > score2) {
            current.winnerTeamId = 'team_1';
          } else if (score2 > score1) {
            current.winnerTeamId = 'team_2';
          } else {
            current.winnerTeamId = null; // Draw
          }
        } else {
          current.stage = GameStage.BOARD;
          current.activeQuestionId = null;
          current.buzzedTeamId = null;
        }

        sendStateUpdate(roomId);
      }, 5000);
    }

    // Force end game (TV or mobile can request)
    socket.on('end_game_manually', (data: { roomId: string }) => {
      const state = rooms.get(data.roomId);
      if (state) {
        clearRoomTimer(data.roomId);
        state.stage = GameStage.GAME_OVER;
        const score1 = state.teams.team_1.score;
        const score2 = state.teams.team_2.score;
        if (score1 > score2) {
          state.winnerTeamId = 'team_1';
        } else if (score2 > score1) {
          state.winnerTeamId = 'team_2';
        } else {
          state.winnerTeamId = null;
        }
        sendStateUpdate(data.roomId);
      }
    });

    // Reset room
    socket.on('reset_game', (data: { roomId: string }) => {
      const state = rooms.get(data.roomId);
      if (state) {
        clearRoomTimer(data.roomId);
        const resetState = createInitialState(data.roomId);
        // Keep the leaders sockets connected
        resetState.teams.team_1.leaderSocketId = state.teams.team_1.leaderSocketId;
        resetState.teams.team_2.leaderSocketId = state.teams.team_2.leaderSocketId;
        rooms.set(data.roomId, resetState);
        sendStateUpdate(data.roomId);
      }
    });

    // Clean up on disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      const leaderInfo = findRoomBySocket(socket.id);
      if (leaderInfo) {
        const { roomId, teamId } = leaderInfo;
        const state = rooms.get(roomId);
        if (state) {
          state.teams[teamId].leaderSocketId = null;
          console.log(`Leader for ${teamId} in room ${roomId} disconnected.`);
          sendStateUpdate(roomId);
        }
      }
    });
  });
}
