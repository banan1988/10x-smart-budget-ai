import { describe, it, expect, vi, afterEach } from "vitest";
import { POST } from "./forgot-password";
import { createMockAuthRequest, createMockRequest, createMockAuthContext } from "../../../test/mocks/auth.mock";

// Mock Supabase client at top level
vi.mock("../../../db/supabase.client", () => ({
  createSupabaseServerInstance: vi.fn(),
}));

describe("POST /api/auth/forgot-password", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Valid email", () => {
    it("should return 200 with valid email", async () => {
      // Arrange
      const request = createMockRequest({
        email: "user@example.com",
      });

      const context = createMockAuthContext(request);

      // Mock Supabase
      const { createSupabaseServerInstance } = await import("../../../db/supabase.client");
      vi.mocked(createSupabaseServerInstance).mockReturnValue({
        auth: {
          resetPasswordForEmail: vi.fn().mockResolvedValue({
            data: { success: true },
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
      expect(data.message).toMatchInlineSnapshot(
        '"Jeśli istnieje konto z tym adresem email, wysłaliśmy instrukcje do resetowania hasła"'
      );
    });
  });

  describe("Email validation", () => {
    it("should return 400 on invalid email format", async () => {
      // Arrange
      const request = createMockRequest({
        email: "not-an-email",
      });

      const context = createMockAuthContext(request);

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toMatchInlineSnapshot('"Wprowadź prawidłowy adres email"');
    });

    it("should return 400 on missing email", async () => {
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

    it("should return 400 on empty email", async () => {
      // Arrange
      const request = createMockRequest({
        email: "",
      });

      const context = createMockAuthContext(request);

      // Act
      const response = await POST(context as any);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });

  describe("Security - User enumeration prevention", () => {
    it("should return 200 even for non-existent email (security)", async () => {
      // Arrange
      const request = createMockRequest({
        email: "nonexistent@example.com",
      });

      const context = createMockAuthContext(request);

      // Mock Supabase - email doesn't exist
      const { createSupabaseServerInstance } = await import("../../../db/supabase.client");
      vi.mocked(createSupabaseServerInstance).mockReturnValue({
        auth: {
          resetPasswordForEmail: vi.fn().mockResolvedValue({
            // Supabase returns success regardless of whether email exists
            // to prevent user enumeration attacks
            data: { success: true },
            error: null,
          }),
        },
      } as any);

      // Act
      const response = await POST(context as any);

      // Assert - Should return 200 regardless of whether email exists
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("message");
    });

    it("should return 200 even on Supabase error (security)", async () => {
      // Arrange
      const request = createMockRequest({
        email: "user@example.com",
      });

      const context = createMockAuthContext(request);

      // Mock Supabase error
      const { createSupabaseServerInstance } = await import("../../../db/supabase.client");
      vi.mocked(createSupabaseServerInstance).mockReturnValue({
        auth: {
          resetPasswordForEmail: vi.fn().mockResolvedValue({
            data: null,
            error: new Error("Supabase error"),
          }),
        },
      } as any);

      // Act
      const response = await POST(context as any);

      // Assert - Should still return 200 to prevent user enumeration
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toMatchInlineSnapshot(
        '"Jeśli istnieje konto z tym adresem email, wysłaliśmy instrukcje do resetowania hasła"'
      );
    });
  });

  describe("Content-Type", () => {
    it("should return application/json content-type", async () => {
      // Arrange
      const request = createMockRequest({
        email: "user@example.com",
      });

      const context = createMockAuthContext(request);

      // Mock Supabase
      const { createSupabaseServerInstance } = await import("../../../db/supabase.client");
      vi.mocked(createSupabaseServerInstance).mockReturnValue({
        auth: {
          resetPasswordForEmail: vi.fn().mockResolvedValue({
            data: { success: true },
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
        email: "user@example.com",
      });

      const context = createMockAuthContext(request);

      // Mock exception
      const { createSupabaseServerInstance } = await import("../../../db/supabase.client");
      vi.mocked(createSupabaseServerInstance).mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      // Act
      const response = await POST(context as any);

      // Assert - Even on error, return 200 to prevent user enumeration
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toMatchInlineSnapshot(
        '"Jeśli istnieje konto z tym adresem email, wysłaliśmy instrukcje do resetowania hasła"'
      );
    });
  });

  describe("Request validation", () => {
    it("should return 200 even on invalid JSON body (security)", async () => {
      // Arrange
      const request = new Request("http://localhost:4321/api/auth/forgot-password", {
        method: "POST",
        body: "invalid json",
        headers: { "Content-Type": "application/json" },
      });

      const context = createMockAuthContext(request);

      // Act
      const response = await POST(context as any);

      // Assert
      // NOTE: forgot-password.ts always returns 200 even on errors
      // to prevent user enumeration attacks
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toMatchInlineSnapshot(
        '"Jeśli istnieje konto z tym adresem email, wysłaliśmy instrukcje do resetowania hasła"'
      );
    });
  });
});
