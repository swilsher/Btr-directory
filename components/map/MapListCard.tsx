'use client';

import { MapPin, Building2, User } from 'lucide-react';
import { getFriendlyStatus, getStatusColor, formatNumber, cn } from '@/lib/utils';

interface MapDevelopment {
  id: string;
  name: string;
  slug: string;
  city?: string;
  area?: string;
  region?: string;
  status?: string;
  number_of_units?: number;
  operator?: { name: string; slug: string } | null;
}

interface MapListCardProps {
  development: MapDevelopment;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

export default function MapListCard({ development, isSelected, onSelect, onHover }: MapListCardProps) {
  const friendlyStatus = getFriendlyStatus(development.status);
  const statusColor = getStatusColor(development.status);

  return (
    <div
      className={cn(
        'p-3 rounded-lg border cursor-pointer transition-all duration-200',
        isSelected
          ? 'border-primary-blue bg-primary-blue-light/30 shadow-sm'
          : 'border-border bg-card hover:border-gray-300 hover:shadow-sm'
      )}
      onClick={() => onSelect(development.id)}
      onMouseEnter={() => onHover(development.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Name + Status row */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h4 className="font-semibold text-text-primary text-sm leading-tight font-sans line-clamp-1">
          {development.name}
        </h4>
        <span className={`${statusColor} text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap font-medium`}>
          {friendlyStatus}
        </span>
      </div>

      {/* Location */}
      {(development.city || development.area) && (
        <div className="flex items-center text-text-secondary text-xs mb-1.5">
          <MapPin size={11} className="mr-1 flex-shrink-0" />
          <span className="truncate">
            {[development.area, development.city].filter((v, i, arr) => Boolean(v) && arr.indexOf(v) === i).join(', ')}
            {development.region ? `, ${development.region}` : ''}
          </span>
        </div>
      )}

      {/* Units + Operator row */}
      <div className="flex items-center justify-between text-xs text-text-secondary">
        {development.number_of_units ? (
          <span className="flex items-center">
            <Building2 size={11} className="mr-1" />
            {formatNumber(development.number_of_units)} units
          </span>
        ) : (
          <span />
        )}
        {development.operator && (
          <span className="flex items-center truncate ml-2">
            <User size={11} className="mr-1 flex-shrink-0" />
            <span className="truncate max-w-[120px]">{development.operator.name}</span>
          </span>
        )}
      </div>
    </div>
  );
}
