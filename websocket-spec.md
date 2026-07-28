# WebSocket Event Specification: Seen Jeem (سين جيم)

This document defines the real-time events exchanged via Socket.io between the TV client, Mobile controller clients, and the Express backend.

---

## 1. Game State Structure
The backend stores the single source of truth for each room. The state matches the following TypeScript interface:

```typescript
enum GameStage {
  LOBBY = 'LOBBY',
  BOARD = 'BOARD',
  QUESTION_ACTIVE = 'QUESTION_ACTIVE',
  BUZZED_IN = 'BUZZED_IN',
  ANSWER_REVEAL = 'ANSWER_REVEAL',
  GAME_OVER = 'GAME_OVER'
}

interface Team {
  id: string;          // 'team_1' or 'team_2'
  name: string;        // 'الذيبان' or 'النشامى'
  leaderSocketId: string | null;
  score: number;
}

interface Question {
  id: string;
  category: string;
  points: number;      // 10, 20, 30
  questionText: string;
  options: string[];   // 4 options: A, B, C, D
  correctOptionIndex: number;
  played: boolean;
}

interface GameState {
  roomId: string;
  stage: GameStage;
  teams: {
    team_1: Team;
    team_2: Team;
  };
  categories: string[];
  questions: { [id: string]: Question }; // Map of questionId -> Question
  activeQuestionId: string | null;
  selectingTeamId: string;               // Which team selects the next question
  buzzedTeamId: string | null;            // Which team buzzed in first
  buzzTimeRemaining: number;             // Seconds remaining to buzz
  answerTimeRemaining: number;           // Seconds remaining to answer after buzz
  winnerTeamId: string | null;
}
```

---

## 2. Event Flows & Message Payloads

Every client (TV/Mobile) receives state synchronization updates via the `sync_state` event. This keeps the frontend declarative and reactive.

### 2.1 Connection and Initialization

#### `create_room` (TV -> Server)
Initiated by the TV interface to set up a new room.
```json
{
  "event": "create_room"
}
```
* **Response** (Server -> TV): `room_created`
  ```json
  {
    "roomId": "ABU12",
    "state": { /* GameState JSON */ }
  }
  ```

#### `join_room` (Mobile -> Server)
Initiated by a mobile controller to join as a leader for a specific team.
```json
{
  "event": "join_room",
  "data": {
    "roomId": "ABU12",
    "teamId": "team_1"
  }
}
```
* **Response** (Server -> Mobile): `join_success` (or `join_error` if team is already full or room doesn't exist)
  ```json
  {
    "success": true,
    "teamId": "team_1",
    "state": { /* GameState JSON */ }
  }
  ```

---

### 2.2 Gameplay Flow Events

#### `start_game` (Mobile or TV -> Server)
Once both teams are joined, this transitions the game stage from `LOBBY` to `BOARD`.
```json
{
  "event": "start_game",
  "data": {
    "roomId": "ABU12"
  }
}
```

#### `select_question` (Mobile -> Server)
Sent by the selecting team's mobile controller to trigger a question.
```json
{
  "event": "select_question",
  "data": {
    "roomId": "ABU12",
    "questionId": "cat1_10"
  }
}
```
* **Server Action**: Updates stage to `QUESTION_ACTIVE`, sets `activeQuestionId`, starts the countdown, and emits `sync_state` to all.

#### `buzz_in` (Mobile -> Server)
Sent by a team leader to claim the right to answer the question.
```json
{
  "event": "buzz_in",
  "data": {
    "roomId": "ABU12",
    "teamId": "team_1"
  }
}
```
* **Server Response (Success)**: Emits `sync_state` with stage set to `BUZZED_IN` and `buzzedTeamId` set to `"team_1"`. Starts the response timer (e.g. 10s).
* **Server Response (Fail)**: If another player buzzed first, that client's socket receives a specific `buzz_failed` or relies on the next state sync.

#### `submit_answer` (Mobile -> Server)
Sent by the buzzed-in team leader to submit their multiple choice selection.
```json
{
  "event": "submit_answer",
  "data": {
    "roomId": "ABU12",
    "teamId": "team_1",
    "answerIndex": 2
  }
}
```
* **Server Action**: 
  - Validates answer correctness.
  - Adds/subtracts points for `team_1`.
  - Marks the question as played.
  - Updates stage to `ANSWER_REVEAL`.
  - Emits `sync_state` to all. After a short delay (e.g. 5 seconds), transitions stage back to `BOARD` and updates `selectingTeamId` to the appropriate team.

---

### 2.3 General Broadcasts

#### `sync_state` (Server -> Broadcast to Room)
Broadcasted whenever any state modification occurs. Both the TV and Mobile controllers parse this to render their respective views.
```json
{
  "roomId": "ABU12",
  "stage": "BOARD",
  "teams": {
    "team_1": {
      "id": "team_1",
      "name": "الذيبان",
      "score": 10
    },
    "team_2": {
      "id": "team_2",
      "name": "النشامى",
      "score": 0
    }
  },
  "selectingTeamId": "team_2",
  "activeQuestionId": null
  // ... rest of state
}
```

#### `timer_tick` (Server -> Broadcast to Room)
Fired every second while a timer is running.
```json
{
  "timerType": "BUZZ" | "ANSWER",
  "secondsRemaining": 14
}
```
