import { describe, it, expect, vi, afterEach } from "vitest";
import type { APIContext } from "astro";
import { POST } from "./logout";
import { createMockAuthContext } from "../../../test/mocks/auth.mock";

// Mock Supabase client at top level
vi.mock("../../../db/supabase.client", () => ({
  createSupabaseServerInstance: vi.fn(),
}));

describe("POST /api/auth/logout", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Successful logout", () => {
    it("should return 200 on successful logout", async () => {
      // Arrange
      const request = new Request("http://localhost:4321/api/auth/logout", { method: "POST" });
      const context = createMockAuthContext(request);

      // Mock Supabase
      const { createSupabaseServerInstance } = await import("../../../db/supabase.client");
      vi.mocked(createSupabaseServerInstance).mockReturnValue({
        auth: {
          signOut: vi.fn().mockResolvedValue({
            error: null,
          }),
        },
      } as Record<string, unknown>);

      // Act
      const response = await POST(context as APIContext);

      // Assert
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("message");
      expect(data.message).toMatchInlineSnapshot('"Wylogowano pomyślnie"');
    });
  });

  describe("Error handling", () => {
    it("should return 200 on Supabase error (graceful failure)", async () => {
      // Arrange
      const request = new Request("http://localhost:4321/api/auth/logout", { method: "POST" });
      const context = createMockAuthContext(request);

      // Mock Supabase error
      const { createSupabaseServerInstance } = await import("../../../db/supabase.client");
      vi.mocked(createSupabaseServerInstance).mockReturnValue({
        auth: {
          signOut: vi.fn().mockResolvedValue({
            error: new Error("Logout failed"),
          }),
        },
      } as Record<string, unknown>);

      // Act
      const response = await POST(context as APIContext);

      // Assert
      // Should return 200 because session is cleared locally even if Supabase fails
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toBe("Wylogowano pomyślnie");
    });

    it("should return 200 on unexpected exception (graceful failure)", async () => {
      // Arrange
      const request = new Request("http://localhost:4321/api/auth/logout", { method: "POST" });
      const context = createMockAuthContext(request);

      // Mock exception
      const { createSupabaseServerInstance } = await import("../../../db/supabase.client");
      vi.mocked(createSupabaseServerInstance).mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      // Act
      const response = await POST(context as APIContext);

      // Assert
      // Should return 200 because user is logged out locally
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toBe("Wylogowano pomyślnie");
    });
  });

  describe("Content-Type", () => {
    it("should return application/json content-type", async () => {
      // Arrange
      const request = new Request("http://localhost:4321/api/auth/logout", { method: "POST" });
      const context = createMockAuthContext(request);

      // Mock Supabase
      const { createSupabaseServerInstance } = await import("../../../db/supabase.client");
      vi.mocked(createSupabaseServerInstance).mockReturnValue({
        auth: {
          signOut: vi.fn().mockResolvedValue({
            error: null,
          }),
        },
      } as Record<string, unknown>);

      // Act
      const response = await POST(context as APIContext);

      // Assert
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });
  });
});
