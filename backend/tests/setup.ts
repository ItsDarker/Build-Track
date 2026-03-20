import { prisma } from '../src/lib/prisma';

// Global setup before all tests
beforeAll(async () => {
  // You might want to connect to a test database here
  // For now, we'll just ensure prisma is available
});

// Global teardown after all tests
afterAll(async () => {
  await prisma.$disconnect();
});
