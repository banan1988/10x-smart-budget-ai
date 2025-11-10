import type { SupabaseClient } from '../../db/supabase.client';
import type { CategoryDto } from '../../types';

/**
 * Service for managing categories.
 * Handles data retrieval and transformation for category-related operations.
 */
export class CategoryService {
  /**
   * Retrieves all global categories from the database.
   * Maps database records to CategoryDto objects with Polish translations.
   *
   * @param supabase - The Supabase client instance
   * @returns Promise resolving to an array of CategoryDto objects
   * @throws Error if database query fails
   */
  static async getGlobalCategories(supabase: SupabaseClient): Promise<CategoryDto[]> {
    // Query the categories table
    const { data, error } = await supabase
      .from('categories')
      .select('id, key, translations');

    // Handle database errors
    if (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    // Handle empty result
    if (!data) {
      return [];
    }

    // Transform database records to CategoryDto format
    const categories: CategoryDto[] = data.map((category) => {
      // Extract Polish translation from the translations JSON object
      const translations = category.translations as Record<string, string>;
      const name = translations?.pl || category.key; // Fallback to key if translation is missing

      return {
        id: category.id,
        key: category.key,
        name,
      };
    });

    // Sort by translated name (Polish) instead of key for proper alphabetical order
    return categories.sort((a, b) => a.name.localeCompare(b.name, 'pl'));
  }
}

