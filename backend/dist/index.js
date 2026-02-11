"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const env_1 = require("./config/env");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const cms_routes_1 = __importDefault(require("./routes/cms.routes"));
const client_routes_1 = __importDefault(require("./routes/client.routes"));
const project_routes_1 = __importDefault(require("./routes/project.routes"));
const task_routes_1 = __importDefault(require("./routes/task.routes"));
const team_routes_1 = __importDefault(require("./routes/team.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)({
    origin: env_1.config.frontendUrl,
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
// Serve static uploads
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../public/uploads')));
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/cms', cms_routes_1.default);
app.use('/api/clients', client_routes_1.default);
app.use('/api/projects', project_routes_1.default);
app.use('/api/tasks', task_routes_1.default);
app.use('/api/teams', team_routes_1.default);
app.use('/api/dashboard', dashboard_routes_1.default);
// Error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: env_1.config.nodeEnv === 'development' ? err.message : 'Internal server error',
    });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
// Start server
app.listen(env_1.config.port, () => {
    console.log(`🚀 Backend server running on port ${env_1.config.port}`);
    console.log(`📝 Environment: ${env_1.config.nodeEnv}`);
    console.log(`🔗 Frontend URL: ${env_1.config.frontendUrl}`);
    console.log(`📧 Email mode: ${env_1.config.mail.mode}`);
});
exports.default = app;
