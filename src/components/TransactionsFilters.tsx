import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import type { TransactionFilters, CategoryDto } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TransactionsFiltersProps {
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
}

/**
 * Component for filtering transactions
 * Includes search, type, category, and month filters
 */
export function TransactionsFilters({
  filters,
  onFiltersChange,
}: TransactionsFiltersProps) {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      search: e.target.value || undefined,
      page: 1, // Reset to first page
    });
  };

  const handleTypeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      type: value === 'all' ? undefined : (value as 'income' | 'expense'),
      page: 1,
    });
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      month: e.target.value,
      page: 1,
    });
  };

  const handleCategoryToggle = (categoryId: number) => {
    const currentCategories = filters.categoryId || [];
    const newCategories = currentCategories.includes(categoryId)
      ? currentCategories.filter((id) => id !== categoryId)
      : [...currentCategories, categoryId];

    onFiltersChange({
      ...filters,
      categoryId: newCategories.length > 0 ? newCategories : undefined,
      page: 1,
    });
  };

  const handleClearCategory = (categoryId: number) => {
    const currentCategories = filters.categoryId || [];
    const newCategories = currentCategories.filter((id) => id !== categoryId);

    onFiltersChange({
      ...filters,
      categoryId: newCategories.length > 0 ? newCategories : undefined,
      page: 1,
    });
  };

  const selectedCategories = categories.filter((cat) =>
    filters.categoryId?.includes(cat.id)
  );

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <h2 className="text-lg font-semibold">Filtry</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Szukaj</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Opis transakcji..."
              className="pl-8"
              value={filters.search || ''}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {/* Month */}
        <div className="space-y-2">
          <Label htmlFor="month">Miesiąc</Label>
          <Input
            id="month"
            type="month"
            value={filters.month}
            onChange={handleMonthChange}
          />
        </div>

        {/* Type */}
        <div className="space-y-2">
          <Label htmlFor="type">Typ</Label>
          <Select
            value={filters.type || 'all'}
            onValueChange={handleTypeChange}
          >
            <SelectTrigger id="type">
              <SelectValue placeholder="Wszystkie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie</SelectItem>
              <SelectItem value="income">Przychody</SelectItem>
              <SelectItem value="expense">Wydatki</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Categories */}
        <div className="space-y-2">
          <Label>Kategorie</Label>
          <Popover open={isCategoryOpen} onOpenChange={setIsCategoryOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={isCategoryOpen}
                className="w-full justify-between"
              >
                {selectedCategories.length > 0
                  ? `Wybrano: ${selectedCategories.length}`
                  : 'Wybierz kategorie'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Szukaj kategorii..." />
                <CommandList>
                  <CommandEmpty>
                    {isLoadingCategories
                      ? 'Ładowanie...'
                      : 'Nie znaleziono kategorii'}
                  </CommandEmpty>
                  <CommandGroup>
                    {categories.map((category) => (
                      <CommandItem
                        key={category.id}
                        onSelect={() => handleCategoryToggle(category.id)}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <div
                            className={`h-4 w-4 border rounded ${
                              filters.categoryId?.includes(category.id)
                                ? 'bg-primary border-primary'
                                : 'border-input'
                            }`}
                          />
                          <span>{category.name}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Selected categories badges */}
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCategories.map((category) => (
            <Badge
              key={category.id}
              variant="secondary"
              className="gap-1"
            >
              {category.name}
              <button
                type="button"
                onClick={() => handleClearCategory(category.id)}
                className="ml-1 hover:text-destructive"
                aria-label={`Usuń filtr ${category.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

