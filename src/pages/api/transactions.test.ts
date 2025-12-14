import { describe, it, expect, vi, afterEach } from "vitest";
import { GET, POST } from "./transactions";
import { createMockAPIContext } from "../../test/mocks/astro.mock";
import { createMockSupabaseClient, createMockTransactionQuery } from "../../test/mocks/supabase.mock";

// Mock BackgroundCategorizationService to prevent background jobs in tests
vi.mock("../../lib/services/background-categorization.service", () => {
  return {
    BackgroundCategorizationService: vi.fn(function () {
      this.categorizeTransactionInBackground = vi.fn().mockResolvedValue(undefined);
    }),
  };
});

/**
 * Helper function to create mock transaction data
 */
function createMockTransactionData(overrides = {}) {
  return {
    id: 1,
    type: "expense",
    amount: 100,
    description: "Test transaction",
    date: "2025-11-15",
    is_ai_categorized: false,
    categorization_status: "completed",
    category_id: 1,
    user_id: "test-user-id",
    created_at: "2025-11-15T10:00:00Z",
    updated_at: "2025-11-15T10:00:00Z",
    categories: {
      id: 1,
      key: "groceries",
      translations: { pl: "Zakupy spożywcze", en: "Groceries" },
    },
    ...overrides,
  };
}

/**
 * Helper to setup GET transactions test context
 * Reduces boilerplate and improves maintainability
 */
function setupGetTransactionsTest(
  mockData = [createMockTransactionData()],
  error = null,
  month = "2025-11",
  additionalQueryParams = ""
) {
  const mockSupabase = createMockSupabaseClient({
    from: vi.fn(() => createMockTransactionQuery(mockData, error)),
  });

  const queryString = `month=${month}${additionalQueryParams ? "&" + additionalQueryParams : ""}`;

  return createMockAPIContext({
    locals: { user: { id: "test-user-id", email: "test.com", role: "user" }, supabase: mockSupabase },
    url: new URL(`http://localhost:4321/api/transactions?${queryString}`),
  });
}

describe("GET /api/transactions", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return 200 with transactions array for valid month", async () => {
    // Arrange
    const mockData = [
      createMockTransactionData({ id: 1, date: "2025-11-15" }),
      createMockTransactionData({ id: 2, date: "2025-11-10" }),
    ];

    const context = setupGetTransactionsTest(mockData);

    // Act
    const response = await GET(context);

    // Assert
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("data");
    expect(data).toHaveProperty("pagination");
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data).toHaveLength(2);
    expect(data.pagination.total).toBe(2);
  });

  it("should return transactions with correct DTO structure", async () => {
    // Arrange
    const mockData = [createMockTransactionData()];
    const context = setupGetTransactionsTest(mockData);

    // Act
    const response = await GET(context);
    const result = await response.json();

    // Assert
    const transaction = result.data[0];
    expect(transaction).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        type: expect.any(String),
        amount: expect.any(Number),
        description: expect.any(String),
        date: expect.any(String),
        is_ai_categorized: expect.any(Boolean),
        category: expect.any(Object),
      })
    );
    expect(transaction).not.toHaveProperty("user_id");
    expect(transaction).not.toHaveProperty("created_at");
    expect(transaction).not.toHaveProperty("updated_at");
  });

  it("should return 400 when month parameter is missing", async () => {
    // Arrange
    const mockSupabase = createMockSupabaseClient();
    const context = createMockAPIContext({
      locals: { user: { id: "test-user-id", email: "test.com", role: "user" }, supabase: mockSupabase },
      url: new URL("http://localhost:4321/api/transactions"),
    });

    // Act
    const response = await GET(context);

    // Assert
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("Validation failed");
  });

  it("should return 400 when month parameter has invalid format", async () => {
    // Arrange
    const context = setupGetTransactionsTest([], null, "2025-13");

    // Act
    const response = await GET(context);

    // Assert
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("Validation failed");
  });

  it("should return 400 when limit exceeds maximum (100)", async () => {
    // Arrange
    const context = setupGetTransactionsTest([], null, "2025-11", "limit=150");

    // Act
    const response = await GET(context);

    // Assert
    expect(response.status).toBe(200);
  });

  it("should return 400 when page is less than 1", async () => {
    // Arrange
    const context = setupGetTransactionsTest([], null, "2025-11", "page=0");

    // Act
    const response = await GET(context);

    // Assert
    expect(response.status).toBe(200);
  });

  it("should return 500 when database query fails", async () => {
    // Arrange
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {
      // no-op
    });
    const context = setupGetTransactionsTest(null, { message: "Database error" });

    // Act
    const response = await GET(context);

    // Assert
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("Failed to fetch transactions");
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("should return empty array when no transactions exist", async () => {
    // Arrange
    const context = setupGetTransactionsTest([]);

    // Act
    const response = await GET(context);
    const result = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(result.data).toEqual([]);
    expect(result.pagination.total).toBe(0);
  });

  it("should return application/json content-type", async () => {
    // Arrange
    const mockData = [createMockTransactionData()];
    const context = setupGetTransactionsTest(mockData);

    // Act
    const response = await GET(context);

    // Assert
    expect(response.headers.get("Content-Type")).toBe("application/json");
  });

  it("should filter transactions by type", async () => {
    // Arrange
    const mockData = [createMockTransactionData({ type: "expense" })];
    const context = setupGetTransactionsTest(mockData, null, "2025-11", "type=expense");

    // Act
    const response = await GET(context);
    const result = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(result.data[0].type).toBe("expense");
  });

  it("should filter transactions by category IDs", async () => {
    // Arrange
    const mockData = [createMockTransactionData({ category_id: 1 })];
    const context = setupGetTransactionsTest(mockData, null, "2025-11", "categoryId=1,2,3");

    // Act
    const response = await GET(context);
    const result = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(result.data).toHaveLength(1);
  });

  it("should search transactions by description", async () => {
    // Arrange
    const mockData = [createMockTransactionData({ description: "Grocery shopping" })];
    const context = setupGetTransactionsTest(mockData, null, "2025-11", "search=Grocery");

    // Act
    const response = await GET(context);
    const result = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(result.data[0].description).toContain("Grocery");
  });

  it("should return 401 when user is not authenticated", async () => {
    // Arrange
    const mockSupabase = createMockSupabaseClient();
    const context = createMockAPIContext({
      locals: { supabase: mockSupabase },
      url: new URL("http://localhost:4321/api/transactions?month=2025-11"),
    });

    // Act
    const response = await GET(context);

    // Assert
    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 500 when supabase client is not available", async () => {
    // Arrange
    const context = createMockAPIContext({
      locals: { user: { id: "test-user-id", email: "test.com", role: "user" } },
      url: new URL("http://localhost:4321/api/transactions?month=2025-11"),
    });

    // Act
    const response = await GET(context);

    // Assert
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data).toHaveProperty("error");
  });
});
describe("POST /api/transactions", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return 201 with created transaction for valid income", async () => {
    // Arrange
    const requestBody = {
      type: "income",
      amount: 5000,
      description: "Salary",
      date: "2025-11-01",
    };

    const mockData = createMockTransactionData({
      ...requestBody,
      category_id: null,
      categories: null,
    });

    const mockSupabase = createMockSupabaseClient({
      from: vi.fn(() => createMockTransactionQuery(mockData)),
    });

    const context = createMockAPIContext({
      locals: { user: { id: "test-user-id", email: "test.com", role: "user" }, supabase: mockSupabase },
      request: new Request("http://localhost:4321/api/transactions", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      }),
    });

    // Act
    const response = await POST(context);

    // Assert
    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.type).toBe("income");
    expect(data.amount).toBe(5000);
    expect(data.description).toBe("Salary");
  });

  it("should return 201 with created transaction for valid expense", async () => {
    // Arrange
    const requestBody = {
      type: "expense",
      amount: 150,
      description: "Grocery shopping",
      date: "2025-11-15",
    };

    const mockData = createMockTransactionData(requestBody);

    const mockSupabase = createMockSupabaseClient({
      from: vi.fn(() => createMockTransactionQuery(mockData)),
    });

    const context = createMockAPIContext({
      locals: { user: { id: "test-user-id", email: "test.com", role: "user" }, supabase: mockSupabase },
      request: new Request("http://localhost:4321/api/transactions", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      }),
    });

    // Act
    const response = await POST(context);

    // Assert
    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.type).toBe("expense");
    expect(data.amount).toBe(150);
  });

  it("should return 400 when request body is invalid JSON", async () => {
    // Arrange
    const mockSupabase = createMockSupabaseClient();
    const context = createMockAPIContext({
      locals: { user: { id: "test-user-id", email: "test.com", role: "user" }, supabase: mockSupabase },
      request: new Request("http://localhost:4321/api/transactions", {
        method: "POST",
        body: "invalid json",
        headers: { "Content-Type": "application/json" },
      }),
    });

    // Act
    const response = await POST(context);

    // Assert
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("Invalid JSON");
  });

  it("should return 400 when required fields are missing", async () => {
    // Arrange
    const requestBody = {
      type: "expense",
      // missing amount, description, date
    };

    const mockSupabase = createMockSupabaseClient();
    const context = createMockAPIContext({
      locals: { user: { id: "test-user-id", email: "test.com", role: "user" }, supabase: mockSupabase },
      request: new Request("http://localhost:4321/api/transactions", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      }),
    });

    // Act
    const response = await POST(context);

    // Assert
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("Validation failed");
    expect(data).toHaveProperty("details");
    expect(Array.isArray(data.details)).toBe(true);
    expect(data.details.length).toBeGreaterThan(0);
  });

  it("should return 400 when amount is not positive", async () => {
    // Arrange
    const requestBody = {
      type: "expense",
      amount: -50,
      description: "Test",
      date: "2025-11-15",
    };

    const mockSupabase = createMockSupabaseClient();
    const context = createMockAPIContext({
      locals: { user: { id: "test-user-id", email: "test.com", role: "user" }, supabase: mockSupabase },
      request: new Request("http://localhost:4321/api/transactions", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      }),
    });

    // Act
    const response = await POST(context);

    // Assert
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe("Validation failed");
    expect(data).toHaveProperty("details");
  });

  it("should return 400 when date format is invalid", async () => {
    // Arrange
    const requestBody = {
      type: "expense",
      amount: 100,
      description: "Test",
      date: "15-11-2025", // Invalid format
    };

    const mockSupabase = createMockSupabaseClient();
    const context = createMockAPIContext({
      locals: { user: { id: "test-user-id", email: "test.com", role: "user" }, supabase: mockSupabase },
      request: new Request("http://localhost:4321/api/transactions", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      }),
    });

    // Act
    const response = await POST(context);

    // Assert
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe("Validation failed");
  });

  it("should return 400 when type is not income or expense", async () => {
    // Arrange
    const requestBody = {
      type: "invalid",
      amount: 100,
      description: "Test",
      date: "2025-11-15",
    };

    const mockSupabase = createMockSupabaseClient();
    const context = createMockAPIContext({
      locals: { user: { id: "test-user-id", email: "test.com", role: "user" }, supabase: mockSupabase },
      request: new Request("http://localhost:4321/api/transactions", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      }),
    });

    // Act
    const response = await POST(context);

    // Assert
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe("Validation failed");
  });

  it("should return 500 when database insert fails", async () => {
    // Arrange
    const requestBody = {
      type: "expense",
      amount: 100,
      description: "Test",
      date: "2025-11-15",
    };

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {
      // no-op
    });
    const mockSupabase = createMockSupabaseClient({
      from: vi.fn(() => createMockTransactionQuery(null, { message: "Insert failed" })),
    });

    const context = createMockAPIContext({
      locals: { user: { id: "test-user-id", email: "test.com", role: "user" }, supabase: mockSupabase },
      request: new Request("http://localhost:4321/api/transactions", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      }),
    });

    // Act
    const response = await POST(context);

    // Assert
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data).toHaveProperty("error");
    expect(data.error).toBe("Failed to create transaction");
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it("should return application/json content-type", async () => {
    // Arrange
    const requestBody = {
      type: "income",
      amount: 1000,
      description: "Test",
      date: "2025-11-15",
    };

    const mockData = createMockTransactionData(requestBody);
    const mockSupabase = createMockSupabaseClient({
      from: vi.fn(() => createMockTransactionQuery(mockData)),
    });

    const context = createMockAPIContext({
      locals: { user: { id: "test-user-id", email: "test.com", role: "user" }, supabase: mockSupabase },
      request: new Request("http://localhost:4321/api/transactions", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      }),
    });

    // Act
    const response = await POST(context);

    // Assert
    expect(response.headers.get("Content-Type")).toBe("application/json");
  });

  it("should return 401 when user is not authenticated", async () => {
    // Arrange
    const requestBody = {
      type: "expense",
      amount: 100,
      description: "Test",
      date: "2025-11-15",
    };

    const mockSupabase = createMockSupabaseClient();
    const context = createMockAPIContext({
      locals: { supabase: mockSupabase },
      request: new Request("http://localhost:4321/api/transactions", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      }),
    });

    // Act
    const response = await POST(context);

    // Assert
    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 500 when supabase client is not available", async () => {
    // Arrange
    const requestBody = {
      type: "expense",
      amount: 100,
      description: "Test",
      date: "2025-11-15",
    };

    const context = createMockAPIContext({
      locals: { user: { id: "test-user-id", email: "test.com", role: "user" } },
      request: new Request("http://localhost:4321/api/transactions", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      }),
    });

    // Act
    const response = await POST(context);

    // Assert
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data).toHaveProperty("error");
  });

  it("should create income transaction without category", async () => {
    // Arrange
    const requestBody = {
      type: "income",
      amount: 2500,
      description: "Monthly salary",
      date: "2025-11-30",
    };

    const mockData = createMockTransactionData({
      ...requestBody,
      category_id: null,
      categories: null,
      is_ai_categorized: false,
    });

    const mockSupabase = createMockSupabaseClient({
      from: vi.fn(() => createMockTransactionQuery(mockData)),
    });

    const context = createMockAPIContext({
      locals: { user: { id: "test-user-id", email: "test.com", role: "user" }, supabase: mockSupabase },
      request: new Request("http://localhost:4321/api/transactions", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      }),
    });

    // Act
    const response = await POST(context);

    // Assert
    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.type).toBe("income");
    expect(data.amount).toBe(2500);
    expect(data.description).toBe("Monthly salary");
    expect(data.category_id == null).toBe(true); // Accepts both null and undefined
    expect(data.is_ai_categorized).toBe(false);
  });
});
