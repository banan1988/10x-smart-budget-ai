import type { APIRoute } from 'astro';
import { z } from 'zod';
import { AdminStatsService } from '../../../lib/services/admin-stats.service';
import { DEFAULT_USER_ID } from '../../../db/constants';

// Disable prerendering to ensure SSR for this API route
export const prerender = false;

// Zod schema for validating query parameters
const AiStatsQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.string().optional().default('1').transform((val) => {
    const num = parseInt(val, 10);
    return isNaN(num) ? 1 : Math.max(num, 1);
  }),
  limit: z.string().optional().default('20').transform((val) => {
    const num = parseInt(val, 10);
    if (isNaN(num)) return 20;
    return Math.min(Math.max(num, 1), 100); // Between 1 and 100
  }),
  sortBy: z.enum(['category', 'ai', 'manual', 'aiPercentage']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

type AiStatsQuery = z.infer<typeof AiStatsQuerySchema>;

interface CategoryStats {
  categoryId: number;
  categoryName: string;
  categoryKey: string;
  aiCount: number;
  manualCount: number;
  total: number;
  aiPercentage: number;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    percentage?: number;
  };
}

interface AiCategorizationStatsDto {
  period: {
    startDate: string;
    endDate: string;
  };
  overall: {
    totalTransactions: number;
    aiCategorized: number;
    manuallyCategorized: number;
    aiPercentage: number;
  };
  categoryBreakdown: CategoryStats[];
  trendData: {
    date: string;
    percentage: number;
  }[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Helper function to get default date range (last 30 days)
 */
function getDefaultDateRange(): { startDate: string; endDate: string } {
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 30);

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
}

/**
 * GET /api/admin/ai-stats
 *
 * Returns AI categorization statistics for admin dashboard.
 * Requires admin role authorization.
 *
 * @query startDate - Start date in YYYY-MM-DD format (optional, default: 30 days ago)
 * @query endDate - End date in YYYY-MM-DD format (optional, default: today)
 * @query page - Page number for pagination (optional, default: 1)
 * @query limit - Items per page (optional, default: 20, max: 100)
 * @query sortBy - Sort field: 'category' | 'ai' | 'manual' | 'aiPercentage' (optional)
 * @query sortOrder - Sort order: 'asc' | 'desc' (optional)
 * @returns 200 OK with AiCategorizationStatsDto
 * @returns 400 Bad Request if validation fails
 * @returns 401 Unauthorized if user is not authenticated
 * @returns 403 Forbidden if user doesn't have admin role
 * @returns 500 Internal Server Error if operation fails
 */
export const GET: APIRoute = async ({ locals, url }) => {
  try {
    // Placeholder: Check admin role (will be implemented with actual auth)
    const supabase = locals.supabase;

    // Extract and validate query parameters
    const queryParams = {
      startDate: url.searchParams.get('startDate') || undefined,
      endDate: url.searchParams.get('endDate') || undefined,
      page: url.searchParams.get('page') || undefined,
      limit: url.searchParams.get('limit') || undefined,
      sortBy: url.searchParams.get('sortBy') || undefined,
      sortOrder: url.searchParams.get('sortOrder') || undefined,
    };

    const validationResult = AiStatsQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: validationResult.error.issues,
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const query = validationResult.data;
    const { startDate, endDate } = query.startDate && query.endDate
      ? { startDate: query.startDate, endDate: query.endDate }
      : getDefaultDateRange();

    // Fetch actual AI stats from database using the service
    const stats = await AdminStatsService.getAiStats(
      supabase,
      startDate,
      endDate,
      {
        page: query.page,
        limit: query.limit,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      }
    );

    return new Response(
      JSON.stringify(stats),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching AI stats:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};

