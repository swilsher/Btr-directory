'use client';

import Link from 'next/link';
import { MapPin, Building2, User, ArrowRight } from 'lucide-react';
import { getFriendlyStatus, getStatusColor, formatNumber } from '@/lib/utils';

interface MapDevelopment {
  id: string;
  name: string;
  slug: string;
  city?: string;
  area?: string;
  status?: string;
  number_of_units?: number;
  operator?: { name: string; slug: string } | null;
}

interface MapPopupCardProps {
  development: MapDevelopment;
}

export default function MapPopupCard({ development }: MapPopupCardProps) {
  const friendlyStatus = getFriendlyStatus(development.status);
  const statusColor = getStatusColor(development.status);

  return (
    <div className="font-sans min-w-[220px]">
      {/* Name and status */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-text-primary text-sm leading-tight font-sans">
          {development.name}
        </h3>
        <span className={`${statusColor} text-xs px-2 py-0.5 rounded-full whitespace-nowrap font-medium`}>
          {friendlyStatus}
        </span>
      </div>

      {/* Location */}
      {(development.city || development.area) && (
        <div className="flex items-center text-text-secondary text-xs mb-2">
          <MapPin size={12} className="mr-1 flex-shrink-0" />
          <span>{[development.area, development.city].filter((v, i, arr) => Boolean(v) && arr.indexOf(v) === i).join(', ')}</span>
        </div>
      )}

      {/* Key details */}
      <div className="space-y-1 text-xs border-t border-gray-100 pt-2 mb-3">
        {development.number_of_units && (
          <div className="flex items-center justify-between">
            <span className="text-text-secondary flex items-center">
              <Building2 size={11} className="mr-1" /> Units
            </span>
            <span className="font-medium text-text-primary">
              {formatNumber(development.number_of_units)}
            </span>
          </div>
        )}
        {development.operator && (
          <div className="flex items-center justify-between">
            <span className="text-text-secondary flex items-center">
              <User size={11} className="mr-1" /> Operator
            </span>
            <span className="font-medium text-text-primary truncate ml-2 max-w-[140px]">
              {development.operator.name}
            </span>
          </div>
        )}
      </div>

      {/* Link to detail page */}
      <Link
        href={`/development/${development.slug}`}
        className="flex items-center text-primary-blue hover:text-primary-blue-hover text-xs font-semibold transition-colors"
      >
        View Details <ArrowRight size={12} className="ml-1" />
      </Link>
    </div>
  );
}
