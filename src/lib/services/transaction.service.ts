import type { SupabaseClient } from '../../db/supabase.client';
import type {
  TransactionDto,
  CreateTransactionCommand,
  UpdateTransactionCommand,
  GetTransactionsQuery,
  PaginatedResponse,
  TransactionStatsDto,
  BulkCreateTransactionsCommand
} from '../../types';
import { CategoryService } from './category.service';
import { AiCategorizationService } from './ai-categorization.service';

/**
 * Service for managing financial transactions.
 * Handles CRUD operations for income and expense transactions with AI categorization.
 */
export class TransactionService {
  /**
   * Retrieves all transactions for a specific user and month with filtering and pagination.
   *
   * @param supabase - The Supabase client instance
   * @param userId - The ID of the authenticated user
   * @param query - Query parameters (month, filters, pagination)
   * @returns Promise resolving to paginated TransactionDto array
   * @throws Error if database query fails
   */
  static async getTransactions(
    supabase: SupabaseClient,
    userId: string,
    query: GetTransactionsQuery
  ): Promise<PaginatedResponse<TransactionDto>> {
    // Calculate date range for the month
    const startDate = `${query.month}-01`;
    const endDate = new Date(new Date(startDate).getFullYear(), new Date(startDate).getMonth() + 1, 0)
      .toISOString()
      .split('T')[0];

    // Build base query
    let queryBuilder = supabase
      .from('transactions')
      .select(`
        id,
        type,
        amount,
        description,
        date,
        is_ai_categorized,
        category_id,
        categories (
          id,
          key,
          translations
        )
      `, { count: 'exact' })
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate);

    // Apply filters
    if (query.categoryId && query.categoryId.length > 0) {
      queryBuilder = queryBuilder.in('category_id', query.categoryId);
    }

    if (query.type) {
      queryBuilder = queryBuilder.eq('type', query.type);
    }

    if (query.search) {
      queryBuilder = queryBuilder.ilike('description', `%${query.search}%`);
    }

    // Apply sorting
    queryBuilder = queryBuilder.order('date', { ascending: false });

    // Apply pagination
    const page = query.page || 1;
    const limit = query.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    queryBuilder = queryBuilder.range(from, to);

    // Execute query
    const { data, error, count } = await queryBuilder;

    // Handle database errors
    if (error) {
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }

    // Handle empty result
    if (!data) {
      return {
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    }

    // Transform database records to TransactionDto format
    const transactions: TransactionDto[] = data.map((transaction) => {
      let category = null;

      // If transaction has a category, transform it to CategoryDto
      if (transaction.categories && transaction.category_id) {
        const categoryData = Array.isArray(transaction.categories)
          ? transaction.categories[0]
          : transaction.categories;

        if (categoryData) {
          const translations = categoryData.translations as Record<string, string>;
          const name = translations?.pl || categoryData.key;

          category = {
            id: categoryData.id,
            key: categoryData.key,
            name,
          };
        }
      }

      return {
        id: transaction.id,
        type: transaction.type as 'income' | 'expense',
        amount: transaction.amount,
        description: transaction.description,
        date: transaction.date,
        is_ai_categorized: transaction.is_ai_categorized,
        category,
      };
    });

    return {
      data: transactions,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  /**
   * Creates a new transaction for the user.
   * For expense transactions without manual category, automatically categorizes using AI.
   *
   * @param supabase - The Supabase client instance
   * @param userId - The ID of the authenticated user
   * @param command - The transaction creation data (includes optional categoryId)
   * @returns Promise resolving to the created TransactionDto
   * @throws Error if database operation or AI categorization fails
   */
  static async createTransaction(
    supabase: SupabaseClient,
    userId: string,
    command: CreateTransactionCommand
  ): Promise<TransactionDto> {
    let categoryId: number | null = command.categoryId ?? null;
    let isAiCategorized = false;

    // For expenses without manual category, use AI to categorize
    if (command.type === 'expense' && !categoryId) {
      try {
        // Initialize AI categorization service
        const aiService = new AiCategorizationService(supabase);

        // Get AI categorization result
        const categorizationResult = await aiService.categorizeTransaction(command.description);

        // Log categorization result for debugging
        console.log('AI categorization result:', {
          categoryKey: categorizationResult.categoryKey,
          confidence: categorizationResult.confidence,
          reasoning: categorizationResult.reasoning,
        });

        // Find category by key returned from AI
        const category = await CategoryService.getCategoryByKey(supabase, categorizationResult.categoryKey);

        if (category) {
          categoryId = category.id;

          // Mark as AI categorized only if:
          // 1. Confidence is above 0 (not a fallback)
          // 2. Category is not "other" OR is "other" with high confidence (>= 0.5)
          const isSuccessfulCategorization =
            categorizationResult.confidence > 0 &&
            (categorizationResult.categoryKey !== 'other' || categorizationResult.confidence >= 0.5);

          isAiCategorized = isSuccessfulCategorization;

          console.log(`Transaction categorized as "${category.name}" (${category.key}) with confidence ${categorizationResult.confidence}`,
            isSuccessfulCategorization ? '' : '(fallback - not marked as AI categorized)');
        } else {
          console.warn(`AI returned category key "${categorizationResult.categoryKey}" but it was not found in database`);
        }
      } catch (error) {
        // Log AI categorization error but don't fail the transaction creation
        console.error('AI categorization failed:', error);
      }
    }

    // Insert the transaction
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type: command.type,
        amount: command.amount,
        description: command.description,
        date: command.date,
        category_id: categoryId,
        is_ai_categorized: isAiCategorized,
      })
      .select(`
        id,
        type,
        amount,
        description,
        date,
        is_ai_categorized,
        category_id,
        categories (
          id,
          key,
          translations
        )
      `)
      .single();

    // Handle database errors
    if (error) {
      throw new Error(`Failed to create transaction: ${error.message}`);
    }

    // Handle missing data
    if (!data) {
      throw new Error('Failed to create transaction: No data returned');
    }

    // Transform to TransactionDto
    let category = null;
    if (data.categories && data.category_id) {
      const categoryData = Array.isArray(data.categories)
        ? data.categories[0]
        : data.categories;

      if (categoryData) {
        const translations = categoryData.translations as Record<string, string>;
        const name = translations?.pl || categoryData.key;

        category = {
          id: categoryData.id,
          key: categoryData.key,
          name,
        };
      }
    }

    return {
      id: data.id,
      type: data.type as 'income' | 'expense',
      amount: data.amount,
      description: data.description,
      date: data.date,
      is_ai_categorized: data.is_ai_categorized,
      category,
    };
  }

  /**
   * Updates an existing transaction for the user.
   *
   * @param supabase - The Supabase client instance
   * @param userId - The ID of the authenticated user
   * @param transactionId - The ID of the transaction to update
   * @param command - The transaction update data
   * @returns Promise resolving to the updated TransactionDto
   * @throws Error if transaction doesn't exist, doesn't belong to user, or database operation fails
   */
  static async updateTransaction(
    supabase: SupabaseClient,
    userId: string,
    transactionId: number,
    command: UpdateTransactionCommand
  ): Promise<TransactionDto> {
    // First verify the transaction exists and belongs to the user
    const { data: existing, error: checkError } = await supabase
      .from('transactions')
      .select('id')
      .eq('id', transactionId)
      .eq('user_id', userId)
      .single();

    // Handle not found or authorization errors
    if (checkError || !existing) {
      throw new Error('Transaction not found or access denied');
    }

    // Build update object
    const updateData: Record<string, any> = {};
    if (command.type !== undefined) updateData.type = command.type;
    if (command.amount !== undefined) updateData.amount = command.amount;
    if (command.description !== undefined) updateData.description = command.description;
    if (command.date !== undefined) updateData.date = command.date;
    if (command.categoryId !== undefined) {
      updateData.category_id = command.categoryId;
      // If manually categorized, mark as not AI categorized
      if (command.categoryId !== null) {
        updateData.is_ai_categorized = false;
      }
    }

    // Update the transaction
    const { data, error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', transactionId)
      .eq('user_id', userId)
      .select(`
        id,
        type,
        amount,
        description,
        date,
        is_ai_categorized,
        category_id,
        categories (
          id,
          key,
          translations
        )
      `)
      .single();

    // Handle database errors
    if (error) {
      throw new Error(`Failed to update transaction: ${error.message}`);
    }

    // Handle missing data
    if (!data) {
      throw new Error('Failed to update transaction: No data returned');
    }

    // Transform to TransactionDto
    let category = null;
    if (data.categories && data.category_id) {
      const categoryData = Array.isArray(data.categories)
        ? data.categories[0]
        : data.categories;

      if (categoryData) {
        const translations = categoryData.translations as Record<string, string>;
        const name = translations?.pl || categoryData.key;

        category = {
          id: categoryData.id,
          key: categoryData.key,
          name,
        };
      }
    }

    return {
      id: data.id,
      type: data.type as 'income' | 'expense',
      amount: data.amount,
      description: data.description,
      date: data.date,
      is_ai_categorized: data.is_ai_categorized,
      category,
    };
  }

  /**
   * Deletes a transaction for the user.
   *
   * @param supabase - The Supabase client instance
   * @param userId - The ID of the authenticated user
   * @param transactionId - The ID of the transaction to delete
   * @returns Promise resolving when deletion is complete
   * @throws Error if transaction doesn't exist, doesn't belong to user, or database operation fails
   */
  static async deleteTransaction(
    supabase: SupabaseClient,
    userId: string,
    transactionId: number
  ): Promise<void> {
    // First verify the transaction exists and belongs to the user
    const { data: existing, error: checkError } = await supabase
      .from('transactions')
      .select('id')
      .eq('id', transactionId)
      .eq('user_id', userId)
      .single();

    // Handle not found or authorization errors
    if (checkError || !existing) {
      throw new Error('Transaction not found or access denied');
    }

    // Delete the transaction
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId)
      .eq('user_id', userId);

    // Handle database errors
    if (error) {
      throw new Error(`Failed to delete transaction: ${error.message}`);
    }
  }

  /**
   * Get statistics for transactions in a specific month.
   * Optimized to use database aggregations and avoid n+1 queries.
   *
   * @param supabase - The Supabase client instance
   * @param userId - The ID of the authenticated user
   * @param month - The month in YYYY-MM format
   * @param includeAiSummary - Whether to generate AI summary (default: false)
   * @returns Promise resolving to TransactionStatsDto
   * @throws Error if database query fails
   */
  static async getStats(
    supabase: SupabaseClient,
    userId: string,
    month: string,
    includeAiSummary: boolean = false
  ): Promise<TransactionStatsDto> {
    // Calculate date range for the month
    const startDate = `${month}-01`;
    const endDate = new Date(new Date(startDate).getFullYear(), new Date(startDate).getMonth() + 1, 0)
      .toISOString()
      .split('T')[0];

    // Query 1: Get basic aggregations without joins (fast path)
    const { data: basicStats, error: basicError } = await supabase
      .from('transactions')
      .select('id, type, amount, date, is_ai_categorized, category_id, user_id')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate);

    // Handle database errors
    if (basicError) {
      throw new Error(`Failed to fetch transaction stats: ${basicError.message}`);
    }

    // Handle empty result
    if (!basicStats || basicStats.length === 0) {
      return {
        month,
        totalIncome: 0,
        totalExpenses: 0,
        balance: 0,
        transactionCount: 0,
        categoryBreakdown: [],
        dailyBreakdown: [],
        aiCategorizedCount: 0,
        manualCategorizedCount: 0,
      };
    }

    // Calculate totals using basic stats (no DB overhead)
    const totalIncome = basicStats
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = basicStats
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate AI stats
    const aiCategorizedCount = basicStats.filter(t => t.is_ai_categorized).length;
    const manualCategorizedCount = basicStats.filter(t => !t.is_ai_categorized && t.category_id !== null).length;

    // Query 2: Get category data only for expense transactions with categories
    const expenseWithCategories = basicStats.filter(
      t => t.type === 'expense' && t.category_id !== null
    );

    const categoryMap = new Map<number | null, {
      name: string;
      total: number;
      count: number;
    }>();

    // Get unique category IDs from filtered expenses
    const uniqueCategoryIds = [...new Set(expenseWithCategories.map(t => t.category_id))];

    // Fetch category translations only if we have expense categories
    if (uniqueCategoryIds.length > 0) {
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('id, key, translations')
        .in('id', uniqueCategoryIds);

      if (categoryError) {
        throw new Error(`Failed to fetch category data: ${categoryError.message}`);
      }

      // Create category lookup map
      const categoryLookup = new Map(categoryData?.map(cat => [
        cat.id,
        {
          name: (cat.translations as Record<string, string>)?.pl || cat.key,
        },
      ]) || []);

      // Calculate category breakdown
      expenseWithCategories.forEach(transaction => {
        const categoryId = transaction.category_id;
        const categoryInfo = categoryLookup.get(categoryId);
        const categoryName = categoryInfo?.name || 'Bez kategorii';

        const existing = categoryMap.get(categoryId);
        if (existing) {
          existing.total += transaction.amount;
          existing.count += 1;
        } else {
          categoryMap.set(categoryId, {
            name: categoryName,
            total: transaction.amount,
            count: 1,
          });
        }
      });
    }

    // Add uncategorized expenses
    const uncategorized = basicStats.filter(t => t.type === 'expense' && t.category_id === null);
    if (uncategorized.length > 0) {
      const total = uncategorized.reduce((sum, t) => sum + t.amount, 0);
      categoryMap.set(null, {
        name: 'Bez kategorii',
        total,
        count: uncategorized.length,
      });
    }

    // Convert to array and calculate percentages
    const categoryBreakdown = Array.from(categoryMap.entries()).map(([categoryId, data]) => ({
      categoryId,
      categoryName: data.name,
      total: data.total,
      count: data.count,
      percentage: totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0,
    })).sort((a, b) => b.total - a.total);

    // Calculate daily breakdown
    const dailyMap = new Map<string, { income: number; expenses: number }>();

    // Initialize all days in the month with 0 values
    const daysInMonth = new Date(new Date(startDate).getFullYear(), new Date(startDate).getMonth() + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${month}-${String(day).padStart(2, '0')}`;
      dailyMap.set(dateStr, { income: 0, expenses: 0 });
    }

    // Aggregate transactions by date
    basicStats.forEach(transaction => {
      const existing = dailyMap.get(transaction.date);
      if (existing) {
        if (transaction.type === 'income') {
          existing.income += transaction.amount;
        } else {
          existing.expenses += transaction.amount;
        }
      }
    });

    const dailyBreakdown = Array.from(dailyMap.entries()).map(([date, totals]) => ({
      date,
      income: totals.income,
      expenses: totals.expenses,
    })).sort((a, b) => a.date.localeCompare(b.date));

    const stats: TransactionStatsDto = {
      month,
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      transactionCount: basicStats.length,
      categoryBreakdown,
      dailyBreakdown,
      aiCategorizedCount,
      manualCategorizedCount,
    };

    // Generate AI summary if requested
    if (includeAiSummary) {
      // TODO: Implement AI service integration
      // For now, return a mock summary
      const formatAmount = (amount: number) => `${(amount / 100).toFixed(2)} zł`;
      const balanceInfo = stats.balance >= 0
        ? `Twoje saldo jest pozytywne: ${formatAmount(stats.balance)}.`
        : `Uwaga! Wydatki przekroczyły przychody o ${formatAmount(Math.abs(stats.balance))}.`;

      const topCategory = categoryBreakdown[0];
      const categoryInfo = topCategory
        ? `Najwięcej wydałeś/aś na: ${topCategory.categoryName} (${topCategory.percentage.toFixed(1)}%).`
        : '';

      stats.aiSummary = `W ${month} odnotowano ${stats.transactionCount} transakcji. ${balanceInfo} ${categoryInfo}`;
    }

    return stats;
  }

  /**
   * Bulk create transactions.
   *
   * @param supabase - The Supabase client instance
   * @param userId - The ID of the authenticated user
   * @param command - Bulk create command with array of transactions
   * @returns Promise resolving to array of created TransactionDto
   * @throws Error if database operation fails
   */
  static async bulkCreateTransactions(
    supabase: SupabaseClient,
    userId: string,
    command: BulkCreateTransactionsCommand
  ): Promise<TransactionDto[]> {
    // Prepare insert data
    const insertData = command.transactions.map(transaction => ({
      user_id: userId,
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      date: transaction.date,
      category_id: null,
      is_ai_categorized: false,
    }));

    // Insert transactions
    const { data, error } = await supabase
      .from('transactions')
      .insert(insertData)
      .select(`
        id,
        type,
        amount,
        description,
        date,
        is_ai_categorized,
        category_id,
        categories (
          id,
          key,
          translations
        )
      `);

    // Handle database errors
    if (error) {
      throw new Error(`Failed to bulk create transactions: ${error.message}`);
    }

    // Handle missing data
    if (!data) {
      throw new Error('Failed to bulk create transactions: No data returned');
    }

    // Transform to TransactionDto
    return data.map((transaction) => {
      let category = null;
      if (transaction.categories && transaction.category_id) {
        const categoryData = Array.isArray(transaction.categories)
          ? transaction.categories[0]
          : transaction.categories;

        if (categoryData) {
          const translations = categoryData.translations as Record<string, string>;
          const name = translations?.pl || categoryData.key;

          category = {
            id: categoryData.id,
            key: categoryData.key,
            name,
          };
        }
      }

      return {
        id: transaction.id,
        type: transaction.type as 'income' | 'expense',
        amount: transaction.amount,
        description: transaction.description,
        date: transaction.date,
        is_ai_categorized: transaction.is_ai_categorized,
        category,
      };
    });
  }

  /**
   * Bulk delete transactions.
   *
   * @param supabase - The Supabase client instance
   * @param userId - The ID of the authenticated user
   * @param ids - Array of transaction IDs to delete
   * @returns Promise resolving to number of deleted transactions
   * @throws Error if database operation fails
   */
  static async bulkDeleteTransactions(
    supabase: SupabaseClient,
    userId: string,
    ids: number[]
  ): Promise<number> {
    // Delete transactions
    const { error, count } = await supabase
      .from('transactions')
      .delete({ count: 'exact' })
      .in('id', ids)
      .eq('user_id', userId);

    // Handle database errors
    if (error) {
      throw new Error(`Failed to bulk delete transactions: ${error.message}`);
    }

    return count || 0;
  }
}

