import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { config } from './config/env';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import cmsRoutes from './routes/cms.routes';
import clientRoutes from './routes/client.routes';
import projectRoutes from './routes/project.routes';
import taskRoutes from './routes/task.routes';
import teamRoutes from './routes/team.routes';
import dashboardRoutes from './routes/dashboard.routes';
import { prisma } from "./config/prisma";
import moduleRecordsRoutes from './routes/moduleRecords.routes';
import lookupRoutes from './routes/lookup.routes';
import attachmentRoutes from './routes/attachment.routes';
import notificationRoutes from './routes/notification.routes';
import projectInvitationRoutes from './routes/project-invitations.routes';
import conversationRoutes from './routes/conversations.routes';
import messageRoutes from './routes/messages.routes';
import messageAttachmentRoutes from './routes/messageAttachments.routes';
import callsRoutes from './routes/calls.routes';
import presenceRoutes from './routes/presence.routes';
import usersRoutes from './routes/users.routes';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { realtimeService } from './services/realtimeService';
import { initSocketHandlers } from './socket/handlers';


const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: config.frontendUrl,
    credentials: true,
  },
});

// Initialize Socket.io service and handlers
realtimeService.initialize(io);
initSocketHandlers(io);


// Middleware
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));

// Increase payload size limits for file uploads (10MB)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());





// Serve static uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// DB health check (temporary)
app.get("/api/health/db", async (req, res) => {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1;`;
    return res.json({ ok: true, ms: Date.now() - start });
  } catch (err) {
    console.error("DB health check failed:", err);
    return res.status(500).json({ ok: false, ms: Date.now() - start, error: String(err) });
  }
});



// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects', projectInvitationRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/modules', moduleRecordsRoutes);
app.use('/api/lookups', lookupRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/message-attachments', messageAttachmentRoutes);
app.use('/api/calls', callsRoutes);
app.use('/api/presence', presenceRoutes);
app.use('/api/users', usersRoutes);


// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: config.nodeEnv === 'development' ? err.message : 'Internal server error',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});



// Start server
server.listen(config.port, () => {
  console.log(`🚀 Backend server running on port ${config.port}`);
  console.log(`📝 Environment: ${config.nodeEnv}`);
  console.log(`🔗 Frontend URL: ${config.frontendUrl}`);
  console.log(`📧 Email mode: ${config.mail.mode}`);
});

export default app;
