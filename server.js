/**
 * Custom Next.js server with Socket.io integration
 * Run: node server.js (replaces `next start`)
 * For dev: nodemon server.js or integrate with next dev
 */
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const httpServer = createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url, true);
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error('Error occurred handling', req.url, err);
            res.statusCode = 500;
            res.end('internal server error');
        }
    });

    const io = new Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });

    // Store io globally so API routes can emit events
    global._io = io;

    // Socket.io connection handling
    io.on('connection', (socket) => {
        console.log('[Socket.io] Client connected:', socket.id);

        // User joins their personal room (userId-based)
        socket.on('join', ({ userId }) => {
            if (userId) {
                socket.join(`user:${userId}`);
                console.log(`[Socket.io] User ${userId} joined room user:${userId}`);
            }
        });

        // Join a chat thread room
        socket.on('join-chat', ({ memberId, psychologistId }) => {
            const roomId = `chat:${memberId}`;
            socket.join(roomId);
            console.log(`[Socket.io] Socket joined chat room ${roomId}`);
        });

        // New chat message (real-time delivery)
        socket.on('send-message', (data) => {
            const roomId = `chat:${data.memberUserId}`;
            io.to(roomId).emit('new-message', data);
        });

        socket.on('disconnect', () => {
            console.log('[Socket.io] Client disconnected:', socket.id);
        });
    });

    httpServer.listen(port, () => {
        console.log(`\n🏥 LÖSEV PSİ server running at http://${hostname}:${port}`);
        console.log(`   Socket.io enabled`);
        console.log(`   Environment: ${dev ? 'development' : 'production'}\n`);
    });
});
