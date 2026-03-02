'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MapFilters from '@/components/map/MapFilters';
import MapListCard from '@/components/map/MapListCard';
import { supabase } from '@/lib/supabase';
import { getFriendlyStatus } from '@/lib/utils';
import { Loader2, MapPin } from 'lucide-react';

// Leaflet requires window/document — load client-side only
const MapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-full bg-gray-50 rounded-lg">
      <Loader2 className="animate-spin text-primary-blue" size={40} />
    </div>
  ),
});

interface MapDevelopment {
  id: string;
  name: string;
  slug: string;
  area?: string;
  region?: string;
  status?: string;
  number_of_units?: number;
  latitude?: number;
  longitude?: number;
  development_type?: string;
  image_url?: string;
  operator?: { name: string; slug: string } | null;
}

export default function MapPage() {
  const [developments, setDevelopments] = useState<MapDevelopment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [operatorFilter, setOperatorFilter] = useState('');

  // Selection / hover state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [fitBoundsKey, setFitBoundsKey] = useState(0);

  // List scroll ref
  const listRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Fetch developments with coordinates
  useEffect(() => {
    fetchDevelopments();
  }, []);

  const fetchDevelopments = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('developments')
        .select(`
          id, name, slug, area, region, status, number_of_units,
          latitude, longitude, development_type, image_url,
          operator:operators(name, slug)
        `)
        .eq('is_published', true)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .order('name');

      if (fetchError) throw fetchError;

      // Supabase returns operator as array for relation joins — normalize to single object
      const normalized = (data || []).map((d: Record<string, unknown>) => ({
        ...d,
        operator: Array.isArray(d.operator) ? d.operator[0] || null : d.operator,
      })) as MapDevelopment[];
      setDevelopments(normalized);
    } catch (err) {
      console.error('Error fetching developments:', err);
      setError('Failed to load map data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Filter logic (client-side, same pattern as multifamily page)
  const filteredDevelopments = useMemo(() => {
    return developments.filter(dev => {
      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const nameMatch = dev.name?.toLowerCase().includes(term);
        const areaMatch = dev.area?.toLowerCase().includes(term);
        const operatorMatch = dev.operator?.name?.toLowerCase().includes(term);
        if (!nameMatch && !areaMatch && !operatorMatch) return false;
      }

      // Region filter
      if (regionFilter && dev.region !== regionFilter) return false;

      // Type filter
      if (typeFilter && dev.development_type !== typeFilter) return false;

      // Status filter
      if (statusFilter && getFriendlyStatus(dev.status) !== statusFilter) return false;

      // Operator filter
      if (operatorFilter && dev.operator?.name !== operatorFilter) return false;

      return true;
    });
  }, [developments, searchTerm, typeFilter, regionFilter, statusFilter, operatorFilter]);

  // Derive unique operator names (sorted alphabetically) for the filter dropdown
  const operatorNames = useMemo(() => {
    const names = developments
      .map(dev => dev.operator?.name)
      .filter((name): name is string => Boolean(name));
    return [...new Set(names)].sort((a, b) => a.localeCompare(b));
  }, [developments]);

  // Trigger fit bounds when filters change
  useEffect(() => {
    setFitBoundsKey(prev => prev + 1);
  }, [searchTerm, typeFilter, regionFilter, statusFilter, operatorFilter]);

  // Scroll list card into view when selected
  useEffect(() => {
    if (selectedId) {
      const cardEl = cardRefs.current.get(selectedId);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedId]);

  // Handlers
  const handleSelectDevelopment = useCallback((id: string) => {
    setSelectedId(prev => prev === id ? null : id);
  }, []);

  const handleHoverDevelopment = useCallback((id: string | null) => {
    setHoveredId(id);
  }, []);

  const handleResetFilters = useCallback(() => {
    setSearchTerm('');
    setTypeFilter('');
    setRegionFilter('');
    setStatusFilter('');
    setOperatorFilter('');
  }, []);

  const setCardRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) {
      cardRefs.current.set(id, el);
    } else {
      cardRefs.current.delete(id);
    }
  }, []);

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex justify-center items-center h-[60vh]">
          <Loader2 className="animate-spin text-primary-blue" size={48} />
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="flex flex-col justify-center items-center h-[60vh] text-center px-4">
          <p className="text-red-600 mb-4 font-medium">{error}</p>
          <button
            onClick={fetchDevelopments}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Header />

      {/* Filter bar */}
      <MapFilters
        searchTerm={searchTerm}
        typeFilter={typeFilter}
        regionFilter={regionFilter}
        statusFilter={statusFilter}
        operatorFilter={operatorFilter}
        operators={operatorNames}
        onSearchChange={setSearchTerm}
        onTypeChange={setTypeFilter}
        onRegionChange={setRegionFilter}
        onStatusChange={setStatusFilter}
        onOperatorChange={setOperatorFilter}
        onReset={handleResetFilters}
        totalCount={developments.length}
        filteredCount={filteredDevelopments.length}
      />

      {/* Split panel: list + map */}
      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        {/* Left: Card list */}
        <div
          ref={listRef}
          className="w-full lg:w-[380px] xl:w-[420px] flex-shrink-0 overflow-y-auto border-r border-border bg-gray-50 order-2 lg:order-1"
          style={{ maxHeight: 'calc(100vh - 130px)' }}
        >
          {filteredDevelopments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center">
              <MapPin size={32} className="text-text-secondary mb-3" />
              <p className="text-text-secondary font-medium">No developments match your filters</p>
              <button
                onClick={handleResetFilters}
                className="mt-3 text-primary-blue hover:text-primary-blue-hover text-sm font-semibold transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {filteredDevelopments.map(dev => (
                <div key={dev.id} ref={(el) => setCardRef(dev.id, el)}>
                  <MapListCard
                    development={dev}
                    isSelected={dev.id === selectedId}
                    onSelect={handleSelectDevelopment}
                    onHover={handleHoverDevelopment}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Map */}
        <div className="flex-1 order-1 lg:order-2 h-[350px] lg:h-auto">
          <MapView
            developments={filteredDevelopments}
            selectedId={selectedId}
            hoveredId={hoveredId}
            onSelectDevelopment={handleSelectDevelopment}
            fitBoundsKey={fitBoundsKey}
          />
        </div>
      </div>
    </div>
  );
}
