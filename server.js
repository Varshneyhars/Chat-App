const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const Sequelize = require('sequelize');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Frontend URL
    methods: ["GET", "POST"],
    credentials: true,
  }
});

// Enable CORS for Express
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST'],
  credentials: true,
}));

// Sequelize setup
const sequelize = new Sequelize('chatdb', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
});

// Define models
const Room = sequelize.define('room', {
  name: {
    type: Sequelize.STRING,
    allowNull: false
  }
}, {
  timestamps: true, // Ensure this matches your table structure
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

const Message = sequelize.define('message', {
  user_name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  message: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  room_id: {
    type: Sequelize.INTEGER,
    references: {
      model: Room,
      key: 'id'
    }
  }
}, {
  timestamps: true, // Ensure this matches your table structure
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Sync tables
sequelize.sync().then(() => console.log('Database synced'));

// Middleware
app.use(bodyParser.json());

// API routes
app.post('/api/messages', async (req, res) => {
  try {
    const { roomId, userName, message } = req.body;

    // Check if roomId exists
    const room = await Room.findByPk(roomId);
    if (!room) {
      return res.status(400).json({ error: 'Room not found' });
    }

    const newMessage = await Message.create({ room_id: roomId, user_name: userName, message });
    io.to(roomId).emit('newMessage', newMessage);
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/messages/:roomId', async (req, res) => {
  try {
    const messages = await Message.findAll({ where: { room_id: req.params.roomId } });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Socket.io events
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
  });

  socket.on('typing', (data) => {
    socket.to(data.roomId).emit('typing', data);
  });

  socket.on('stopTyping', (roomId) => {
    socket.to(roomId).emit('stopTyping');
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

server.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});
