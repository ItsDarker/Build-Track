import request from 'supertest';
import app from '../src/index';
import { prisma } from '../src/lib/prisma';

describe('Auth API', () => {
  it('should return 401 if accessing protected route without token', async () => {
    const res = await request(app).get('/api/users/profile');
    expect(res.status).toBe(401);
  });

  it('should return error for invalid login credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      });
    expect(res.status).toBe(401); // Or whatever your auth error status is
    expect(res.body).toHaveProperty('error');
  });
});
