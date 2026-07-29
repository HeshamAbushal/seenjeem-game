import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { socket } from './socket';
import { AuthModal } from './components/AuthModal';
import { AuthScreen } from './components/AuthScreen';
import { CategoryPickerScreen } from './components/CategoryPickerScreen';
import { SavedGamesScreen } from './components/SavedGamesScreen';

// Match backend state interfaces
enum GameStage {
  LOBBY = 'LOBBY',
  BOARD = 'BOARD',
  QUESTION_ACTIVE = 'QUESTION_ACTIVE',
  BUZZED_IN = 'BUZZED_IN',
  ANSWER_REVEAL = 'ANSWER_REVEAL',
  GAME_OVER = 'GAME_OVER'
}

interface Team {
  id: 'team_1' | 'team_2';
  name: string;
  leaderSocketId: string | null;
  score: number;
}

interface Question {
  id: string;
  category: string;
  points: number;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  played: boolean;
}

interface GameState {
  roomId: string;
  gameMode: 'MULTIPLE_CHOICE' | 'OPEN_QUESTION';
  stage: GameStage;
  teams: {
    team_1: Team;
    team_2: Team;
  };
  categories: string[];
  questions: { [id: string]: Question };
  activeQuestionId: string | null;
  selectingTeamId: 'team_1' | 'team_2';
  buzzedTeamId: 'team_1' | 'team_2' | null;
  buzzTimeRemaining: number;
  answerTimeRemaining: number | null;
  isStealTurn?: boolean;
  isOpenAnswerRevealed?: boolean;
  winnerTeamId: 'team_1' | 'team_2' | null;
}

function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [timerInfo, setTimerInfo] = useState<{ timerType: 'BUZZ' | 'ANSWER'; secondsRemaining: number } | null>(null);
  const [connected, setConnected] = useState(false);

  // Router & Auth states
  const [isMobileController, setIsMobileController] = useState(false);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<'team_1' | 'team_2'>('team_1');
  const [joinedTeamId, setJoinedTeamId] = useState<'team_1' | 'team_2' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auth User state
  const [currentUser, setCurrentUser] = useState<{ username: string; email: string; name: string } | null>(() => {
    try {
      const saved = localStorage.getItem('seen_jeem_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [hasConfirmedCategories, setHasConfirmedCategories] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [isViewingSavedGames, setIsViewingSavedGames] = useState(false);

  useEffect(() => {
    // Detect if page is opened as mobile controller via url parameters
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    const isJoin = params.get('join') === 'true' || !!roomParam;
    
    if (isJoin) {
      setIsMobileController(true);
      if (roomParam) {
        setRoomCodeInput(roomParam.toUpperCase());
      }
    }

    socket.on('connect', () => {
      setConnected(true);
      // ONLY the TV screen emits create_room automatically.
      // Mobile controller waits for manual join button click.
      if (!isJoin) {
        socket.emit('create_room');
      }
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('room_created', (data: { roomId: string; state: GameState }) => {
      setGameState(data.state);
    });

    socket.on('sync_state', (state: GameState) => {
      setGameState(state);
      setTimerInfo(null);
    });

    socket.on('timer_tick', (tick: { timerType: 'BUZZ' | 'ANSWER'; secondsRemaining: number }) => {
      setTimerInfo(tick);
    });

    socket.on('join_success', (data: { teamId: 'team_1' | 'team_2'; state: GameState }) => {
      setJoinedTeamId(data.teamId);
      setGameState(data.state);
      setErrorMessage(null);
    });

    socket.on('join_error', (data: { message: string }) => {
      setErrorMessage(data.message);
    });

    if (socket.connected) {
      setConnected(true);
      if (!isJoin) {
        socket.emit('create_room');
      }
    }

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('room_created');
      socket.off('sync_state');
      socket.off('timer_tick');
      socket.off('join_success');
      socket.off('join_error');
    };
  }, []);

  const [customTeamName, setCustomTeamName] = useState('');

  const handleJoinRoom = () => {
    if (!roomCodeInput.trim()) {
      setErrorMessage('الرجاء إدخال رمز الغرفة');
      return;
    }
    socket.emit('join_room', {
      roomId: roomCodeInput.toUpperCase().trim(),
      teamId: selectedTeam,
      teamName: customTeamName.trim()
    });
  };

  if (!connected) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
        <div style={{ fontSize: '2rem', fontWeight: '900', color: '#f59e0b', textAlign: 'center' }}>
          {isMobileController ? 'تحكم سين جيم' : 'سين جيم - مسابقة المعلومات العامة الكبرى'}
        </div>
        <div style={{ fontSize: '1.2rem', color: '#fff' }}>جاري الاتصال بخادم اللعبة...</div>
        <div className="spinner" style={{
          width: '50px', height: '50px', border: '5px solid rgba(255,255,255,0.1)', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ----------------------------------------------------
  // MOBILE WEB CONTROLLER INTERFACE
  // ----------------------------------------------------
  if (isMobileController) {
    // Stage 0: Waiting to Join Room
    if (!joinedTeamId || !gameState) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: '30px', gap: '20px', direction: 'rtl' }}>
          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <span style={{ fontSize: '3rem' }}>🎮</span>
            <h1 style={{ fontSize: '2rem', fontWeight: '900', color: '#f59e0b', marginTop: '10px' }}>تحكم سين جيم</h1>
            <p style={{ color: '#a1a1aa', fontSize: '0.95rem' }}>لوحة التحكم لقادة الفرق</p>
          </div>

          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', padding: '24px', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#f59e0b', fontWeight: 'bold' }}>رمز الغرفة:</label>
              <input
                type="text"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                placeholder="مثال: ABU12"
                style={{
                  width: '100%', padding: '15px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '1.5rem', fontWeight: 'bold',
                  textAlign: 'center', letterSpacing: '2px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#ff6b00', fontWeight: 'bold' }}>اختر الفريق:</label>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <button
                  onClick={() => setSelectedTeam('team_1')}
                  style={{
                    flex: 1, padding: '14px', borderRadius: '12px', cursor: 'pointer',
                    background: selectedTeam === 'team_1' ? '#ff6b00' : 'rgba(255,255,255,0.05)',
                    color: '#fff', fontWeight: 'bold', border: `1.5px solid ${selectedTeam === 'team_1' ? '#ffffff' : 'transparent'}`
                  }}
                >
                  الفريق الأول (1)
                </button>
                <button
                  onClick={() => setSelectedTeam('team_2')}
                  style={{
                    flex: 1, padding: '14px', borderRadius: '12px', cursor: 'pointer',
                    background: selectedTeam === 'team_2' ? '#3b82f6' : 'rgba(255,255,255,0.05)',
                    color: '#fff', fontWeight: 'bold', border: `1.5px solid ${selectedTeam === 'team_2' ? '#ffffff' : 'transparent'}`
                  }}
                >
                  الفريق الثاني (2)
                </button>
              </div>

              <label style={{ display: 'block', marginBottom: '8px', color: '#ff6b00', fontWeight: 'bold' }}>اسم فريقك الخـاص ✍️:</label>
              <input
                type="text"
                value={customTeamName}
                onChange={(e) => setCustomTeamName(e.target.value)}
                placeholder="اكتب اسم فريقك هنا (مثال: نشامى التحدي، فرسان المعرفة)"
                style={{
                  width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid rgba(255,107,0,0.4)',
                  background: 'rgba(255,255,255,0.06)', color: '#ffffff', fontSize: '1rem', outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>

            {errorMessage && (
              <div style={{ color: '#ef4444', textAlign: 'center', fontWeight: 'bold', fontSize: '0.95rem' }}>
                ⚠️ {errorMessage}
              </div>
            )}

            <button
              onClick={handleJoinRoom}
              style={{
                width: '100%', padding: '16px', borderRadius: '10px', border: 'none', fontSize: '1.2rem',
                fontWeight: 'bold', background: '#f59e0b', color: '#000', cursor: 'pointer', marginTop: '10px'
              }}
            >
              انضم للفريق ودخول اللعبة
            </button>
          </div>
        </div>
      );
    }

    // Stage 1+: Render controller screen
    const myTeamName = gameState.teams[joinedTeamId].name;
    const opponentId = joinedTeamId === 'team_1' ? 'team_2' : 'team_1';
    const opponentName = gameState.teams[opponentId].name;
    const isMyTurn = gameState.selectingTeamId === joinedTeamId;

    // Mobile Stage: Lobby
    if (gameState.stage === GameStage.LOBBY) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: '30px', justifyContent: 'center', alignItems: 'center', gap: '20px', direction: 'rtl' }}>
          <span style={{ fontSize: '4rem' }}>✓</span>
          <h1 style={{ fontSize: '2rem', color: '#10b981', fontWeight: '900' }}>تم الانضمام بنجاح!</h1>
          <p style={{ fontSize: '1.2rem', color: '#fff', textAlign: 'center' }}>
            أنت الآن قائد: <strong style={{ color: '#f59e0b' }}>{myTeamName}</strong>
          </p>
          <div className="glass-panel" style={{ padding: '20px', textAlign: 'center', width: '100%' }}>
            بانتظار بدء اللعبة من شاشة التلفاز الرئيسية...
          </div>
        </div>
      );
    }

    // Mobile Stage: Board (Question selection)
    if (gameState.stage === GameStage.BOARD) {
      const getQuestionsForCategory = (catName: string) => {
        return Object.values(gameState.questions)
          .filter(q => q.category === catName)
          .sort((a, b) => a.points - b.points);
      };

      const handleSelectQuestion = (qId: string) => {
        socket.emit('select_question', { roomId: gameState.roomId, questionId: qId });
      };

      return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', direction: 'rtl' }}>
          <div style={{ padding: '16px', background: isMyTurn ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.02)', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 style={{ fontSize: '1.2rem', color: isMyTurn ? '#10b981' : '#f59e0b', fontWeight: 'bold' }}>
              {isMyTurn ? 'دورك في الاختيار! اضغط لتحديد سؤال:' : `انتظر اختيار السؤال من: ${opponentName}`}
            </h2>
          </div>

          <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
            {gameState.categories.map((cat, catIdx) => {
              const catQuestions = getQuestionsForCategory(cat);
              return (
                <div key={catIdx} style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '1rem', color: '#f59e0b', fontWeight: 'bold', marginBottom: '8px' }}>{cat}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
                    {catQuestions.map((q) => (
                      <button
                        key={q.id}
                        onClick={() => handleSelectQuestion(q.id)}
                        disabled={q.played || !isMyTurn}
                        style={{
                          height: '45px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold',
                          background: q.played 
                            ? 'rgba(255,255,255,0.03)' 
                            : (isMyTurn ? '#2563eb' : 'rgba(255,255,255,0.05)'),
                          color: q.played ? 'rgba(255,255,255,0.1)' : '#fff',
                          border: `1px solid ${q.played ? 'transparent' : (isMyTurn ? '#3b82f6' : 'rgba(255,255,255,0.1)')}`,
                          cursor: q.played || !isMyTurn ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {q.played ? '✓' : q.points}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Mobile Stage: Question Active (Buzz Screen)
    if (gameState.stage === GameStage.QUESTION_ACTIVE) {
      const seconds = timerInfo ? timerInfo.secondsRemaining : gameState.buzzTimeRemaining;
      return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', padding: '30px', gap: '30px', direction: 'rtl' }}>
          <h2 style={{ fontSize: '1.4rem', color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>أسرع بالضغط على الجرس للإجابة!</h2>
          <button
            onClick={() => socket.emit('buzz_in', { roomId: gameState.roomId, teamId: joinedTeamId })}
            style={{
              width: '200px', height: '200px', borderRadius: '50%', border: '8px solid #fff',
              background: '#ef4444', color: '#fff', fontSize: '2.5rem', fontWeight: '900', cursor: 'pointer',
              boxShadow: '0 0 40px rgba(239, 68, 68, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            اضغط 🔔
          </button>
          <div style={{ fontSize: '1.2rem', color: '#a1a1aa' }}>الوقت المتبقي للكبس: {seconds} ث</div>
        </div>
      );
    }

    // Mobile Stage: Buzzed In (Answer Selection / Open Question)
    if (gameState.stage === GameStage.BUZZED_IN) {
      if (gameState.gameMode === 'OPEN_QUESTION') {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', padding: '30px', gap: '20px', direction: 'rtl' }}>
            <span style={{ fontSize: '4rem' }}>🗣️</span>
            <h2 style={{ fontSize: '1.8rem', color: '#f59e0b', textAlign: 'center', fontWeight: 'bold' }}>
              سؤال مفتوح بدون خيارات!
            </h2>
            <p style={{ color: '#fff', fontSize: '1.2rem', textAlign: 'center', lineHeight: '1.6' }}>
              أجب شفهياً على السؤال بصوت واضح لمدير اللعبة!
            </p>
            <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', width: '100%', color: '#a1a1aa' }}>
              راقب شاشة التلفاز الرئيسية لكشف الإجابة وتقييم النتيجة. 👁️
            </div>
          </div>
        );
      }

      const buzzedTeamId = gameState.buzzedTeamId;
      const isMyBuzz = buzzedTeamId === joinedTeamId;
      const isSteal = !!gameState.isStealTurn;
      const buzzedTeamName = buzzedTeamId ? gameState.teams[buzzedTeamId]?.name : '';

      if (!isMyBuzz) {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', padding: '30px', gap: '20px', direction: 'rtl' }}>
            <span style={{ fontSize: '4rem' }}>{isSteal ? '🔄' : '🔒'}</span>
            <h2 style={{ fontSize: '1.6rem', color: isSteal ? '#3b82f6' : '#fff', textAlign: 'center', fontWeight: 'bold' }}>
              {isSteal ? 'السؤال تحوّل للفريق الآخر!' : 'تم قفل الجرس!'}
            </h2>
            <p style={{ color: '#a1a1aa', fontSize: '1.1rem', textAlign: 'center' }}>
              {isSteal ? 'الفرصة المرتدة بدون وقت محدد عند فريق:' : 'الفرصة للإجابة عند فريق:'}{' '}
              <strong style={{ color: '#f59e0b' }}>{buzzedTeamName}</strong>
            </p>
          </div>
        );
      }

      const question = gameState.questions[gameState.activeQuestionId!];
      const handleSelectOption = (idx: number) => {
        socket.emit('submit_answer', { roomId: gameState.roomId, teamId: joinedTeamId, answerIndex: idx });
      };

      return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: '20px', gap: '20px', direction: 'rtl' }}>
          <div className="glass-panel" style={{ padding: '20px', textAlign: 'center', border: isSteal ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)' }}>
            {isSteal && (
              <div style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '1rem', marginBottom: '6px' }}>
                ⚡ فرصة مرتدة - بدون وقت محدد!
              </div>
            )}
            <h3 style={{ fontSize: '1.2rem', color: '#f59e0b', marginBottom: '8px' }}>{question.category}</h3>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{question.questionText}</h2>
          </div>

          <h3 style={{ textAlign: 'center', color: isSteal ? '#3b82f6' : '#a1a1aa', fontSize: '0.95rem', fontWeight: 'bold' }}>
            {isSteal ? '🔥 لديك الوقت الكافي للتفكير.. اختر الإجابة الصحيحة:' : 'اختر الإجابة الصحيحة الآن:'}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            {question.options.map((opt, idx) => {
              const letter = ['أ', 'ب', 'ج', 'د'][idx];
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  style={{
                    display: 'flex', width: '100%', padding: '16px', borderRadius: '10px', border: '1px solid #f59e0b',
                    background: '#1f1642', color: '#fff', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer',
                    textAlign: 'right', alignItems: 'center', gap: '15px'
                  }}
                >
                  <span style={{
                    width: '32px', height: '32px', borderRadius: '50%', background: '#f59e0b', color: '#000',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 'bold'
                  }}>
                    {letter}
                  </span>
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    // Mobile Stage: Answer Reveal
    if (gameState.stage === GameStage.ANSWER_REVEAL) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', padding: '30px', gap: '20px', direction: 'rtl' }}>
          <span style={{ fontSize: '4rem' }}>👁️</span>
          <h2 style={{ fontSize: '1.8rem', color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>تم كشف الإجابة!</h2>
          <p style={{ color: '#a1a1aa', fontSize: '1.1rem', textAlign: 'center' }}>
            راقب شاشة التلفاز لرؤية تعديل النقاط ومقولة أبو سعيد...
          </p>
        </div>
      );
    }

    // Mobile Stage: Game Over
    if (gameState.stage === GameStage.GAME_OVER) {
      const winnerId = gameState.winnerTeamId;
      const isWinner = winnerId === joinedTeamId;
      const isDraw = winnerId === null;

      return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', padding: '30px', gap: '20px', direction: 'rtl' }}>
          <span style={{ fontSize: '5rem' }}>{isDraw ? '🤝' : (isWinner ? '🏆' : '😢')}</span>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 'bold', color: isDraw ? '#f59e0b' : (isWinner ? '#10b981' : '#ef4444') }}>
            {isDraw ? 'تعادل حاسم!' : (isWinner ? 'فزتم بالتحدي!' : 'هاردلك!')}
          </h2>
          <p style={{ color: '#fff', fontSize: '1.2rem', textAlign: 'center' }}>
            {isDraw 
              ? 'تساوت النقاط في نهاية الحلبة!' 
              : (isWinner ? 'بيضتوا الوجه وطرتوا بالكيرف يا أبطال!' : 'معوضين خير في التحديات القادمة!')}
          </p>
          <button
            onClick={() => socket.emit('reset_game', { roomId: gameState.roomId })}
            style={{
              marginTop: '30px', padding: '14px 30px', borderRadius: '30px', border: 'none',
              background: 'linear-gradient(90deg, #f59e0b, #3b82f6)', color: '#fff', fontWeight: 'bold',
              fontSize: '1.1rem', cursor: 'pointer'
            }}
          >
            لعب جولة أخرى 🔄
          </button>
        </div>
      );
    }
  }

  // If we are here, we are on the TV Host screen. We MUST have a gameState.
  if (!gameState) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
        <div style={{ fontSize: '1.2rem', color: '#fff' }}>جاري تحميل حالة اللعبة...</div>
      </div>
    );
  }

  // ----------------------------------------------------
  // TV / HOST DISPLAY INTERFACE (DESKTOP)
  // ----------------------------------------------------
  const renderLobby = () => {
    // Detect if running on localhost and fallback to local LAN IP for mobile scanning
    const hostIp = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? '192.168.100.66' 
      : window.location.hostname;
    
    const joinUrl = `${window.location.protocol}//${hostIp}:${window.location.port}/?room=${gameState.roomId}&join=true`;
    const directMobileUrl = `${window.location.protocol}//${hostIp}:${window.location.port}/?join=true`;

    const t1Connected = !!gameState.teams.team_1.leaderSocketId;
    const t2Connected = !!gameState.teams.team_2.leaderSocketId;
    const canStart = t1Connected && t2Connected;

    const handleStart = () => {
      socket.emit('start_game', { roomId: gameState.roomId, categories: selectedCategoryIds });
    };

    return (
      <div style={{ display: 'flex', flex: 1, padding: '40px', gap: '40px', alignItems: 'center' }}>
        {/* Left Side: Connection Details */}
        <div className="glass-panel" style={{ flex: 1.2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '20px', height: '80%' }}>
          <h2 style={{ fontSize: '1.8rem', color: '#a1a1aa' }}>امسح الباركود للمشاركة بالهاتف</h2>
          <div style={{ background: '#fff', padding: '16px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <QRCodeSVG value={joinUrl} size={220} />
          </div>
          
          <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', padding: '10px 20px', borderRadius: '10px', width: '100%' }}>
            <div style={{ fontSize: '0.9rem', color: '#a1a1aa', marginBottom: '4px' }}>أو من متصفح الجوال افتح الرابط:</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#3b82f6', letterSpacing: '0.5px' }}>{directMobileUrl}</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontSize: '1.1rem', color: '#fff', opacity: 0.8 }}>رمز الغرفة:</span>
            <div style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '4px', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '4px 24px', borderRadius: '12px', border: '2px dashed #f59e0b' }}>
              {gameState.roomId}
            </div>
          </div>
        </div>

        {/* Right Side: Team Setup */}
        <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '40px', gap: '30px', height: '80%', justifyContent: 'space-between' }}>
          <div>
            <h1 className="title-main" style={{ textAlign: 'center', marginBottom: '20px' }}>تحدي سين جيم - مسابقة المعلومات العامة</h1>
            <p style={{ textAlign: 'center', color: '#fff', fontSize: '1.2rem', marginBottom: '30px', fontWeight: 'bold' }}>
              بانتظار قادة الفرق للدخول إلى الحلبة! 🍊
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Team 1 Card */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderRadius: '14px',
                background: t1Connected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)',
                border: `1.5px solid ${t1Connected ? '#10b981' : 'rgba(255, 107, 0, 0.3)'}`
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, marginLeft: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>✏️</span>
                    <input
                      type="text"
                      value={gameState.teams.team_1.name}
                      onChange={(e) => socket.emit('update_team_name', { roomId: gameState.roomId, teamId: 'team_1', teamName: e.target.value })}
                      placeholder="اسم الفريق الأول"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        borderBottom: '1.5px dashed #ff6b00',
                        color: '#ff6b00',
                        fontSize: '1.4rem',
                        fontWeight: 'bold',
                        outline: 'none',
                        width: '100%'
                      }}
                    />
                  </div>
                  <span style={{ color: t1Connected ? '#10b981' : '#ef4444', fontSize: '0.9rem', fontWeight: 'bold', marginTop: '4px' }}>
                    {t1Connected ? 'قائد الفريق متصل ✓' : 'بانتظار انضمام قائد الفريق... (انقر لتعديل الاسم)'}
                  </span>
                </div>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: t1Connected ? '#10b981' : '#ef4444', boxShadow: t1Connected ? '0 0 10px #10b981' : 'none' }}></div>
              </div>

              {/* Team 2 Card */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderRadius: '14px',
                background: t2Connected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)',
                border: `1.5px solid ${t2Connected ? '#10b981' : 'rgba(255, 107, 0, 0.3)'}`
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, marginLeft: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>✏️</span>
                    <input
                      type="text"
                      value={gameState.teams.team_2.name}
                      onChange={(e) => socket.emit('update_team_name', { roomId: gameState.roomId, teamId: 'team_2', teamName: e.target.value })}
                      placeholder="اسم الفريق الثاني"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        borderBottom: '1.5px dashed #3b82f6',
                        color: '#3b82f6',
                        fontSize: '1.4rem',
                        fontWeight: 'bold',
                        outline: 'none',
                        width: '100%'
                      }}
                    />
                  </div>
                  <span style={{ color: t2Connected ? '#10b981' : '#ef4444', fontSize: '0.9rem', fontWeight: 'bold', marginTop: '4px' }}>
                    {t2Connected ? 'قائد الفريق متصل ✓' : 'بانتظار انضمام قائد الفريق... (انقر لتعديل الاسم)'}
                  </span>
                </div>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: t2Connected ? '#10b981' : '#ef4444', boxShadow: t2Connected ? '0 0 10px #10b981' : 'none' }}></div>
              </div>
            </div>

            {/* Game Mode Options */}
            <div style={{ marginTop: '20px', background: 'rgba(255, 107, 0, 0.08)', padding: '18px', borderRadius: '14px', border: '1.5px solid rgba(255, 107, 0, 0.3)' }}>
              <div style={{ fontSize: '1.1rem', color: '#ffffff', fontWeight: 'bold', marginBottom: '12px', textAlign: 'center' }}>
                ⚙️ اختيار نمط اللعب للجولة:
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => socket.emit('set_game_mode', { roomId: gameState.roomId, gameMode: 'MULTIPLE_CHOICE' })}
                  style={{
                    flex: 1, padding: '14px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem',
                    background: (gameState.gameMode || 'MULTIPLE_CHOICE') === 'MULTIPLE_CHOICE' ? '#ff6b00' : 'rgba(255,255,255,0.06)',
                    color: '#ffffff', border: `1.5px solid ${(gameState.gameMode || 'MULTIPLE_CHOICE') === 'MULTIPLE_CHOICE' ? '#ffffff' : 'transparent'}`,
                    boxShadow: (gameState.gameMode || 'MULTIPLE_CHOICE') === 'MULTIPLE_CHOICE' ? '0 0 15px rgba(255, 107, 0, 0.5)' : 'none'
                  }}
                >
                  🔴 أبو ضغطة
                </button>
                <button
                  onClick={() => socket.emit('set_game_mode', { roomId: gameState.roomId, gameMode: 'OPEN_QUESTION' })}
                  style={{
                    flex: 1, padding: '14px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem',
                    background: gameState.gameMode === 'OPEN_QUESTION' ? '#ff6b00' : 'rgba(255,255,255,0.06)',
                    color: '#ffffff', border: `1.5px solid ${gameState.gameMode === 'OPEN_QUESTION' ? '#ffffff' : 'transparent'}`,
                    boxShadow: gameState.gameMode === 'OPEN_QUESTION' ? '0 0 15px rgba(255, 107, 0, 0.5)' : 'none'
                  }}
                >
                  🗣️ سؤال مفتوح (بدون خيارات)
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleStart}
            disabled={!canStart}
            style={{
              width: '100%', height: '60px', borderRadius: '14px', fontSize: '1.45rem', fontWeight: '900',
              cursor: canStart ? 'pointer' : 'not-allowed',
              background: canStart ? 'linear-gradient(90deg, #ff6b00, #ff8533)' : '#27272a',
              color: canStart ? '#ffffff' : '#71717a', border: 'none', transition: 'all 0.3s',
              boxShadow: canStart ? '0 8px 25px rgba(255, 107, 0, 0.5)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box'
            }}
          >
            {canStart ? 'انطلق! ابدأ اللعب 🚀' : 'بانتظار قادة الفرق...'}
          </button>
        </div>
      </div>
    );
  };

  const renderBoard = () => {
    const selectingTeam = gameState.teams[gameState.selectingTeamId];

    const getQuestionsForCategory = (catName: string) => {
      return Object.values(gameState.questions)
        .filter(q => q.category === catName)
        .sort((a, b) => a.points - b.points);
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '0 10px' }}>
          <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '12px 30px', borderRight: '5px solid #ff6b00' }}>
            <span style={{ fontSize: '1.4rem', color: '#ffffff', fontWeight: 'bold' }}>{gameState.teams.team_1.name}</span>
            <span className="score-badge" style={{ color: '#ff6b00' }}>{gameState.teams.team_1.score}</span>
          </div>

          <div className="glass-panel" style={{ padding: '12px 40px', animation: 'pulse-orange 2s infinite', border: '2px solid #ff6b00' }}>
            <span style={{ fontSize: '1.3rem', color: '#cbd5e1' }}>الدور في الاختيار عند:</span>
            <span style={{ fontSize: '1.8rem', fontWeight: '900', color: '#ff6b00', marginRight: '10px' }}>{selectingTeam.name}</span>
          </div>

          <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '12px 30px', borderLeft: '5px solid #ffffff' }}>
            <span className="score-badge" style={{ color: '#ffffff' }}>{gameState.teams.team_2.score}</span>
            <span style={{ fontSize: '1.4rem', color: '#ffffff', fontWeight: 'bold' }}>{gameState.teams.team_2.name}</span>
          </div>
        </div>

        <div className="board-container glass-panel">
          {gameState.categories.map((cat, catIdx) => {
            const catQuestions = getQuestionsForCategory(cat);
            return (
              <div key={catIdx} className="category-column">
                <div className="category-header">{cat}</div>
                {catQuestions.map((q) => (
                  <div
                    key={q.id}
                    className={`question-card ${q.played ? 'played' : 'available'}`}
                  >
                    {q.played ? '✓' : `${q.points}ن`}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderQuestion = () => {
    if (!gameState.activeQuestionId) return null;
    const question = gameState.questions[gameState.activeQuestionId];
    if (!question) return null;

    const isSteal = !!gameState.isStealTurn;
    const seconds = isSteal 
      ? null 
      : (timerInfo ? timerInfo.secondsRemaining : (gameState.stage === GameStage.QUESTION_ACTIVE ? gameState.buzzTimeRemaining : (gameState.answerTimeRemaining ?? 12)));
    const isDanger = seconds !== null && seconds <= 5;

    const buzzedTeam = gameState.buzzedTeamId ? gameState.teams[gameState.buzzedTeamId] : null;

    return (
      <div style={{ display: 'flex', flex: 1, padding: '30px', gap: '25px', flexDirection: 'column', overflowY: 'auto', paddingBottom: '80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid rgba(255,255,255,0.1)', paddingBottom: '15px' }}>
          <div style={{ fontSize: '1.6rem', color: '#f59e0b', fontWeight: 'bold' }}>{question.category}</div>
          <div style={{ fontSize: '2rem', fontWeight: '900', color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)', padding: '5px 25px', borderRadius: '30px' }}>
            {question.points} نقطة
          </div>
        </div>

        <div style={{ display: 'flex', gap: '30px', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '30px', minHeight: '180px' }}>
            <h1 style={{ fontSize: '2.4rem', fontWeight: '900', lineHeight: '1.5', textAlign: 'center' }}>
              {question.questionText}
            </h1>
          </div>

          {gameState.gameMode !== 'OPEN_QUESTION' && (
            <div style={{ width: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
              <div className={`timer-circle ${isDanger ? 'danger' : ''}`}>
                {isSteal ? '∞' : seconds}
              </div>
              <div style={{ fontSize: '1.2rem', color: '#a1a1aa', textAlign: 'center' }}>
                {gameState.stage === GameStage.QUESTION_ACTIVE 
                  ? 'بانتظار الضغط على الجرس...' 
                  : (isSteal ? '🔥 فرصة مرتدة - بدون وقت محدد' : 'بانتظار الجواب من القائد...')}
              </div>
            </div>
          )}
        </div>

        {gameState.gameMode !== 'OPEN_QUESTION' && gameState.stage === GameStage.BUZZED_IN && buzzedTeam && (
          <div style={{
            background: isSteal ? 'rgba(59, 130, 246, 0.25)' : 'rgba(245, 158, 11, 0.25)', 
            border: `2px solid ${isSteal ? '#3b82f6' : '#f59e0b'}`, borderRadius: '12px', padding: '20px',
            textAlign: 'center', fontSize: '2rem', fontWeight: 'bold', animation: 'buzz-flash 1s infinite'
          }}>
            {isSteal 
              ? `🔄 السؤال انتقل لـ (${buzzedTeam.name}) - لا يوجد وقت محدد للإجابة!` 
              : `🔔 ${buzzedTeam.name} ضغط أولاً! الإجابة عندهم الآن...`}
          </div>
        )}

        {gameState.gameMode === 'OPEN_QUESTION' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
            {!gameState.isOpenAnswerRevealed ? (
              <button
                onClick={() => socket.emit('reveal_open_answer', { roomId: gameState.roomId })}
                style={{
                  padding: '20px 40px', borderRadius: '16px', border: 'none', fontSize: '1.6rem', fontWeight: '900',
                  background: 'linear-gradient(90deg, #f59e0b, #3b82f6)', color: '#fff', cursor: 'pointer',
                  boxShadow: '0 8px 25px rgba(245, 158, 11, 0.4)'
                }}
              >
                👁️ كشف الإجابة الصحيحة
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', alignItems: 'center' }}>
                <div className="glass-panel" style={{
                  padding: '20px 40px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)',
                  border: '2px solid #10b981', textAlign: 'center', width: '100%'
                }}>
                  <div style={{ fontSize: '1.2rem', color: '#a1a1aa', marginBottom: '6px' }}>الإجابة الصحيحة هي:</div>
                  <div style={{ fontSize: '2.2rem', fontWeight: '900', color: '#10b981' }}>
                    {question.options[question.correctOptionIndex]}
                  </div>
                </div>

                <div style={{ fontSize: '1.2rem', color: '#f59e0b', fontWeight: 'bold' }}>حدد الفريق الفائز بالنقطة:</div>

                <div style={{ display: 'flex', gap: '20px', width: '100%', justifyContent: 'center' }}>
                  <button
                    onClick={() => socket.emit('host_judge_answer', { roomId: gameState.roomId, outcome: 'team_1' })}
                    style={{
                      flex: 1, padding: '16px', borderRadius: '12px', border: 'none', fontSize: '1.3rem', fontWeight: 'bold',
                      background: '#2563eb', color: '#fff', cursor: 'pointer'
                    }}
                  >
                    ✅ إجابة صحيحة: {gameState.teams.team_1.name}
                  </button>
                  <button
                    onClick={() => socket.emit('host_judge_answer', { roomId: gameState.roomId, outcome: 'team_2' })}
                    style={{
                      flex: 1, padding: '16px', borderRadius: '12px', border: 'none', fontSize: '1.3rem', fontWeight: 'bold',
                      background: '#d97706', color: '#fff', cursor: 'pointer'
                    }}
                  >
                    ✅ إجابة صحيحة: {gameState.teams.team_2.name}
                  </button>
                  <button
                    onClick={() => socket.emit('host_judge_answer', { roomId: gameState.roomId, outcome: 'none' })}
                    style={{
                      flex: 1, padding: '16px', borderRadius: '12px', border: 'none', fontSize: '1.3rem', fontWeight: 'bold',
                      background: '#dc2626', color: '#fff', cursor: 'pointer'
                    }}
                  >
                    ❌ لم يجب أحد / إجابة خاطئة
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {question.options.map((opt, idx) => {
              const letter = ['أ', 'ب', 'ج', 'د'][idx];
              return (
                <div key={idx} className="glass-panel" style={{
                  display: 'flex', padding: '20px 30px', borderRadius: '12px', alignItems: 'center', gap: '25px',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <div style={{
                    width: '45px', height: '45px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 'bold'
                  }}>
                    {letter}
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{opt}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderReveal = () => {
    if (!gameState.activeQuestionId) return null;
    const question = gameState.questions[gameState.activeQuestionId];
    if (!question) return null;

    const buzzedTeam = gameState.buzzedTeamId ? gameState.teams[gameState.buzzedTeamId] : null;

    let quote = 'فوت علينا الفرصة يا غالي!';
    if (buzzedTeam) {
      quote = gameState.teams[gameState.buzzedTeamId!].score > 0 
        ? 'كفوووو! هذا اللعب الصح!' 
        : 'راح عليك الكيرف يا بطل!';
    }

    return (
      <div style={{ display: 'flex', flex: 1, padding: '40px', gap: '30px', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '1.6rem', color: '#f59e0b', fontWeight: 'bold' }}>{question.category}</div>
          <div style={{ fontSize: '1.8rem', color: '#a1a1aa' }}>كشف إجابة السؤال</div>
        </div>

        <div className="glass-panel" style={{ padding: '30px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.2rem', marginBottom: '10px' }}>{question.questionText}</h2>
        </div>

        <div className="glass-panel" style={{
          padding: '24px', textAlign: 'center', borderRadius: '12px',
          background: 'rgba(16, 185, 129, 0.15)', border: '2px solid #10b981',
          animation: 'float 3s ease-in-out infinite'
        }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#10b981', marginBottom: '8px' }}>
            الإجابة الصحيحة هي: {question.options[question.correctOptionIndex]}
          </h1>
          <p style={{ fontSize: '1.6rem', fontStyle: 'italic', color: '#f59e0b' }}>
             "{quote}" 
          </p>
        </div>

        {gameState.gameMode !== 'OPEN_QUESTION' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {question.options.map((opt, idx) => {
              const isCorrectOption = idx === question.correctOptionIndex;
              const letter = ['أ', 'ب', 'ج', 'د'][idx];
              return (
                <div key={idx} className="glass-panel" style={{
                  display: 'flex', padding: '20px 30px', borderRadius: '12px', alignItems: 'center', gap: '25px',
                  background: isCorrectOption ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.01)',
                  border: `2px solid ${isCorrectOption ? '#10b981' : 'rgba(255,255,255,0.1)'}`
                }}>
                  <div style={{
                    width: '45px', height: '45px', borderRadius: '50%',
                    background: isCorrectOption ? '#10b981' : 'rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 'bold'
                  }}>
                    {letter}
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: isCorrectOption ? '#10b981' : '#fff' }}>{opt}</div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ textAlign: 'center', color: '#a1a1aa', fontSize: '1.1rem' }}>
          جاري العودة إلى لوحة الأسئلة تلقائياً بعد قليل...
        </div>
      </div>
    );
  };

  const renderGameOver = () => {
    const t1 = gameState.teams.team_1;
    const t2 = gameState.teams.team_2;

    let winnerText = 'تعادل بطعم الشاورما! الكل فائز!';
    let quote = 'ما فيه خاسر اليوم، الكيرف متزن للجميع!';
    let winnerColor = '#f59e0b';

    if (gameState.winnerTeamId === 'team_1') {
      winnerText = `👑 الفائز هو: ${t1.name}!`;
      quote = 'كفو يا شقردية! طرتوا بالكيرف فوق السحاب!';
      winnerColor = '#3b82f6';
    } else if (gameState.winnerTeamId === 'team_2') {
      winnerText = `👑 الفائز هو: ${t2.name}!`;
      quote = 'يا عيني على السناعيس! لعب احترافي من الطراز الأول!';
      winnerColor = '#f59e0b';
    }

    const handlePlayAgain = () => {
      socket.emit('reset_game', { roomId: gameState.roomId });
    };

    return (
      <div style={{ display: 'flex', flex: 1, padding: '40px', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '30px' }}>
        <h1 style={{ fontSize: '4rem', fontWeight: '900', color: '#f59e0b' }}>نهاية التحدي الكبير</h1>
        
        <div className="glass-panel" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 80px', borderRadius: '20px',
          border: `2px solid ${winnerColor}`, boxShadow: `0 0 30px ${winnerColor}33`, background: 'rgba(255,255,255,0.02)',
          animation: 'float 3s ease-in-out infinite'
        }}>
          <span style={{ fontSize: '5rem' }}>🏆</span>
          <h2 style={{ fontSize: '3rem', fontWeight: 'bold', color: winnerColor, marginTop: '20px' }}>{winnerText}</h2>
          <p style={{ fontSize: '1.8rem', fontStyle: 'italic', color: '#a1a1aa', marginTop: '10px' }}>
            "{quote}"
          </p>
        </div>

        <div style={{ display: 'flex', gap: '40px', width: '60%', marginTop: '20px' }}>
          <div className="glass-panel" style={{ flex: 1, padding: '20px', textAlign: 'center', borderTop: '4px solid #3b82f6' }}>
            <div style={{ fontSize: '1.4rem', color: '#a1a1aa' }}>{t1.name}</div>
            <div style={{ fontSize: '3.5rem', fontWeight: '900', color: '#3b82f6' }}>{t1.score} ن</div>
          </div>
          
          <div className="glass-panel" style={{ flex: 1, padding: '20px', textAlign: 'center', borderTop: '4px solid #f59e0b' }}>
            <div style={{ fontSize: '1.4rem', color: '#a1a1aa' }}>{t2.name}</div>
            <div style={{ fontSize: '3.5rem', fontWeight: '900', color: '#f59e0b' }}>{t2.score} ن</div>
          </div>
        </div>

        <button
          onClick={handlePlayAgain}
          style={{
            marginTop: '30px', padding: '15px 40px', borderRadius: '30px', fontSize: '1.5rem', fontWeight: 'bold',
            background: 'linear-gradient(90deg, #f59e0b, #3b82f6)', color: '#fff', border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
          }}
        >
          جولة جديدة 🔄
        </button>
      </div>
    );
  };

  const renderStage = () => {
    switch (gameState.stage) {
      case GameStage.LOBBY:
        return renderLobby();
      case GameStage.BOARD:
        return renderBoard();
      case GameStage.QUESTION_ACTIVE:
      case GameStage.BUZZED_IN:
        return renderQuestion();
      case GameStage.ANSWER_REVEAL:
        return renderReveal();
      case GameStage.GAME_OVER:
        return renderGameOver();
      default:
        return <div>المرحلة غير محددة</div>;
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('seen_jeem_user');
    setCurrentUser(null);
    setIsViewingSavedGames(false);
    setIsGuestMode(false);
  };

  // Show Auth Landing Screen FIRST for Host if not logged in & not guest
  if (!isMobileController && !currentUser && !isGuestMode) {
    return (
      <AuthScreen
        onLoginSuccess={(user) => setCurrentUser(user)}
        onContinueAsGuest={() => setIsGuestMode(true)}
      />
    );
  }

  // Show Saved Games Screen if Host clicked "ألعابي"
  if (!isMobileController && isViewingSavedGames) {
    return (
      <SavedGamesScreen
        currentUser={currentUser}
        onSelectGameToPlay={(catIds) => {
          setSelectedCategoryIds(catIds);
          setHasConfirmedCategories(true);
          setIsViewingSavedGames(false);
        }}
        onBackToCategories={() => setIsViewingSavedGames(false)}
        onOpenLogin={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
      />
    );
  }

  // Show Category Picker Screen SECOND after Sign In / Guest entry
  if (!isMobileController && !hasConfirmedCategories) {
    return (
      <CategoryPickerScreen
        currentUser={currentUser}
        hostName={currentUser?.name}
        onOpenSavedGames={() => setIsViewingSavedGames(true)}
        onSignOut={handleSignOut}
        onConfirmCategories={(catIds) => {
          setSelectedCategoryIds(catIds);
          setHasConfirmedCategories(true);
        }}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      <header className="glass-panel" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px',
        margin: '10px 10px 0 10px', borderRadius: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '1.6rem', fontWeight: '900', color: '#ff6b00' }}>س</span>
          <span style={{ fontSize: '1.6rem', fontWeight: '900', color: '#ffffff' }}>ج</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>- مسابقة المعلومات العامة الكبرى</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Change Categories button next to Logout button on Lobby screen */}
          {gameState.stage === GameStage.LOBBY && (
            <button
              onClick={() => setHasConfirmedCategories(false)}
              style={{
                height: '48px',
                padding: '0 20px',
                borderRadius: '14px',
                border: '1.5px solid rgba(255, 107, 0, 0.4)',
                background: 'rgba(255, 255, 255, 0.06)',
                color: '#ffffff',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxSizing: 'border-box'
              }}
            >
              ↩️ تغيير التصنيفات
            </button>
          )}

          {currentUser ? (
            <div style={{
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(255, 107, 0, 0.12)',
              padding: '0 18px',
              borderRadius: '14px',
              border: '1px solid rgba(255, 107, 0, 0.4)',
              boxSizing: 'border-box'
            }}>
              <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>👤 {currentUser.name}</span>
              <button
                onClick={handleSignOut}
                style={{
                  background: 'rgba(239, 68, 68, 0.18)',
                  border: '1px solid #ef4444',
                  color: '#ef4444',
                  padding: '5px 12px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 'bold'
                }}
              >
                تسجيل الخروج 🚪
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              style={{
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0 20px',
                borderRadius: '14px',
                border: '1px solid #ff6b00',
                background: 'rgba(255, 107, 0, 0.15)',
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(255, 107, 0, 0.2)',
                boxSizing: 'border-box'
              }}
            >
              <span>👤</span>
              <span>تسجيل الدخول / حساب جديد</span>
            </button>
          )}

          {gameState.stage !== GameStage.LOBBY && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ color: '#a1a1aa' }}>كود الغرفة:</span>
              <span style={{ fontWeight: 'bold', color: '#f59e0b', fontSize: '1.2rem', background: 'rgba(255,255,255,0.05)', padding: '3px 12px', borderRadius: '6px' }}>
                {gameState.roomId}
              </span>
              <button
                onClick={() => socket.emit('end_game_manually', { roomId: gameState.roomId })}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)',
                  padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem'
                }}
              >
                إنهاء اللعبة مبكراً 🛑
              </button>
            </div>
          )}
        </div>
      </header>

      <main style={{ display: 'flex', flex: 1, flexDirection: 'column' }}>
        {renderStage()}
      </main>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(user) => setCurrentUser(user)}
      />
    </div>
  );
}

export default App;
