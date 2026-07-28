import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { setupSockets } from './socket';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: '*', // Allow all origins for local TV / Mobile Flutter testing
  methods: ['GET', 'POST']
}));

// Simple healthcheck endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', game: 'Seen Jeem Backend is active' });
});

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Initialize socket handlers
setupSockets(io);

httpServer.listen(port, () => {
  console.log(`=========================================`);
  console.log(` Seen Jeem (سين جيم) Backend Server Running`);
  console.log(` Port: ${port}`);
  console.log(` Healthcheck: http://localhost:${port}/health`);
  console.log(`=========================================`);
});
