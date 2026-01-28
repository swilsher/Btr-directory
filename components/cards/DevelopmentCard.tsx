import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Development } from '@/types/database';
import { formatNumber, getFriendlyStatus, getStatusColor, formatVerifiedDate } from '@/lib/utils';
import { MapPin, Building2, User, Calendar, CheckCircle } from 'lucide-react';

interface DevelopmentCardProps {
  development: Development;
}

export default function DevelopmentCard({ development }: DevelopmentCardProps) {
  return (
    <Link href={`/development/${development.slug}`}>
      <Card className="h-full flex flex-col">
        {development.image_url && (
          <div className="relative h-48 bg-gray-200 rounded-t-lg overflow-hidden">
            <img
              src={development.image_url}
              alt={development.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-6 flex-1 flex flex-col">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-xl font-semibold text-text-primary pr-2">{development.name}</h3>
            <Badge className={getStatusColor(development.status)}>
              {getFriendlyStatus(development.status)}
            </Badge>
          </div>

          {development.area && (
            <div className="flex items-center text-text-secondary mb-3">
              <MapPin size={16} className="mr-1 flex-shrink-0" />
              <span className="text-sm">{development.area}</span>
            </div>
          )}

          {development.description && (
            <p className="text-text-secondary text-sm mb-4 line-clamp-2">
              {development.description}
            </p>
          )}

          <div className="mt-auto space-y-2 text-sm border-t border-border pt-4">
            {development.number_of_units && (
              <div className="flex items-center justify-between">
                <span className="text-text-secondary flex items-center">
                  <Building2 size={14} className="mr-1" />
                  Units:
                </span>
                <span className="font-medium text-text-primary">{formatNumber(development.number_of_units)}</span>
              </div>
            )}
            {development.operator && (
              <div className="flex items-center justify-between">
                <span className="text-text-secondary flex items-center">
                  <User size={14} className="mr-1" />
                  Operator:
                </span>
                <span className="font-medium text-text-primary truncate ml-2">{development.operator.name}</span>
              </div>
            )}
            {development.completion_date && (
              <div className="flex items-center justify-between">
                <span className="text-text-secondary flex items-center">
                  <Calendar size={14} className="mr-1" />
                  Completion:
                </span>
                <span className="font-medium text-text-primary">
                  {new Date(development.completion_date).getFullYear()}
                </span>
              </div>
            )}
          </div>

          {/* Amenities badges */}
          {(development.amenity_gym || development.amenity_pool || development.amenity_concierge) && (
            <div className="mt-3 flex flex-wrap gap-1">
              {development.amenity_gym && (
                <span className="text-xs bg-primary-blue-light text-primary-blue px-2 py-1 rounded">Gym</span>
              )}
              {development.amenity_pool && (
                <span className="text-xs bg-primary-blue-light text-primary-blue px-2 py-1 rounded">Pool</span>
              )}
              {development.amenity_concierge && (
                <span className="text-xs bg-primary-blue-light text-primary-blue px-2 py-1 rounded">Concierge</span>
              )}
            </div>
          )}

          {/* Verification badge */}
          {development.verified && development.verified_at && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <CheckCircle size={12} className="text-green-600" />
                <span>{formatVerifiedDate(development.verified_at)}</span>
              </div>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
