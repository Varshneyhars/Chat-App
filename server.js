const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const Sequelize = require('sequelize');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Frontend URL
    methods: ["GET", "POST"],
    credentials: true,
  }
});

// Enable CORS for Express
app.use(cors({
    origin: '*', // Allows all origins
    methods: ['GET', 'POST'],
    credentials: true,
  }));
// Sequelize setup
const sequelize = new Sequelize('u838622265_chatdb', 'u838622265_root', 'Harshit@8878', {
  host: '193.203.184.115',
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
    socket.on('joinRoom', (roomId) => {
      socket.join(roomId);
    });
  
    socket.on('typing', ({ roomId, userName }) => {
      socket.to(roomId).emit('typing', { userName });
    });
  
    socket.on('stopTyping', (roomId) => {
      socket.to(roomId).emit('stopTyping');
    });
  
    // Handle new messages
    socket.on('newMessage', (message) => {
      io.to(message.roomId).emit('newMessage', message);
    });
  
    socket.on('disconnect', () => {
      // Handle disconnection logic if necessary
    });
  });

server.listen(3001, () => {
  console.log(`Server running on ${process.env.NEXT_PUBLIC_BACKEND_URL}`);
});
