import { http, HttpResponse } from 'msw';

/**
 * Mock handlers for API endpoints
 * Add your API handlers here for testing
 */
export const handlers = [
  // Example handler for login endpoint
  http.post('/api/auth/login', async () => {
    return HttpResponse.json(
      {
        user: {
          id: 'test-user-1',
          email: 'test@example.com',
        },
      },
      { status: 200 }
    );
  }),

  // Example handler for getting user profile
  http.get('/api/user/profile', async () => {
    return HttpResponse.json(
      {
        id: 'test-user-1',
        email: 'test@example.com',
        name: 'Test User',
      },
      { status: 200 }
    );
  }),

  // Example handler for getting transactions
  http.get('/api/transactions', async () => {
    return HttpResponse.json(
      {
        data: [
          {
            id: '1',
            description: 'Test Transaction',
            amount: 100,
            category: 'Food',
            date: new Date().toISOString(),
          },
        ],
      },
      { status: 200 }
    );
  }),
];

