import type { SupabaseClient } from "../../db/supabase.client";
import type { CategoryDto } from "../../types";

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
    const { data, error } = await supabase.from("categories").select("id, key, translations");

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
    return categories.sort((a, b) => a.name.localeCompare(b.name, "pl"));
  }

  /**
   * Finds a category by its key.
   *
   * @param supabase - The Supabase client instance
   * @param key - The category key to search for
   * @returns Promise resolving to CategoryDto or null if not found
   * @throws Error if database query fails
   */
  static async getCategoryByKey(supabase: SupabaseClient, key: string): Promise<CategoryDto | null> {
    // Query the categories table
    const { data, error } = await supabase.from("categories").select("id, key, translations").eq("key", key).single();

    // Handle database errors
    if (error) {
      // Not found is not an error in this case
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to fetch category: ${error.message}`);
    }

    // Handle empty result
    if (!data) {
      return null;
    }

    // Extract Polish translation from the translations JSON object
    const translations = data.translations as Record<string, string>;
    const name = translations?.pl || data.key;

    return {
      id: data.id,
      key: data.key,
      name,
    };
  }
}
