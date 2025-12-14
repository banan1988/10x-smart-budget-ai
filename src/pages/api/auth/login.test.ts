import { describe, it, expect, vi, afterEach } from "vitest";
import type { APIContext } from "astro";
import { POST } from "./login";
import {
  createMockRequest,
  createMockAuthContext,
  mockSupabaseAuthSuccess,
  mockSupabaseAuthError,
} from "../../../test/mocks/auth.mock";

// Mock Supabase client at top level
vi.mock("../../../db/supabase.client", () => ({
  createSupabaseServerInstance: vi.fn(),
}));

describe("POST /api/auth/login", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Valid credentials", () => {
    it("should return 200 with user data on valid credentials", async () => {
      // Arrange
      const request = createMockRequest({
        email: "test@example.com",
        password: "password123",
      });

      const context = createMockAuthContext(request);

      // Mock Supabase auth
      const { createSupabaseServerInstance } = await import("../../../db/supabase.client");
      vi.mocked(createSupabaseServerInstance).mockReturnValue({
        auth: {
          signInWithPassword: vi.fn().mockResolvedValue(mockSupabaseAuthSuccess("user-123", "test@example.com")),
        },
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: { role: "user", nickname: "TestUser" },
                error: null,
              }),
            })),
          })),
        })),
      } as Record<string, unknown>);

      // Act
      const response = await POST(context as APIContext);

      // Assert
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("user");
      expect(data.user).toHaveProperty("id", "user-123");
      expect(data.user).toHaveProperty("email", "test@example.com");
      expect(data.user).toHaveProperty("role", "user");
      expect(data.user).toHaveProperty("nickname", "TestUser");
    });
  });

  describe("Invalid credentials", () => {
    it("should return 401 on invalid credentials", async () => {
      // Arrange
      const request = createMockRequest({
        email: "test@example.com",
        password: "wrongpassword",
      });

      const context = createMockAuthContext(request);

      // Mock Supabase error
      const { createSupabaseServerInstance } = await import("../../../db/supabase.client");
      vi.mocked(createSupabaseServerInstance).mockReturnValue({
        auth: {
          signInWithPassword: vi
            .fn()
            .mockResolvedValue(mockSupabaseAuthError("invalid_credentials", "Invalid credentials")),
        },
      } as Record<string, unknown>);

      // Act
      const response = await POST(context as APIContext);

      // Assert
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toHaveProperty("error");
      expect(data.error).toMatchInlineSnapshot('"Email lub hasło są nieprawidłowe"');
    });

    it("should return 403 on email not confirmed", async () => {
      // Arrange
      const request = createMockRequest({
        email: "unconfirmed@example.com",
        password: "password123",
      });

      const context = createMockAuthContext(request);

      // Mock Supabase error
      const { createSupabaseServerInstance } = await import("../../../db/supabase.client");
      vi.mocked(createSupabaseServerInstance).mockReturnValue({
        auth: {
          signInWithPassword: vi
            .fn()
            .mockResolvedValue(mockSupabaseAuthError("email_not_confirmed", "Email not confirmed")),
        },
      } as Record<string, unknown>);

      // Act
      const response = await POST(context as APIContext);

      // Assert
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toMatchInlineSnapshot('"Proszę potwierdź swój adres email"');
    });

    it("should return 404 on user not found", async () => {
      // Arrange
      const request = createMockRequest({
        email: "nonexistent@example.com",
        password: "password123",
      });

      const context = createMockAuthContext(request);

      // Mock Supabase error
      const { createSupabaseServerInstance } = await import("../../../db/supabase.client");
      vi.mocked(createSupabaseServerInstance).mockReturnValue({
        auth: {
          signInWithPassword: vi.fn().mockResolvedValue(mockSupabaseAuthError("user_not_found", "User not found")),
        },
      } as Record<string, unknown>);

      // Act
      const response = await POST(context as APIContext);

      // Assert
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toMatchInlineSnapshot('"Użytkownik nie istnieje"');
    });
  });

  describe("Request validation", () => {
    it("should return 400 on invalid JSON body", async () => {
      // Arrange
      const request = new Request("http://localhost:4321/api/auth/login", {
        method: "POST",
        body: "invalid json",
        headers: { "Content-Type": "application/json" },
      });

      const context = createMockAuthContext(request);

      // Act
      const response = await POST(context as APIContext);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toMatchInlineSnapshot('"Nieprawidłowy format żądania"');
    });

    it("should return 400 on missing email", async () => {
      // Arrange
      const request = createMockRequest({
        password: "password123",
      });

      const context = createMockAuthContext(request);

      // Act
      const response = await POST(context as APIContext);

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
      const response = await POST(context as APIContext);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it("should return 400 on invalid email format", async () => {
      // Arrange
      const request = createMockRequest({
        email: "not-an-email",
        password: "password123",
      });

      const context = createMockAuthContext(request);

      // Act
      const response = await POST(context as APIContext);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toMatchInlineSnapshot('"Wprowadź prawidłowy adres email"');
    });

    it("should return 400 on empty password", async () => {
      // Arrange
      const request = createMockRequest({
        email: "test@example.com",
        password: "",
      });

      const context = createMockAuthContext(request);

      // Act
      const response = await POST(context as APIContext);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });

  describe("Content-Type", () => {
    it("should return application/json content-type", async () => {
      // Arrange
      const request = createMockRequest({
        email: "test@example.com",
        password: "password123",
      });

      const context = createMockAuthContext(request);

      // Mock Supabase auth
      const { createSupabaseServerInstance } = await import("../../../db/supabase.client");
      vi.mocked(createSupabaseServerInstance).mockReturnValue({
        auth: {
          signInWithPassword: vi.fn().mockResolvedValue(mockSupabaseAuthSuccess("user-123", "test@example.com")),
        },
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: { role: "user", nickname: "TestUser" },
                error: null,
              }),
            })),
          })),
        })),
      } as Record<string, unknown>);

      // Act
      const response = await POST(context as APIContext);

      // Assert
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });
  });

  describe("Error handling", () => {
    it("should return 500 on Supabase unexpected error", async () => {
      // Arrange
      const request = createMockRequest({
        email: "test@example.com",
        password: "password123",
      });

      const context = createMockAuthContext(request);

      // Mock Supabase error
      const { createSupabaseServerInstance } = await import("../../../db/supabase.client");
      vi.mocked(createSupabaseServerInstance).mockReturnValue({
        auth: {
          signInWithPassword: vi.fn().mockResolvedValue(mockSupabaseAuthError("unknown_error", "Unknown error")),
        },
      } as Record<string, unknown>);

      // Act
      const response = await POST(context as APIContext);

      // Assert
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toMatchInlineSnapshot('"Nie udało się zalogować. Spróbuj ponownie później."');
    });

    it("should return 500 on unexpected exception", async () => {
      // Arrange
      const request = createMockRequest({
        email: "test@example.com",
        password: "password123",
      });

      const context = createMockAuthContext(request);

      // Mock exception
      const { createSupabaseServerInstance } = await import("../../../db/supabase.client");
      vi.mocked(createSupabaseServerInstance).mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      // Act
      const response = await POST(context as APIContext);

      // Assert
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toMatchInlineSnapshot('"Wewnętrzny błąd serwera"');
    });

    it("should handle missing user profile gracefully", async () => {
      // Arrange
      const request = createMockRequest({
        email: "test@example.com",
        password: "password123",
      });

      const context = createMockAuthContext(request);

      // Mock Supabase - no profile data
      const { createSupabaseServerInstance } = await import("../../../db/supabase.client");
      vi.mocked(createSupabaseServerInstance).mockReturnValue({
        auth: {
          signInWithPassword: vi.fn().mockResolvedValue(mockSupabaseAuthSuccess("user-123", "test@example.com")),
        },
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: "No profile found" },
              }),
            })),
          })),
        })),
      } as Record<string, unknown>);

      // Act
      const response = await POST(context as APIContext);

      // Assert
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.user).toHaveProperty("role", "user");
      expect(data.user).toHaveProperty("nickname", "");
    });
  });
});
