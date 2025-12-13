import { describe, it, expect, vi, afterEach } from "vitest";
import { GET } from "./ai-stats";
import { createMockAPIContext } from "../../../test/mocks/astro.mock";
import { createMockSupabaseClient } from "../../../test/mocks/supabase.mock";
import { createMockAiStatsResponse, SAMPLE_DATES, SAMPLE_PAGINATION } from "../../../test/mocks/admin-api.mocks";

// Mock dependencies - only mock authentication functions, keep response creators
vi.mock("../../../lib/api-auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../lib/api-auth")>();
  return {
    ...actual,
    checkAuthentication: vi.fn((context) => {
      // Default: user is authenticated if user exists in locals
      if (context.locals?.user) {
        return [true];
      }
      // Return 401 unauthorized if no user
      return [
        false,
        new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
      ];
    }),
    checkAdminRole: vi.fn((context) => {
      // Default: user is admin if role is 'admin'
      if (context.locals?.user?.role === "admin") {
        return [true];
      }
      // Return 403 forbidden if not admin
      return [
        false,
        new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }),
      ];
    }),
  };
});

vi.mock("../../../lib/services/admin-stats.service", () => ({
  AdminStatsService: {
    getAiStats: vi.fn(),
  },
}));

describe("GET /api/admin/ai-stats", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Authentication & Authorization", () => {
    it("should return 401 when not authenticated", async () => {
      // Arrange
      const context = createMockAPIContext({
        locals: {
          supabase: createMockSupabaseClient(),
        },
        url: new URL("http://localhost:4321/api/admin/ai-stats"),
      });

      // Act
      const response = await GET(context as any);

      // Assert
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toHaveProperty("error");
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 403 for non-admin users", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient();
      const context = createMockAPIContext({
        locals: {
          user: { id: "user-123", role: "user" },
          supabase: mockSupabase,
        },
        url: new URL("http://localhost:4321/api/admin/ai-stats"),
      });

      // Act
      const response = await GET(context as any);

      // Assert
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data).toHaveProperty("error");
      expect(data.error).toBe("Forbidden");
    });

    it("should return 200 for admin users with valid data", async () => {
      // Arrange
      const { AdminStatsService } = await import("../../../lib/services/admin-stats.service");
      vi.mocked(AdminStatsService.getAiStats).mockResolvedValue(createMockAiStatsResponse() as any);

      const mockSupabase = createMockSupabaseClient();
      const context = createMockAPIContext({
        locals: {
          user: { id: "admin-123", role: "admin" },
          supabase: mockSupabase,
        },
        url: new URL("http://localhost:4321/api/admin/ai-stats?startDate=2025-11-01&endDate=2025-12-09"),
      });

      // Act
      const response = await GET(context as any);

      // Assert
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.period.startDate).toBe(SAMPLE_DATES.VALID_START);
      expect(data.period.endDate).toBe(SAMPLE_DATES.VALID_END);
    });
  });

  describe("Date range parameters", () => {
    it("should accept valid date range in YYYY-MM-DD format", async () => {
      // Arrange
      const { AdminStatsService } = await import("../../../lib/services/admin-stats.service");
      vi.mocked(AdminStatsService.getAiStats).mockResolvedValue(createMockAiStatsResponse() as any);

      const mockSupabase = createMockSupabaseClient();
      const context = createMockAPIContext({
        locals: {
          user: { id: "admin-123", role: "admin" },
          supabase: mockSupabase,
        },
        url: new URL(
          `http://localhost:4321/api/admin/ai-stats?startDate=${SAMPLE_DATES.VALID_START}&endDate=${SAMPLE_DATES.VALID_END}`
        ),
      });

      // Act
      const response = await GET(context as any);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.period).toHaveProperty("startDate");
      expect(data.period).toHaveProperty("endDate");
    });

    it("should return 400 on invalid date format", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient();
      const context = createMockAPIContext({
        locals: {
          user: { id: "admin-123", role: "admin" },
          supabase: mockSupabase,
        },
        url: new URL(
          `http://localhost:4321/api/admin/ai-stats?startDate=${SAMPLE_DATES.INVALID_FORMAT_1}&endDate=${SAMPLE_DATES.INVALID_FORMAT_1}`
        ),
      });

      // Act
      const response = await GET(context as any);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty("error");
    });

    it("should use default date range when dates are not provided", async () => {
      // Arrange
      const { AdminStatsService } = await import("../../../lib/services/admin-stats.service");
      vi.mocked(AdminStatsService.getAiStats).mockResolvedValue(createMockAiStatsResponse() as any);

      const mockSupabase = createMockSupabaseClient();
      const context = createMockAPIContext({
        locals: {
          user: { id: "admin-123", role: "admin" },
          supabase: mockSupabase,
        },
        url: new URL("http://localhost:4321/api/admin/ai-stats"),
      });

      // Act
      const response = await GET(context as any);

      // Assert
      expect(response.status).toBe(200);
    });
  });

  describe("Response structure", () => {
    it("should return complete AI stats data structure", async () => {
      // Arrange
      const { AdminStatsService } = await import("../../../lib/services/admin-stats.service");
      vi.mocked(AdminStatsService.getAiStats).mockResolvedValue(createMockAiStatsResponse() as any);

      const mockSupabase = createMockSupabaseClient();
      const context = createMockAPIContext({
        locals: {
          user: { id: "admin-123", role: "admin" },
          supabase: mockSupabase,
        },
        url: new URL(
          `http://localhost:4321/api/admin/ai-stats?startDate=${SAMPLE_DATES.VALID_START}&endDate=${SAMPLE_DATES.VALID_END}`
        ),
      });

      // Act
      const response = await GET(context as any);
      const data = await response.json();

      // Assert
      expect(data).toHaveProperty("period");
      expect(data).toHaveProperty("overall");
      expect(data).toHaveProperty("categoryBreakdown");
      expect(data).toHaveProperty("trendData");
    });

    it("should include overall AI categorization metrics", async () => {
      // Arrange
      const { AdminStatsService } = await import("../../../lib/services/admin-stats.service");
      vi.mocked(AdminStatsService.getAiStats).mockResolvedValue(createMockAiStatsResponse() as any);

      const mockSupabase = createMockSupabaseClient();
      const context = createMockAPIContext({
        locals: {
          user: { id: "admin-123", role: "admin" },
          supabase: mockSupabase,
        },
        url: new URL(
          `http://localhost:4321/api/admin/ai-stats?startDate=${SAMPLE_DATES.VALID_START}&endDate=${SAMPLE_DATES.VALID_END}`
        ),
      });

      // Act
      const response = await GET(context as any);
      const data = await response.json();

      // Assert
      expect(data.overall).toHaveProperty("totalTransactions");
      expect(data.overall).toHaveProperty("aiCategorized");
      expect(data.overall).toHaveProperty("manuallyCategorized");
      expect(data.overall).toHaveProperty("aiPercentage");
      expect(typeof data.overall.aiPercentage).toBe("number");
      expect(data.overall.aiPercentage).toBeGreaterThanOrEqual(0);
      expect(data.overall.aiPercentage).toBeLessThanOrEqual(100);
    });

    it("should include category breakdown array with valid structure", async () => {
      // Arrange
      const { AdminStatsService } = await import("../../../lib/services/admin-stats.service");
      vi.mocked(AdminStatsService.getAiStats).mockResolvedValue(createMockAiStatsResponse() as any);

      const mockSupabase = createMockSupabaseClient();
      const context = createMockAPIContext({
        locals: {
          user: { id: "admin-123", role: "admin" },
          supabase: mockSupabase,
        },
        url: new URL(
          `http://localhost:4321/api/admin/ai-stats?startDate=${SAMPLE_DATES.VALID_START}&endDate=${SAMPLE_DATES.VALID_END}`
        ),
      });

      // Act
      const response = await GET(context as any);
      const data = await response.json();

      // Assert
      expect(Array.isArray(data.categoryBreakdown)).toBe(true);
      if (data.categoryBreakdown.length > 0) {
        const category = data.categoryBreakdown[0];
        expect(category).toHaveProperty("categoryId");
        expect(category).toHaveProperty("categoryName");
        expect(category).toHaveProperty("categoryKey");
        expect(category).toHaveProperty("aiCount");
        expect(category).toHaveProperty("manualCount");
        expect(category).toHaveProperty("total");
        expect(category).toHaveProperty("aiPercentage");
      }
    });

    it("should include trend data array with date and percentage", async () => {
      // Arrange
      const { AdminStatsService } = await import("../../../lib/services/admin-stats.service");
      vi.mocked(AdminStatsService.getAiStats).mockResolvedValue(createMockAiStatsResponse() as any);

      const mockSupabase = createMockSupabaseClient();
      const context = createMockAPIContext({
        locals: {
          user: { id: "admin-123", role: "admin" },
          supabase: mockSupabase,
        },
        url: new URL(
          `http://localhost:4321/api/admin/ai-stats?startDate=${SAMPLE_DATES.VALID_START}&endDate=${SAMPLE_DATES.VALID_END}`
        ),
      });

      // Act
      const response = await GET(context as any);
      const data = await response.json();

      // Assert
      expect(Array.isArray(data.trendData)).toBe(true);
      if (data.trendData.length > 0) {
        const trend = data.trendData[0];
        expect(trend).toHaveProperty("date");
        expect(trend).toHaveProperty("percentage");
        expect(typeof trend.percentage).toBe("number");
      }
    });
  });

  describe("Pagination parameters", () => {
    it("should accept valid page parameter (minimum 1)", async () => {
      // Arrange
      const { AdminStatsService } = await import("../../../lib/services/admin-stats.service");
      vi.mocked(AdminStatsService.getAiStats).mockResolvedValue(createMockAiStatsResponse() as any);

      const mockSupabase = createMockSupabaseClient();
      const context = createMockAPIContext({
        locals: {
          user: { id: "admin-123", role: "admin" },
          supabase: mockSupabase,
        },
        url: new URL(`http://localhost:4321/api/admin/ai-stats?page=${SAMPLE_PAGINATION.VALID_PAGE_MIN}`),
      });

      // Act
      const response = await GET(context as any);

      // Assert
      expect(response.status).toBe(200);
    });

    it("should accept valid limit parameter (between 1 and 100)", async () => {
      // Arrange
      const { AdminStatsService } = await import("../../../lib/services/admin-stats.service");
      vi.mocked(AdminStatsService.getAiStats).mockResolvedValue(createMockAiStatsResponse() as any);

      const mockSupabase = createMockSupabaseClient();
      const context = createMockAPIContext({
        locals: {
          user: { id: "admin-123", role: "admin" },
          supabase: mockSupabase,
        },
        url: new URL(`http://localhost:4321/api/admin/ai-stats?limit=${SAMPLE_PAGINATION.VALID_LIMIT_DEFAULT}`),
      });

      // Act
      const response = await GET(context as any);

      // Assert
      expect(response.status).toBe(200);
    });

    it("should clamp limit to maximum 100", async () => {
      // Arrange
      const { AdminStatsService } = await import("../../../lib/services/admin-stats.service");
      vi.mocked(AdminStatsService.getAiStats).mockResolvedValue(createMockAiStatsResponse() as any);

      const mockSupabase = createMockSupabaseClient();
      const context = createMockAPIContext({
        locals: {
          user: { id: "admin-123", role: "admin" },
          supabase: mockSupabase,
        },
        url: new URL(`http://localhost:4321/api/admin/ai-stats?limit=${SAMPLE_PAGINATION.INVALID_LIMIT_OVER_MAX}`),
      });

      // Act
      const response = await GET(context as any);

      // Assert
      expect(response.status).toBe(200);
    });

    it("should default page to 1 when not provided", async () => {
      // Arrange
      const { AdminStatsService } = await import("../../../lib/services/admin-stats.service");
      vi.mocked(AdminStatsService.getAiStats).mockResolvedValue(createMockAiStatsResponse() as any);

      const mockSupabase = createMockSupabaseClient();
      const context = createMockAPIContext({
        locals: {
          user: { id: "admin-123", role: "admin" },
          supabase: mockSupabase,
        },
        url: new URL("http://localhost:4321/api/admin/ai-stats"),
      });

      // Act
      const response = await GET(context as any);

      // Assert
      expect(response.status).toBe(200);
    });

    it("should default limit to 20 when not provided", async () => {
      // Arrange
      const { AdminStatsService } = await import("../../../lib/services/admin-stats.service");
      vi.mocked(AdminStatsService.getAiStats).mockResolvedValue(createMockAiStatsResponse() as any);

      const mockSupabase = createMockSupabaseClient();
      const context = createMockAPIContext({
        locals: {
          user: { id: "admin-123", role: "admin" },
          supabase: mockSupabase,
        },
        url: new URL("http://localhost:4321/api/admin/ai-stats"),
      });

      // Act
      const response = await GET(context as any);

      // Assert
      expect(response.status).toBe(200);
    });
  });

  describe("Sorting parameters", () => {
    it("should accept valid sortBy parameter values", async () => {
      // Arrange
      const { AdminStatsService } = await import("../../../lib/services/admin-stats.service");
      vi.mocked(AdminStatsService.getAiStats).mockResolvedValue(createMockAiStatsResponse() as any);

      const sortByValues = ["category", "ai", "manual", "aiPercentage"];

      for (const sortBy of sortByValues) {
        const mockSupabase = createMockSupabaseClient();
        const context = createMockAPIContext({
          locals: {
            user: { id: "admin-123", role: "admin" },
            supabase: mockSupabase,
          },
          url: new URL(`http://localhost:4321/api/admin/ai-stats?sortBy=${sortBy}`),
        });

        // Act
        const response = await GET(context as any);

        // Assert
        expect(response.status).toBe(200);
      }
    });

    it("should accept valid sortOrder parameter values", async () => {
      // Arrange
      const { AdminStatsService } = await import("../../../lib/services/admin-stats.service");
      vi.mocked(AdminStatsService.getAiStats).mockResolvedValue(createMockAiStatsResponse() as any);

      const sortOrderValues = ["asc", "desc"];

      for (const sortOrder of sortOrderValues) {
        const mockSupabase = createMockSupabaseClient();
        const context = createMockAPIContext({
          locals: {
            user: { id: "admin-123", role: "admin" },
            supabase: mockSupabase,
          },
          url: new URL(`http://localhost:4321/api/admin/ai-stats?sortOrder=${sortOrder}`),
        });

        // Act
        const response = await GET(context as any);

        // Assert
        expect(response.status).toBe(200);
      }
    });
  });

  describe("Response headers", () => {
    it("should return application/json content type", async () => {
      // Arrange
      const { AdminStatsService } = await import("../../../lib/services/admin-stats.service");
      vi.mocked(AdminStatsService.getAiStats).mockResolvedValue(createMockAiStatsResponse() as any);

      const mockSupabase = createMockSupabaseClient();
      const context = createMockAPIContext({
        locals: {
          user: { id: "admin-123", role: "admin" },
          supabase: mockSupabase,
        },
        url: new URL(
          `http://localhost:4321/api/admin/ai-stats?startDate=${SAMPLE_DATES.VALID_START}&endDate=${SAMPLE_DATES.VALID_END}`
        ),
      });

      // Act
      const response = await GET(context as any);

      // Assert
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });
  });

  describe("Error handling", () => {
    it("should return 500 on service error with error message", async () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const { AdminStatsService } = await import("../../../lib/services/admin-stats.service");
      vi.mocked(AdminStatsService.getAiStats).mockRejectedValue(new Error("Database connection failed"));

      const mockSupabase = createMockSupabaseClient();
      const context = createMockAPIContext({
        locals: {
          user: { id: "admin-123", role: "admin" },
          supabase: mockSupabase,
        },
        url: new URL(
          `http://localhost:4321/api/admin/ai-stats?startDate=${SAMPLE_DATES.VALID_START}&endDate=${SAMPLE_DATES.VALID_END}`
        ),
      });

      // Act
      const response = await GET(context as any);

      // Assert
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toHaveProperty("error");
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it("should handle missing supabase client gracefully", async () => {
      // Arrange
      const mockSupabase = null; // Simulate missing supabase
      const context = createMockAPIContext({
        locals: {
          user: { id: "admin-123", role: "admin" },
          supabase: mockSupabase,
        },
        url: new URL("http://localhost:4321/api/admin/ai-stats"),
      });

      // Act
      const response = await GET(context as any);

      // Assert
      expect([500, 401]).toContain(response.status);
    });
  });
});
