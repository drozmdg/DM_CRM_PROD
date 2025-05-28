import React from 'react';
import { Calendar, Filter, Search, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';

export interface TimelineFiltersProps {
  isOpen: boolean;
  onToggle: () => void;
  filters: {
    dateRange: {
      start: string;
      end: string;
    };
    entityTypes: string[];
    searchQuery: string;
    selectedCustomer: string;
  };
  onFiltersChange: (filters: any) => void;
  customers: Array<{ id: string; name: string }>;
  onClearFilters: () => void;
}

const ENTITY_TYPES = [
  { id: 'customer', label: 'Customers', color: 'bg-blue-500' },
  { id: 'process', label: 'Processes', color: 'bg-green-500' },
  { id: 'document', label: 'Documents', color: 'bg-purple-500' },
  { id: 'team', label: 'Teams', color: 'bg-orange-500' },
  { id: 'service', label: 'Services', color: 'bg-cyan-500' },
  { id: 'contact', label: 'Contacts', color: 'bg-pink-500' },
];

export function TimelineFilters({
  isOpen,
  onToggle,
  filters,
  onFiltersChange,
  customers,
  onClearFilters,
}: TimelineFiltersProps) {
  const handleEntityTypeChange = (entityType: string, checked: boolean) => {
    const newEntityTypes = checked
      ? [...filters.entityTypes, entityType]
      : filters.entityTypes.filter(type => type !== entityType);
    
    onFiltersChange({
      ...filters,
      entityTypes: newEntityTypes,
    });
  };

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    onFiltersChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [field]: value,
      },
    });
  };

  const handleSearchChange = (value: string) => {
    onFiltersChange({
      ...filters,
      searchQuery: value,
    });
  };

  const handleCustomerChange = (value: string) => {
    onFiltersChange({
      ...filters,
      selectedCustomer: value === 'all' ? '' : value,
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.entityTypes.length > 0 && filters.entityTypes.length < ENTITY_TYPES.length) count++;
    if (filters.searchQuery) count++;
    if (filters.selectedCustomer) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className={`transition-all duration-300 ${isOpen ? 'w-80' : 'w-12'} flex-shrink-0`}>
      <Card className="h-full">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="p-1"
              >
                <Filter className="h-4 w-4" />
              </Button>
              {isOpen && (
                <>
                  <CardTitle className="text-sm">Filters</CardTitle>
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </>
              )}
            </div>
            {isOpen && activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>

        {isOpen && (
          <CardContent className="space-y-6">
            {/* Search */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Search Events</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search descriptions, titles..."
                  value={filters.searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-8"
                />
                {filters.searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSearchChange('')}
                    className="absolute right-1 top-1 h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date Range
              </Label>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs text-muted-foreground">From</Label>
                  <Input
                    type="date"
                    value={filters.dateRange.start}
                    onChange={(e) => handleDateRangeChange('start', e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <Input
                    type="date"
                    value={filters.dateRange.end}
                    onChange={(e) => handleDateRangeChange('end', e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Entity Types */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Entity Types</Label>
              <div className="space-y-2">
                {ENTITY_TYPES.map((entityType) => (
                  <div key={entityType.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={entityType.id}
                      checked={filters.entityTypes.includes(entityType.id)}
                      onCheckedChange={(checked) =>
                        handleEntityTypeChange(entityType.id, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={entityType.id}
                      className="text-sm font-normal flex items-center gap-2 cursor-pointer"
                    >
                      <div className={`w-2 h-2 rounded-full ${entityType.color}`} />
                      {entityType.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Customer</Label>
              <Select
                value={filters.selectedCustomer || 'all'}
                onValueChange={handleCustomerChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All customers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All customers</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Active Filters Summary */}
            {activeFiltersCount > 0 && (
              <div className="pt-4 border-t">
                <Label className="text-xs text-muted-foreground">
                  {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} applied
                </Label>
                <div className="flex flex-wrap gap-1 mt-2">
                  {filters.searchQuery && (
                    <Badge variant="outline" className="text-xs">
                      Search: "{filters.searchQuery}"
                    </Badge>
                  )}
                  {filters.selectedCustomer && (
                    <Badge variant="outline" className="text-xs">
                      Customer: {customers.find(c => c.id === filters.selectedCustomer)?.name}
                    </Badge>
                  )}
                  {(filters.dateRange.start || filters.dateRange.end) && (
                    <Badge variant="outline" className="text-xs">
                      Date range
                    </Badge>
                  )}
                  {filters.entityTypes.length > 0 && filters.entityTypes.length < ENTITY_TYPES.length && (
                    <Badge variant="outline" className="text-xs">
                      {filters.entityTypes.length} type{filters.entityTypes.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
