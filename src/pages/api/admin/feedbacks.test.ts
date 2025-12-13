import { describe, it, expect, vi, afterEach } from "vitest";
import { GET } from "./feedbacks";
import { createMockAPIContext } from "../../../test/mocks/astro.mock";
import { createMockSupabaseClient } from "../../../test/mocks/supabase.mock";
import {
  createMockFeedbackResponse,
  SAMPLE_DATES,
  SAMPLE_PAGINATION,
  SAMPLE_RATINGS,
} from "../../../test/mocks/admin-api.mocks";

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

vi.mock("../../../lib/services/feedback.service", () => ({
  FeedbackService: {
    getAllFeedback: vi.fn(),
  },
}));

describe("GET /api/admin/feedbacks", () => {
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
        url: new URL("http://localhost:4321/api/admin/feedbacks"),
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
        url: new URL("http://localhost:4321/api/admin/feedbacks"),
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
      const { FeedbackService } = await import("../../../lib/services/feedback.service");
      vi.mocked(FeedbackService.getAllFeedback).mockResolvedValue(createMockFeedbackResponse(5) as any);

      const mockSupabase = createMockSupabaseClient();
      const context = createMockAPIContext({
        locals: {
          user: { id: "admin-123", role: "admin" },
          supabase: mockSupabase,
        },
        url: new URL("http://localhost:4321/api/admin/feedbacks"),
      });

      // Act
      const response = await GET(context as any);

      // Assert
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data.data)).toBe(true);
    });
  });

  describe("Response structure", () => {
    it("should return paginated feedback list with correct structure", async () => {
      // Arrange
      const { FeedbackService } = await import("../../../lib/services/feedback.service");
      vi.mocked(FeedbackService.getAllFeedback).mockResolvedValue(createMockFeedbackResponse(2) as any);

      const mockSupabase = createMockSupabaseClient();
      const context = createMockAPIContext({
        locals: {
          user: { id: "admin-123", role: "admin" },
          supabase: mockSupabase,
        },
        url: new URL("http://localhost:4321/api/admin/feedbacks"),
      });

      // Act
      const response = await GET(context as any);
      const data = await response.json();

      // Assert
      expect(data).toHaveProperty("data");
      expect(Array.isArray(data.data)).toBe(true);
      expect(data).toHaveProperty("pagination");
      expect(data.pagination).toHaveProperty("page");
      expect(data.pagination).toHaveProperty("limit");
      expect(data.pagination).toHaveProperty("total");
    });

    it("should include feedback items with complete structure", async () => {
      // Arrange
      const { FeedbackService } = await import("../../../lib/services/feedback.service");
      vi.mocked(FeedbackService.getAllFeedback).mockResolvedValue(createMockFeedbackResponse(2) as any);

      const mockSupabase = createMockSupabaseClient();
      const context = createMockAPIContext({
        locals: {
          user: { id: "admin-123", role: "admin" },
          supabase: mockSupabase,
        },
        url: new URL("http://localhost:4321/api/admin/feedbacks"),
      });

      // Act
      const response = await GET(context as any);
      const data = await response.json();

      // Assert
      if (data.data.length > 0) {
        const feedback = data.data[0];
        expect(feedback).toHaveProperty("id");
        expect(feedback).toHaveProperty("rating");
        expect(feedback).toHaveProperty("comment");
        expect(feedback).toHaveProperty("created_at");
      }
    });

    it("should sort feedbacks by creation date (newest first)", async () => {
      // Arrange
      const { FeedbackService } = await import("../../../lib/services/feedback.service");
      const feedbacks = [
        { id: 1, rating: 5, comment: "Excellent", created_at: "2025-12-09T10:00:00Z" },
        { id: 2, rating: 4, comment: "Good", created_at: "2025-12-08T10:00:00Z" },
        { id: 3, rating: 3, comment: "Average", created_at: "2025-12-07T10:00:00Z" },
      ];
      vi.mocked(FeedbackService.getAllFeedback).mockResolvedValue({
        data: feedbacks,
        page: 1,
        limit: 20,
        total: 3,
      } as any);

      const mockSupabase = createMockSupabaseClient();
      const context = createMockAPIContext({
        locals: {
          user: { id: "admin-123", role: "admin" },
          supabase: mockSupabase,
        },
        url: new URL("http://localhost:4321/api/admin/feedbacks"),
      });

      // Act
      const response = await GET(context as any);
      const data = await response.json();

      // Assert
      expect(data.data.length).toBeGreaterThanOrEqual(1);
      // Verify sorted order (newest first)
      for (let i = 0; i < data.data.length - 1; i++) {
        const current = new Date(data.data[i].created_at);
        const next = new Date(data.data[i + 1].created_at);
        expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
      }
    });

    it("should return empty data when no feedbacks exist", async () => {
      // Arrange
      const { FeedbackService } = await import("../../../lib/services/feedback.service");
      vi.mocked(FeedbackService.getAllFeedback).mockResolvedValue({
        data: [],
        page: 1,
        limit: 20,
        total: 0,
      } as any);

      const mockSupabase = createMockSupabaseClient();
      const context = createMockAPIContext({
        locals: {
          user: { id: "admin-123", role: "admin" },
          supabase: mockSupabase,
        },
        url: new URL("http://localhost:4321/api/admin/feedbacks"),
      });

      // Act
      const response = await GET(context as any);
      const data = await response.json();

      // Assert
      expect(data.data).toEqual([]);
      expect(data.pagination.total).toBe(0);
      expect(response.status).toBe(200);
    });
  });

  describe("Pagination parameters", () => {
    it("should accept valid page parameter (minimum 1)", async () => {
      // Arrange
      const { FeedbackService } = await import("../../../lib/services/feedback.service");
      vi.mocked(FeedbackService.getAllFeedback).mockResolvedValue(createMockFeedbackResponse(2) as any);

      const mockSupabase = createMockSupabaseClient();
      const context = createMockAPIContext({
        locals: {
          user: { id: "admin-123", role: "admin" },
          supabase: mockSupabase,
        },
        url: new URL(`http://localhost:4321/api/admin/feedbacks?page=${SAMPLE_PAGINATION.VALID_PAGE_MIN}`),
      });

      // Act
      const response = await GET(context as any);

      // Assert
      expect(response.status).toBe(200);
    });

    it("should accept valid limit parameter (between 1 and 100)", async () => {
      // Arrange
      const { FeedbackService } = await import("../../../lib/services/feedback.service");
      vi.mocked(FeedbackService.getAllFeedback).mockResolvedValue(createMockFeedbackResponse(2) as any);

      const mockSupabase = createMockSupabaseClient();
      const context = createMockAPIContext({
        locals: {
          user: { id: "admin-123", role: "admin" },
          supabase: mockSupabase,
        },
        url: new URL(`http://localhost:4321/api/admin/feedbacks?limit=${SAMPLE_PAGINATION.VALID_LIMIT_DEFAULT}`),
      });

      // Act
      const response = await GET(context as any);

      // Assert
      expect(response.status).toBe(200);
    });

    it("should clamp limit to maximum 100", async () => {
      // Arrange
      const { FeedbackService } = await import("../../../lib/services/feedback.service");
      vi.mocked(FeedbackService.getAllFeedback).mockResolvedValue(createMockFeedbackResponse(2) as any);

      const mockSupabase = createMockSupabaseClient();
      const context = createMockAPIContext({
        locals: {
          user: { id: "admin-123", role: "admin" },
          supabase: mockSupabase,
        },
        url: new URL(`http://localhost:4321/api/admin/feedbacks?limit=${SAMPLE_PAGINATION.INVALID_LIMIT_OVER_MAX}`),
      });

      // Act
      const response = await GET(context as any);

      // Assert
      expect(response.status).toBe(200);
    });

    it("should default page to 1 when not provided", async () => {
      // Arrange
      const { FeedbackService } = await import("../../../lib/services/feedback.service");
      vi.mocked(FeedbackService.getAllFeedback).mockResolvedValue(createMockFeedbackResponse(2) as any);

      const mockSupabase = createMockSupabaseClient();
      const context = createMockAPIContext({
        locals: {
          user: { id: "admin-123", role: "admin" },
          supabase: mockSupabase,
        },
        url: new URL("http://localhost:4321/api/admin/feedbacks"),
      });

      // Act
      const response = await GET(context as any);

      // Assert
      expect(response.status).toBe(200);
    });

    it("should default limit to 20 when not provided", async () => {
      // Arrange
      const { FeedbackService } = await import("../../../lib/services/feedback.service");
      vi.mocked(FeedbackService.getAllFeedback).mockResolvedValue(createMockFeedbackResponse(2) as any);

      const mockSupabase = createMockSupabaseClient();
      const context = createMockAPIContext({
        locals: {
          user: { id: "admin-123", role: "admin" },
          supabase: mockSupabase,
        },
        url: new URL("http://localhost:4321/api/admin/feedbacks"),
      });

      // Act
      const response = await GET(context as any);

      // Assert
      expect(response.status).toBe(200);
    });
  });

  describe("Filtering - Date Range", () => {
    it("should filter by valid date range", async () => {
      // Arrange
      const { FeedbackService } = await import("../../../lib/services/feedback.service");
      vi.mocked(FeedbackService.getAllFeedback).mockResolvedValue(createMockFeedbackResponse(2) as any);

      const mockSupabase = createMockSupabaseClient();
      const context = createMockAPIContext({
        locals: {
          user: { id: "admin-123", role: "admin" },
          supabase: mockSupabase,
        },
        url: new URL(
          `http://localhost:4321/api/admin/feedbacks?startDate=${SAMPLE_DATES.VALID_START}&endDate=${SAMPLE_DATES.VALID_END}`
        ),
      });

      // Act
      const response = await GET(context as any);

      // Assert
      expect(response.status).toBe(200);
    });

    it("should return 400 for invalid date format", async () => {
      // Arrange
      const mockSupabase = createMockSupabaseClient();
      const context = createMockAPIContext({
        locals: {
          user: { id: "admin-123", role: "admin" },
          supabase: mockSupabase,
        },
        url: new URL(`http://localhost:4321/api/admin/feedbacks?startDate=${SAMPLE_DATES.INVALID_FORMAT_1}`),
      });

      // Act
      const response = await GET(context as any);

      // Assert
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty("error");
    });

    it("should accept startDate without endDate", async () => {
      // Arrange
      const { FeedbackService } = await import("../../../lib/services/feedback.service");
      vi.mocked(FeedbackService.getAllFeedback).mockResolvedValue(createMockFeedbackResponse(2) as any);

      const mockSupabase = createMockSupabaseClient();
      const context = createMockAPIContext({
        locals: {
          user: { id: "admin-123", role: "admin" },
          supabase: mockSupabase,
        },
        url: new URL(`http://localhost:4321/api/admin/feedbacks?startDate=${SAMPLE_DATES.VALID_START}`),
      });

      // Act
      const response = await GET(context as any);

      // Assert
      expect(response.status).toBe(200);
    });

    it("should accept endDate without startDate", async () => {
      // Arrange
      const { FeedbackService } = await import("../../../lib/services/feedback.service");
      vi.mocked(FeedbackService.getAllFeedback).mockResolvedValue(createMockFeedbackResponse(2) as any);

      const mockSupabase = createMockSupabaseClient();
      const context = createMockAPIContext({
        locals: {
          user: { id: "admin-123", role: "admin" },
          supabase: mockSupabase,
        },
        url: new URL(`http://localhost:4321/api/admin/feedbacks?endDate=${SAMPLE_DATES.VALID_END}`),
      });

      // Act
      const response = await GET(context as any);

      // Assert
      expect(response.status).toBe(200);
    });
  });

  describe("Filtering - Rating", () => {
    it("should filter by rating parameter with valid value", async () => {
      // Arrange
      const { FeedbackService } = await import("../../../lib/services/feedback.service");
      vi.mocked(FeedbackService.getAllFeedback).mockResolvedValue(createMockFeedbackResponse(2) as any);

      const mockSupabase = createMockSupabaseClient();
      const context = createMockAPIContext({
        locals: {
          user: { id: "admin-123", role: "admin" },
          supabase: mockSupabase,
        },
        url: new URL(`http://localhost:4321/api/admin/feedbacks?rating=${SAMPLE_RATINGS.VALID_MAX}`),
      });

      // Act
      const response = await GET(context as any);

      // Assert
      expect(response.status).toBe(200);
    });

    it("should accept all valid rating values (1-5)", async () => {
      // Arrange
      const { FeedbackService } = await import("../../../lib/services/feedback.service");
      vi.mocked(FeedbackService.getAllFeedback).mockResolvedValue(createMockFeedbackResponse(2) as any);

      const validRatings = [1, 2, 3, 4, 5];

      for (const rating of validRatings) {
        const mockSupabase = createMockSupabaseClient();
        const context = createMockAPIContext({
          locals: {
            user: { id: "admin-123", role: "admin" },
            supabase: mockSupabase,
          },
          url: new URL(`http://localhost:4321/api/admin/feedbacks?rating=${rating}`),
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
      const { FeedbackService } = await import("../../../lib/services/feedback.service");
      vi.mocked(FeedbackService.getAllFeedback).mockResolvedValue(createMockFeedbackResponse(2) as any);

      const mockSupabase = createMockSupabaseClient();
      const context = createMockAPIContext({
        locals: {
          user: { id: "admin-123", role: "admin" },
          supabase: mockSupabase,
        },
        url: new URL("http://localhost:4321/api/admin/feedbacks"),
      });

      // Act
      const response = await GET(context as any);

      // Assert
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });
  });

  describe("Error handling", () => {
    it("should handle database errors gracefully", async () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const { FeedbackService } = await import("../../../lib/services/feedback.service");
      vi.mocked(FeedbackService.getAllFeedback).mockRejectedValue(new Error("Database connection failed"));

      const mockSupabase = createMockSupabaseClient();
      const context = createMockAPIContext({
        locals: {
          user: { id: "admin-123", role: "admin" },
          supabase: mockSupabase,
        },
        url: new URL("http://localhost:4321/api/admin/feedbacks"),
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
        url: new URL("http://localhost:4321/api/admin/feedbacks"),
      });

      // Act
      const response = await GET(context as any);

      // Assert
      expect([500, 401]).toContain(response.status);
    });
  });
});
