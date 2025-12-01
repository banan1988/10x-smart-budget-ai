import type { SupabaseClient } from '@supabase/supabase-js';

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
 * Service for fetching and aggregating AI categorization statistics from Supabase
 */
export class AdminStatsService {
  /**
   * Get overall AI categorization statistics for a date range
   *
   * @param supabase - Supabase client
   * @param startDate - Start date in YYYY-MM-DD format
   * @param endDate - End date in YYYY-MM-DD format
   * @returns Promise<AiCategorizationStatsDto>
   */
  static async getAiStats(
    supabase: SupabaseClient,
    startDate: string,
    endDate: string,
    options?: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<AiCategorizationStatsDto> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const sortBy = options?.sortBy || 'category';
    const sortOrder = options?.sortOrder || 'asc';

    try {
      // Fetch all transactions in the date range
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('id, category_id, is_ai_categorized, date, amount')
        .gte('date', startDate)
        .lte('date', endDate);

      if (txError) {
        throw new Error(`Failed to fetch transactions: ${txError.message}`);
      }

      // Fetch categories for mapping
      const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('id, key, translations');

      if (catError) {
        throw new Error(`Failed to fetch categories: ${catError.message}`);
      }

      // Build category map
      const categoryMap = new Map(
        (categories || []).map(cat => [
          cat.id,
          {
            key: cat.key,
            name: this.getCategoryName(cat.translations),
          },
        ])
      );

      // Aggregate stats by category
      const categoryStats = new Map<number, { ai: number; manual: number }>();

      (transactions || []).forEach(tx => {
        const catId = tx.category_id;
        if (!catId) return;

        if (!categoryStats.has(catId)) {
          categoryStats.set(catId, { ai: 0, manual: 0 });
        }

        const stats = categoryStats.get(catId)!;
        if (tx.is_ai_categorized) {
          stats.ai++;
        } else {
          stats.manual++;
        }
      });

      // Calculate overall stats
      const totalAi = (transactions || []).filter(t => t.is_ai_categorized).length;
      const totalManual = (transactions || []).length - totalAi;
      const totalTransactions = (transactions || []).length;
      const aiPercentage = totalTransactions > 0 ? (totalAi / totalTransactions) * 100 : 0;

      // Build category breakdown
      const categoryBreakdown: CategoryStats[] = Array.from(categoryStats.entries()).map(
        ([catId, stats]) => {
          const category = categoryMap.get(catId);
          const total = stats.ai + stats.manual;
          const percentage = total > 0 ? (stats.ai / total) * 100 : 0;

          return {
            categoryId: catId,
            categoryName: category?.name || `Kategoria ${catId}`,
            categoryKey: category?.key || `category-${catId}`,
            aiCount: stats.ai,
            manualCount: stats.manual,
            total,
            aiPercentage: percentage,
            trend: {
              direction: 'neutral' as const,
              percentage: 0,
            },
          };
        }
      );

      // Sort category breakdown
      categoryBreakdown.sort((a, b) => {
        let aValue: string | number = a.categoryName;
        let bValue: string | number = b.categoryName;

        switch (sortBy) {
          case 'ai':
            aValue = a.aiCount;
            bValue = b.aiCount;
            break;
          case 'manual':
            aValue = a.manualCount;
            bValue = b.manualCount;
            break;
          case 'aiPercentage':
            aValue = a.aiPercentage;
            bValue = b.aiPercentage;
            break;
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const cmp = aValue.localeCompare(bValue);
          return sortOrder === 'asc' ? cmp : -cmp;
        }

        const diff = (aValue as number) - (bValue as number);
        return sortOrder === 'asc' ? diff : -diff;
      });

      // Apply pagination
      const totalPages = Math.ceil(categoryBreakdown.length / limit);
      const startIdx = (page - 1) * limit;
      const endIdx = startIdx + limit;
      const paginatedBreakdown = categoryBreakdown.slice(startIdx, endIdx);

      // Generate daily trend data
      const trendData = this.generateTrendData(transactions || [], startDate, endDate);

      return {
        period: {
          startDate,
          endDate,
        },
        overall: {
          totalTransactions,
          aiCategorized: totalAi,
          manuallyCategorized: totalManual,
          aiPercentage: parseFloat(aiPercentage.toFixed(2)),
        },
        categoryBreakdown: paginatedBreakdown,
        trendData,
        pagination: {
          page,
          limit,
          total: categoryBreakdown.length,
          totalPages,
        },
      };
    } catch (error) {
      console.error('Error fetching AI stats:', error);
      throw error;
    }
  }

  /**
   * Extract category name from translations JSON based on locale
   */
  private static getCategoryName(translations: Record<string, string> | null): string {
    if (!translations) return 'Nieznana';

    // Try Polish locale first, then fallback to any available translation
    return translations['pl'] || translations['en'] || Object.values(translations)[0] || 'Nieznana';
  }

  /**
   * Generate daily trend data for the given date range
   */
  private static generateTrendData(
    transactions: any[],
    startDate: string,
    endDate: string
  ): { date: string; percentage: number }[] {
    // Group transactions by date
    const dailyStats = new Map<string, { ai: number; total: number }>();

    transactions.forEach(tx => {
      const date = tx.date;
      if (!dailyStats.has(date)) {
        dailyStats.set(date, { ai: 0, total: 0 });
      }

      const stats = dailyStats.get(date)!;
      stats.total++;
      if (tx.is_ai_categorized) {
        stats.ai++;
      }
    });

    // Generate data for all days in range (even without transactions)
    const start = new Date(startDate);
    const end = new Date(endDate);
    const trendData: { date: string; percentage: number }[] = [];

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      const stats = dailyStats.get(dateStr);

      if (stats) {
        const percentage = (stats.ai / stats.total) * 100;
        trendData.push({
          date: dateStr,
          percentage: parseFloat(percentage.toFixed(2)),
        });
      } else {
        // Add 0% for days without transactions
        trendData.push({
          date: dateStr,
          percentage: 0,
        });
      }
    }

    return trendData;
  }
}

