// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Debug middleware - log all requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    console.log('Request Body:', req.body);
    next();
});

// Improved MongoDB connection with proper error handling
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            // Add timeout settings
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            socketTimeoutMS: 45000, // Close sockets after 45s
        });
        
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        
        // Handle connection errors after initial connection
        mongoose.connection.on('error', err => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected! Attempting to reconnect...');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('MongoDB reconnected!');
        });

    } catch (error) {
        console.error('MongoDB connection error:', error);
        // Exit process with failure
        process.exit(1);
    }
};

// Connect to MongoDB before starting the server
connectDB().then(() => {
    // Routes
    app.use('/api/auth', authRoutes);

    // Test route
    app.get('/test', (req, res) => {
        res.json({ message: 'Server is working' });
    });

    // Basic route
    app.get('/', (req, res) => {
        res.json({ message: 'Welcome to the Admin Backend API' });
    });

    // Error handling middleware
    app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).json({ message: 'Something went wrong!', error: err.message });
    });

    // Handle 404 routes
    app.use((req, res) => {
        res.status(404).json({ message: 'Route not found' });
    });

    // Start server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`Test the API at http://localhost:${PORT}/test`);
    });
}).catch(error => {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
});