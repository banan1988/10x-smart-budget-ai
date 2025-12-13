import { describe, it, expect, vi, afterEach } from "vitest";
import { POST } from "./register";
import {
  createMockAuthRequest,
  createMockRequest,
  createMockAuthContext,
  mockSupabaseAuthSuccess,
  mockSupabaseAuthError,
} from "../../../test/mocks/auth.mock";

// Mock Supabase client at top level
vi.mock("../../../db/supabase.client", () => ({
  createSupabaseServerInstance: vi.fn(),
}));

describe("POST /api/auth/register", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Valid registration", () => {
    it("should return 201 on successful registration", async () => {
      // Arrange
      const request = createMockAuthRequest({
        email: "newuser@example.com",
        password: "ValidPassword123",
      });

      const context = createMockAuthContext(request);

      // Mock Supabase auth
      const { createSupabaseServerInstance } = await import("../../../db/supabase.client");
      vi.mocked(createSupabaseServerInstance).mockReturnValue({
        auth: {
          signUp: vi.fn().mockResolvedValue(mockSupabaseAuthSuccess("user-456", "newuser@example.com")),
        },
      } as any);

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty("user");
      expect(data.user).toHaveProperty("email", "newuser@example.com");
      expect(data).toHaveProperty("message");
    });
  });

  describe("Invalid registration", () => {
    it("should return 409 when email already exists", async () => {
      // Arrange
      const request = createMockAuthRequest({
        email: "existing@example.com",
        password: "ValidPassword123",
      });

      const context = createMockAuthContext(request);

      // Mock Supabase error
      const { createSupabaseServerInstance } = await import("../../../db/supabase.client");
      vi.mocked(createSupabaseServerInstance).mockReturnValue({
        auth: {
          signUp: vi
            .fn()
            .mockResolvedValue(mockSupabaseAuthError("user_already_exists", "User already registered", 409)),
        },
      } as any);

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.error).toMatchInlineSnapshot('"Ten adres email jest już zarejestrowany"');
    });

    it("should return 400 when password is too weak", async () => {
      // Arrange
      const request = createMockRequest({
        email: "test@example.com",
        password: "weak",
      });

      const context = createMockAuthContext(request);

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it("should return 400 when password is too short", async () => {
      // Arrange
      const request = createMockRequest({
        email: "test@example.com",
        password: "short",
      });

      const context = createMockAuthContext(request);

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("8");
    });
  });

  describe("Request validation", () => {
    it("should return 500 on invalid JSON body (uncaught exception)", async () => {
      // Arrange
      const request = new Request("http://localhost:4321/api/auth/register", {
        method: "POST",
        body: "invalid json",
        headers: { "Content-Type": "application/json" },
      });

      const context = createMockAuthContext(request);

      // Act
      const response = await POST(context as any);

      // Assert
      // NOTE: register.ts doesn't have try-catch for JSON parsing,
      // so invalid JSON throws exception caught by outer catch (500)
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it("should return 400 on missing email", async () => {
      // Arrange
      const request = createMockRequest({
        password: "ValidPassword123",
      });

      const context = createMockAuthContext(request);

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it("should return 400 on missing password", async () => {
      // Arrange
      const request = createMockRequest({
        email: "test@example.com",
      });

      const context = createMockAuthContext(request);

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it("should return 400 on invalid email format", async () => {
      // Arrange
      const request = createMockRequest({
        email: "not-an-email",
        password: "ValidPassword123",
      });

      const context = createMockAuthContext(request);

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toMatchInlineSnapshot('"Wprowadź prawidłowy adres email"');
    });

    it("should return 400 on empty email", async () => {
      // Arrange
      const request = createMockRequest({
        email: "",
        password: "ValidPassword123",
      });

      const context = createMockAuthContext(request);

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it("should return 400 on empty password", async () => {
      // Arrange
      const request = createMockRequest({
        email: "test@example.com",
        password: "",
      });

      const context = createMockAuthContext(request);

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("8");
    });
  });

  describe("Content-Type", () => {
    it("should return application/json content-type", async () => {
      // Arrange
      const request = createMockAuthRequest({
        email: "newuser@example.com",
        password: "ValidPassword123",
      });

      const context = createMockAuthContext(request);

      // Mock Supabase auth
      const { createSupabaseServerInstance } = await import("../../../db/supabase.client");
      vi.mocked(createSupabaseServerInstance).mockReturnValue({
        auth: {
          signUp: vi.fn().mockResolvedValue(mockSupabaseAuthSuccess("user-456", "newuser@example.com")),
        },
      } as any);

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });
  });

  describe("Error handling", () => {
    it("should return 500 on Supabase unexpected error", async () => {
      // Arrange
      const request = createMockAuthRequest({
        email: "test@example.com",
        password: "ValidPassword123",
      });

      const context = createMockAuthContext(request);

      // Mock Supabase error
      const { createSupabaseServerInstance } = await import("../../../db/supabase.client");
      vi.mocked(createSupabaseServerInstance).mockReturnValue({
        auth: {
          signUp: vi.fn().mockResolvedValue(mockSupabaseAuthError("unknown_error", "Unknown error", 500)),
        },
      } as any);

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it("should return 500 on unexpected exception", async () => {
      // Arrange
      const request = createMockAuthRequest({
        email: "test@example.com",
        password: "ValidPassword123",
      });

      const context = createMockAuthContext(request);

      // Mock exception
      const { createSupabaseServerInstance } = await import("../../../db/supabase.client");
      vi.mocked(createSupabaseServerInstance).mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });
});
