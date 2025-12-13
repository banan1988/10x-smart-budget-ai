import { describe, it, expect, vi, afterEach } from "vitest";
import { POST } from "./reset-password";
import { createMockAuthRequest, createMockRequest, createMockAuthContext } from "../../../test/mocks/auth.mock";

// Mock Supabase client at top level
vi.mock("../../../db/supabase.client", () => ({
  createSupabaseServerInstance: vi.fn(),
}));

describe("POST /api/auth/reset-password", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Valid token and password", () => {
    it("should return 200 with valid token and new password", async () => {
      // Arrange
      const request = createMockRequest({
        newPassword: "NewPassword123",
      });

      const context = createMockAuthContext(request);

      // Mock Supabase - user authenticated with temporary session
      const { createSupabaseServerInstance } = await import("../../../db/supabase.client");
      vi.mocked(createSupabaseServerInstance).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: {
              user: { id: "user-123", email: "user@example.com" },
            },
            error: null,
          }),
          updateUser: vi.fn().mockResolvedValue({
            data: { user: { id: "user-123" } },
            error: null,
          }),
          signOut: vi.fn().mockResolvedValue({
            error: null,
          }),
        },
      } as any);

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("message");
      expect(data.message).toMatchInlineSnapshot('"Hasło zostało zmienione. Zaloguj się nowym hasłem."');
    });
  });

  describe("Token validation", () => {
    it("should return 401 on invalid/missing session", async () => {
      // Arrange
      const request = createMockRequest({
        newPassword: "NewPassword123",
      });

      const context = createMockAuthContext(request);

      // Mock Supabase - no authenticated user
      const { createSupabaseServerInstance } = await import("../../../db/supabase.client");
      vi.mocked(createSupabaseServerInstance).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: "Invalid session" },
          }),
        },
      } as any);

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toMatchInlineSnapshot('"Sesja resetowania hasła wygasła. Spróbuj ponownie."');
    });

    it("should return 401 on expired reset session", async () => {
      // Arrange
      const request = createMockRequest({
        newPassword: "NewPassword123",
      });

      const context = createMockAuthContext(request);

      // Mock Supabase - session expired
      const { createSupabaseServerInstance } = await import("../../../db/supabase.client");
      vi.mocked(createSupabaseServerInstance).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: "Session expired" },
          }),
        },
      } as any);

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it("should return 401 on no authenticated user", async () => {
      // Arrange
      const request = createMockRequest({
        newPassword: "NewPassword123",
      });

      const context = createMockAuthContext(request);

      // Mock Supabase - not authenticated
      const { createSupabaseServerInstance } = await import("../../../db/supabase.client");
      vi.mocked(createSupabaseServerInstance).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      } as any);

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });

  describe("Password validation", () => {
    it("should return 400 on password too short", async () => {
      // Arrange
      const request = createMockRequest({
        newPassword: "short",
      });

      const context = createMockAuthContext(request);

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("8");
    });

    it("should return 400 on empty password", async () => {
      // Arrange
      const request = createMockRequest({
        newPassword: "",
      });

      const context = createMockAuthContext(request);

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("8");
    });

    it("should return 400 on missing password", async () => {
      // Arrange
      const request = createMockRequest({});

      const context = createMockAuthContext(request);

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });

  describe("Supabase update errors", () => {
    it("should return 400 on weak password", async () => {
      // Arrange
      const request = createMockRequest({
        newPassword: "WeakPassword",
      });

      const context = createMockAuthContext(request);

      // Mock Supabase - password validation fails
      const { createSupabaseServerInstance } = await import("../../../db/supabase.client");
      vi.mocked(createSupabaseServerInstance).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: {
              user: { id: "user-123", email: "user@example.com" },
            },
            error: null,
          }),
          updateUser: vi.fn().mockResolvedValue({
            data: null,
            error: {
              message: "Password should contain special characters",
            },
          }),
        },
      } as any);

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toMatchInlineSnapshot('"Hasło nie spełnia wymagań"');
    });

    it("should return 500 on update user error", async () => {
      // Arrange
      const request = createMockRequest({
        newPassword: "NewPassword123",
      });

      const context = createMockAuthContext(request);

      // Mock Supabase - unexpected error
      const { createSupabaseServerInstance } = await import("../../../db/supabase.client");
      vi.mocked(createSupabaseServerInstance).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: {
              user: { id: "user-123", email: "user@example.com" },
            },
            error: null,
          }),
          updateUser: vi.fn().mockResolvedValue({
            data: null,
            error: {
              message: "Database error",
            },
          }),
        },
      } as any);

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toMatchInlineSnapshot('"Nie udało się zmienić hasła"');
    });
  });

  describe("Content-Type", () => {
    it("should return application/json content-type", async () => {
      // Arrange
      const request = createMockRequest({
        newPassword: "NewPassword123",
      });

      const context = createMockAuthContext(request);

      // Mock Supabase
      const { createSupabaseServerInstance } = await import("../../../db/supabase.client");
      vi.mocked(createSupabaseServerInstance).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: {
              user: { id: "user-123", email: "user@example.com" },
            },
            error: null,
          }),
          updateUser: vi.fn().mockResolvedValue({
            data: { user: { id: "user-123" } },
            error: null,
          }),
          signOut: vi.fn().mockResolvedValue({
            error: null,
          }),
        },
      } as any);

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });
  });

  describe("Error handling", () => {
    it("should return 500 on unexpected exception", async () => {
      // Arrange
      const request = createMockRequest({
        newPassword: "NewPassword123",
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
      expect(data.error).toMatchInlineSnapshot('"Wewnętrzny błąd serwera"');
    });

    it("should call signOut after successful password update", async () => {
      // Arrange
      const request = createMockRequest({
        newPassword: "NewPassword123",
      });

      const context = createMockAuthContext(request);

      // Mock Supabase
      const { createSupabaseServerInstance } = await import("../../../db/supabase.client");
      const signOutMock = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(createSupabaseServerInstance).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: {
              user: { id: "user-123", email: "user@example.com" },
            },
            error: null,
          }),
          updateUser: vi.fn().mockResolvedValue({
            data: { user: { id: "user-123" } },
            error: null,
          }),
          signOut: signOutMock,
        },
      } as any);

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.status).toBe(200);
      expect(signOutMock).toHaveBeenCalled();
    });
  });

  describe("Request validation", () => {
    it("should return 500 on invalid JSON body (uncaught exception)", async () => {
      // Arrange
      const request = new Request("http://localhost:4321/api/auth/reset-password", {
        method: "POST",
        body: "invalid json",
        headers: { "Content-Type": "application/json" },
      });

      const context = createMockAuthContext(request);

      // Act
      const response = await POST(context as any);

      // Assert
      // NOTE: reset-password.ts doesn't have try-catch for JSON parsing,
      // so invalid JSON throws exception caught by outer catch (500)
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });
});
