import { describe, it, expect, vi, afterEach } from "vitest";
import { GET, PUT } from "./profile";
import { createMockAPIContext } from "../../../test/mocks/astro.mock";
import { createMockSupabaseClient } from "../../../test/mocks/supabase.mock";

// Mock UserService at top level with proper factory pattern
vi.mock("../../../lib/services/user.service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../lib/services/user.service")>();
  return {
    ...actual,
    UserService: {
      ...actual.UserService,
      updateUserProfile: vi.fn(),
      getUserProfile: vi.fn(),
      deleteUser: vi.fn(),
    },
  };
});

function createMockRequest(body: any = null, method = "GET") {
  return new Request("http://localhost:4321/api/user/profile", {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: { "Content-Type": "application/json" },
  });
}

describe("GET /api/user/profile", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 when not authenticated", async () => {
    // Arrange
    const context = createMockAPIContext({
      locals: { supabase: createMockSupabaseClient() },
      request: createMockRequest(null, "GET"),
    });

    // Act
    const response = await GET(context as any);

    // Assert
    expect(response.status).toBe(401, "Should return 401 Unauthorized when user is not authenticated");
  });

  it("should return 200 with user profile", async () => {
    // Arrange
    const context = createMockAPIContext({
      locals: {
        user: {
          id: "user-123",
          email: "user@example.com",
          role: "user",
          nickname: "TestUser",
          createdAt: "2025-11-01T00:00:00Z",
        },
        supabase: createMockSupabaseClient(),
      },
      request: createMockRequest(null, "GET"),
    });

    // Act
    const response = await GET(context as any);

    // Assert
    expect(response.status).toBe(200, "Should return 200 OK for authenticated user");
    const data = await response.json();
    expect(data, "Response should contain user profile data").toHaveProperty("id", "user-123");
    expect(data, "Response should contain email").toHaveProperty("email", "user@example.com");
    expect(data, "Response should contain role").toHaveProperty("role", "user");
    expect(data, "Response should contain nickname").toHaveProperty("nickname", "TestUser");
  });

  it("should include private cache headers", async () => {
    // Arrange
    const context = createMockAPIContext({
      locals: {
        user: { id: "user-123", email: "user@example.com" },
        supabase: createMockSupabaseClient(),
      },
      request: createMockRequest(null, "GET"),
    });

    // Act
    const response = await GET(context as any);

    // Assert
    const cacheControl = response.headers.get("Cache-Control");
    expect(cacheControl, "Cache-Control header should be present").toBeTruthy();
    expect(cacheControl).toContain("private", "Cache-Control should have private directive");
    expect(cacheControl).toContain("max-age", "Cache-Control should have max-age directive");
  });

  it("should return application/json content type", async () => {
    // Arrange
    const context = createMockAPIContext({
      locals: {
        user: { id: "user-123", email: "user@example.com" },
        supabase: createMockSupabaseClient(),
      },
      request: createMockRequest(null, "GET"),
    });

    // Act
    const response = await GET(context as any);

    // Assert
    expect(response.headers.get("Content-Type")).toBe(
      "application/json",
      "Response Content-Type should be application/json"
    );
  });
});

describe("PUT /api/user/profile", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 when not authenticated", async () => {
    // Arrange
    const context = createMockAPIContext({
      locals: { supabase: createMockSupabaseClient() },
      request: createMockRequest({ nickname: "NewNickname" }, "PUT"),
    });

    // Act
    const response = await PUT(context as any);

    // Assert
    expect(response.status).toBe(401, "Should return 401 Unauthorized when user is not authenticated");
  });

  it("should return 200 on successful nickname update", async () => {
    // Arrange
    const context = createMockAPIContext({
      locals: {
        user: { id: "user-123" },
        supabase: createMockSupabaseClient(),
      },
      request: createMockRequest({ nickname: "NewNickname" }, "PUT"),
    });

    const { UserService } = await import("../../../lib/services/user.service");
    vi.mocked(UserService.updateUserProfile).mockResolvedValue({
      id: "user-123",
      nickname: "NewNickname",
    } as any);

    // Act
    const response = await PUT(context as any);

    // Assert
    expect(response.status).toBe(200, "Should return 200 OK on successful update");
    const data = await response.json();
    expect(data, "Response should have success property").toHaveProperty("success", true);
    expect(data, "Response should have nickname in data").toHaveProperty("data.nickname", "NewNickname");
  });

  it("should return 400 for empty nickname", async () => {
    // Arrange
    const context = createMockAPIContext({
      locals: {
        user: { id: "user-123" },
        supabase: createMockSupabaseClient(),
      },
      request: createMockRequest({ nickname: "" }, "PUT"),
    });

    // Act
    const response = await PUT(context as any);

    // Assert
    expect(response.status).toBe(400, "Should return 400 Bad Request for empty nickname");
    const data = await response.json();
    expect(data, "Error response should contain error details").toHaveProperty("error");
  });

  it("should return 400 for nickname exceeding 50 characters", async () => {
    // Arrange
    const context = createMockAPIContext({
      locals: {
        user: { id: "user-123" },
        supabase: createMockSupabaseClient(),
      },
      request: createMockRequest({ nickname: "a".repeat(51) }, "PUT"),
    });

    // Act
    const response = await PUT(context as any);

    // Assert
    expect(response.status).toBe(400, "Should return 400 Bad Request for nickname > 50 characters");
  });

  it("should accept nickname with exactly 50 characters", async () => {
    // Arrange
    const exactlyFiftyChars = "a".repeat(50);
    const context = createMockAPIContext({
      locals: {
        user: { id: "user-123" },
        supabase: createMockSupabaseClient(),
      },
      request: createMockRequest({ nickname: exactlyFiftyChars }, "PUT"),
    });

    const { UserService } = await import("../../../lib/services/user.service");
    vi.mocked(UserService.updateUserProfile).mockResolvedValue({
      id: "user-123",
      nickname: exactlyFiftyChars,
    } as any);

    // Act
    const response = await PUT(context as any);

    // Assert
    expect(response.status).toBe(200, "Should accept nickname with exactly 50 characters");
  });

  it("should reject nickname with invalid special characters", async () => {
    // Arrange
    const context = createMockAPIContext({
      locals: {
        user: { id: "user-123" },
        supabase: createMockSupabaseClient(),
      },
      request: createMockRequest({ nickname: "Invalid@#$%" }, "PUT"),
    });

    // Act
    const response = await PUT(context as any);

    // Assert
    expect(response.status).toBe(400, "Should return 400 for nickname with invalid special characters");
  });

  it("should accept valid nicknames with alphanumeric, spaces, hyphens, and underscores", async () => {
    // Arrange
    const validNicknames = ["User123", "User Name", "user-name", "user_name", "User-Name_123"];

    for (const nickname of validNicknames) {
      const context = createMockAPIContext({
        locals: {
          user: { id: "user-123" },
          supabase: createMockSupabaseClient(),
        },
        request: createMockRequest({ nickname }, "PUT"),
      });

      const { UserService } = await import("../../../lib/services/user.service");
      vi.mocked(UserService.updateUserProfile).mockResolvedValue({
        id: "user-123",
        nickname,
      } as any);

      // Act
      const response = await PUT(context as any);

      // Assert
      expect(response.status).toBe(200, `Should accept valid nickname format: "${nickname}"`);
    }
  });

  it("should return 400 on malformed JSON request body", async () => {
    // Arrange
    const request = new Request("http://localhost:4321/api/user/profile", {
      method: "PUT",
      body: "invalid json",
      headers: { "Content-Type": "application/json" },
    });

    const context = createMockAPIContext({
      locals: {
        user: { id: "user-123" },
        supabase: createMockSupabaseClient(),
      },
      request,
    });

    // Act
    const response = await PUT(context as any);

    // Assert
    expect(response.status).toBe(400, "Should return 400 for malformed JSON request body");
  });

  it("should return 500 on service error", async () => {
    // Arrange
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const context = createMockAPIContext({
      locals: {
        user: { id: "user-123" },
        supabase: createMockSupabaseClient(),
      },
      request: createMockRequest({ nickname: "NewNickname" }, "PUT"),
    });

    const { UserService } = await import("../../../lib/services/user.service");
    vi.mocked(UserService.updateUserProfile).mockRejectedValue(new Error("Service error"));

    // Act
    const response = await PUT(context as any);

    // Assert
    expect(response.status).toBe(500, "Should return 500 Internal Server Error when service fails");
    expect(consoleErrorSpy).toHaveBeenCalled("Should log error to console");
    // Verify the error was logged with correct prefix
    const callArgs = consoleErrorSpy.mock.calls[0];
    expect(callArgs[0]).toContain("Error updating user profile", "Should log with correct error prefix");

    // Cleanup
    consoleErrorSpy.mockRestore();
  });

  it("should return application/json content type", async () => {
    // Arrange
    const context = createMockAPIContext({
      locals: {
        user: { id: "user-123" },
        supabase: createMockSupabaseClient(),
      },
      request: createMockRequest({ nickname: "NewNickname" }, "PUT"),
    });

    const { UserService } = await import("../../../lib/services/user.service");
    vi.mocked(UserService.updateUserProfile).mockResolvedValue({
      id: "user-123",
      nickname: "NewNickname",
    } as any);

    // Act
    const response = await PUT(context as any);

    // Assert
    expect(response.headers.get("Content-Type")).toBe(
      "application/json",
      "Response Content-Type should be application/json"
    );
  });

  it("should trim whitespace from nickname", async () => {
    // Arrange
    const context = createMockAPIContext({
      locals: {
        user: { id: "user-123" },
        supabase: createMockSupabaseClient(),
      },
      request: createMockRequest({ nickname: "  NewNickname  " }, "PUT"),
    });

    const { UserService } = await import("../../../lib/services/user.service");
    const updateMock = vi.mocked(UserService.updateUserProfile);
    updateMock.mockResolvedValue({
      id: "user-123",
      nickname: "NewNickname",
    } as any);

    // Act
    const response = await PUT(context as any);

    // Assert
    expect(response.status).toBe(200, "Should return 200 OK after trimming whitespace");
    expect(updateMock).toHaveBeenCalled("updateUserProfile should be called to update trimmed nickname");
    // Verify the trimmed value was passed
    const callArgs = updateMock.mock.calls[0];
    expect(callArgs[2], "Should pass trimmed nickname to service").toEqual({ nickname: "NewNickname" });
  });
});
