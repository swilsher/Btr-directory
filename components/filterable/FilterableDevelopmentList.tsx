'use client';

import { useState, useEffect } from 'react';
import DevelopmentFilters, { FilterValues } from '@/components/filters/DevelopmentFilters';
import DevelopmentCard from '@/components/cards/DevelopmentCard';
import { Development } from '@/types/database';
import { getFriendlyStatus } from '@/lib/utils';

interface FilterableDevelopmentListProps {
  developments: Development[];
  showSubCategoryFilter?: boolean;
}

export default function FilterableDevelopmentList({ developments, showSubCategoryFilter = false }: FilterableDevelopmentListProps) {
  const [filteredDevelopments, setFilteredDevelopments] = useState<Development[]>(developments);
  const [itemsToShow, setItemsToShow] = useState(24);
  const [loadingMore, setLoadingMore] = useState(false);

  const handleFilterChange = (filters: FilterValues) => {
    let filtered = [...developments];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (dev) =>
          dev.name.toLowerCase().includes(searchLower) ||
          dev.area?.toLowerCase().includes(searchLower) ||
          dev.description?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.region) {
      filtered = filtered.filter((dev) => dev.region === filters.region);
    }

    if (filters.status) {
      filtered = filtered.filter((dev) => getFriendlyStatus(dev.status) === filters.status);
    }

    if (filters.coLiving) {
      filtered = filtered.filter((dev) => dev.sub_category?.includes('Co-Living'));
    }

    if (filters.minUnits) {
      filtered = filtered.filter((dev) => (dev.number_of_units || 0) >= parseInt(filters.minUnits));
    }
    if (filters.maxUnits) {
      filtered = filtered.filter((dev) => (dev.number_of_units || 0) <= parseInt(filters.maxUnits));
    }

    if (filters.amenityGym) {
      filtered = filtered.filter((dev) => dev.amenity_gym === true);
    }
    if (filters.amenityPool) {
      filtered = filtered.filter((dev) => dev.amenity_pool === true);
    }
    if (filters.amenityCoworking) {
      filtered = filtered.filter((dev) => dev.amenity_coworking === true);
    }
    if (filters.amenityConcierge) {
      filtered = filtered.filter((dev) => dev.amenity_concierge === true);
    }

    if (filters.petsAllowed) {
      filtered = filtered.filter((dev) => dev.pets_allowed === true);
    }
    if (filters.wheelchairAccessible) {
      filtered = filtered.filter((dev) => dev.wheelchair_accessible === true);
    }

    setFilteredDevelopments(filtered);
    setItemsToShow(24);
  };

  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setItemsToShow((prev) => prev + 24);
      setLoadingMore(false);
    }, 300);
  };

  return (
    <>
      <DevelopmentFilters onFilterChange={handleFilterChange} showSubCategoryFilter={showSubCategoryFilter} />

      {filteredDevelopments.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-text-secondary text-lg">
            No developments found matching your criteria.
          </p>
          <p className="text-text-muted mt-2">Try adjusting your filters.</p>
        </div>
      ) : (
        <>
          <div className="mb-6 text-text-secondary">
            Showing {Math.min(itemsToShow, filteredDevelopments.length)} of {filteredDevelopments.length} developments
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDevelopments.slice(0, itemsToShow).map((dev) => (
              <DevelopmentCard key={dev.id} development={dev} />
            ))}
          </div>

          {itemsToShow < filteredDevelopments.length && (
            <div className="flex justify-center mt-8">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="bg-primary-blue text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-blue-hover transition-all duration-200 disabled:opacity-50"
              >
                {loadingMore ? 'Loading...' : 'Load More Developments'}
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
