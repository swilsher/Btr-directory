import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Development } from '@/types/database';
import { formatNumber, formatCurrency, formatDate, getFriendlyStatus, getStatusColor } from '@/lib/utils';
import { MapPin, Calendar, Building2, DollarSign, Home, Check, ExternalLink, User, Briefcase } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getDevelopment(slug: string): Promise<Development | null> {
  const { data, error } = await supabase
    .from('developments')
    .select('*, asset_owner:asset_owners(*), operator:operators(*)')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const development = await getDevelopment(slug);

  if (!development) {
    return {
      title: 'Development Not Found',
    };
  }

  const amenities = [];
  if (development.amenity_gym) amenities.push('gym');
  if (development.amenity_pool) amenities.push('pool');
  if (development.amenity_coworking) amenities.push('coworking space');
  if (development.amenity_concierge) amenities.push('concierge');

  const amenitiesText = amenities.length > 0 ? ` with ${amenities.slice(0, 3).join(', ')}` : '';
  const operatorText = development.operator ? ` operated by ${development.operator.name}` : '';
  const unitsText = development.number_of_units ? ` Features ${formatNumber(development.number_of_units)} units` : '';

  const description = `${development.name} is a ${development.development_type?.toLowerCase()} build-to-rent development in ${development.area || 'the UK'}${operatorText}.${unitsText}${amenitiesText}.`;

  return {
    title: `${development.name} | BTR Development in ${development.area || 'UK'}`,
    description: description.substring(0, 160),
    keywords: [`${development.name}`, `BTR ${development.area}`, `${development.development_type}`, 'build to rent UK', development.operator?.name || ''],
    alternates: {
      canonical: `https://ukbtrdirectory.com/development/${slug}`,
    },
    openGraph: {
      title: `${development.name} | BTR Development in ${development.area || 'UK'}`,
      description: description.substring(0, 160),
      url: `https://ukbtrdirectory.com/development/${slug}`,
      siteName: 'UK BTR Directory',
      locale: 'en_GB',
      type: 'website',
      images: development.image_url ? [
        {
          url: development.image_url,
          width: 1200,
          height: 630,
          alt: development.name,
        },
      ] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${development.name} | BTR Development`,
      description: description.substring(0, 160),
      images: development.image_url ? [development.image_url] : [],
    },
  };
}

export default async function DevelopmentPage({ params }: PageProps) {
  const { slug } = await params;
  const development = await getDevelopment(slug);

  if (!development) {
    notFound();
  }

  const amenities = [
    { key: 'amenity_gym', label: 'Gym', value: development.amenity_gym },
    { key: 'amenity_pool', label: 'Pool', value: development.amenity_pool },
    { key: 'amenity_coworking', label: 'Coworking Space', value: development.amenity_coworking },
    { key: 'amenity_concierge', label: 'Concierge', value: development.amenity_concierge },
    { key: 'amenity_cinema', label: 'Cinema', value: development.amenity_cinema },
    { key: 'amenity_roof_terrace', label: 'Roof Terrace', value: development.amenity_roof_terrace },
    { key: 'amenity_bike_storage', label: 'Bike Storage', value: development.amenity_bike_storage },
    { key: 'amenity_pet_facilities', label: 'Pet Facilities', value: development.amenity_pet_facilities },
    { key: 'amenity_ev_charging', label: 'EV Charging', value: development.amenity_ev_charging },
    { key: 'amenity_parcel_room', label: 'Parcel Room', value: development.amenity_parcel_room },
    { key: 'amenity_guest_suites', label: 'Guest Suites', value: development.amenity_guest_suites },
    { key: 'amenity_playground', label: 'Playground', value: development.amenity_playground },
  ].filter((a) => a.value);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        {/* Hero Image */}
        {development.image_url && (
          <div className="w-full h-96 bg-gray-200 relative">
            <img
              src={development.image_url}
              alt={development.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
        )}

        <div className="container-custom py-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold text-text-primary mb-2">{development.name}</h1>
                {development.area && (
                  <div className="flex items-center text-text-secondary mb-2">
                    <MapPin size={18} className="mr-2" />
                    <span className="text-lg">{development.area}</span>
                    {development.region && <span className="ml-2">• {development.region}</span>}
                  </div>
                )}
              </div>
              <Badge className={`${getStatusColor(development.status)} text-base px-4 py-2`}>
                {getFriendlyStatus(development.status)}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-3">
              {development.website_url && (
                <Link href={development.website_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="primary">
                    Visit Website <ExternalLink className="ml-2" size={18} />
                  </Button>
                </Link>
              )}
              <Link href="/submit-correction">
                <Button variant="outline">Report Issue</Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              {development.description && (
                <div className="bg-white rounded-lg border border-border p-6">
                  <h2 className="text-2xl font-semibold mb-4">About</h2>
                  <p className="text-text-secondary leading-relaxed">{development.description}</p>
                </div>
              )}

              {/* Key Statistics */}
              <div className="bg-white rounded-lg border border-border p-6">
                <h2 className="text-2xl font-semibold mb-4">Key Statistics</h2>
                <div className="grid grid-cols-2 gap-4">
                  {development.number_of_units && (
                    <div className="flex items-start">
                      <Building2 className="text-primary-blue mr-3 mt-1" size={20} />
                      <div>
                        <div className="text-text-secondary text-sm">Total Units</div>
                        <div className="font-semibold text-lg">{formatNumber(development.number_of_units)}</div>
                      </div>
                    </div>
                  )}
                  {development.completion_date && (
                    <div className="flex items-start">
                      <Calendar className="text-primary-blue mr-3 mt-1" size={20} />
                      <div>
                        <div className="text-text-secondary text-sm">Completion Date</div>
                        <div className="font-semibold text-lg">{formatDate(development.completion_date)}</div>
                      </div>
                    </div>
                  )}
                  {development.total_investment && (
                    <div className="flex items-start">
                      <DollarSign className="text-primary-blue mr-3 mt-1" size={20} />
                      <div>
                        <div className="text-text-secondary text-sm">Total Investment</div>
                        <div className="font-semibold text-lg">{formatCurrency(development.total_investment)}</div>
                      </div>
                    </div>
                  )}
                  {development.average_rent && (
                    <div className="flex items-start">
                      <Home className="text-primary-blue mr-3 mt-1" size={20} />
                      <div>
                        <div className="text-text-secondary text-sm">Average Rent</div>
                        <div className="font-semibold text-lg">{formatCurrency(development.average_rent)}/month</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Unit Mix */}
              {(development.studio_units || development.one_bed_units || development.two_bed_units || development.three_bed_plus_units) && (
                <div className="bg-white rounded-lg border border-border p-6">
                  <h2 className="text-2xl font-semibold mb-4">Unit Mix</h2>
                  <div className="space-y-3">
                    {development.studio_units && (
                      <div className="flex justify-between items-center">
                        <span className="text-text-secondary">Studio</span>
                        <span className="font-semibold">{formatNumber(development.studio_units)} units</span>
                      </div>
                    )}
                    {development.one_bed_units && (
                      <div className="flex justify-between items-center">
                        <span className="text-text-secondary">1 Bedroom</span>
                        <span className="font-semibold">{formatNumber(development.one_bed_units)} units</span>
                      </div>
                    )}
                    {development.two_bed_units && (
                      <div className="flex justify-between items-center">
                        <span className="text-text-secondary">2 Bedroom</span>
                        <span className="font-semibold">{formatNumber(development.two_bed_units)} units</span>
                      </div>
                    )}
                    {development.three_bed_plus_units && (
                      <div className="flex justify-between items-center">
                        <span className="text-text-secondary">3+ Bedroom</span>
                        <span className="font-semibold">{formatNumber(development.three_bed_plus_units)} units</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Amenities */}
              {amenities.length > 0 && (
                <div className="bg-white rounded-lg border border-border p-6">
                  <h2 className="text-2xl font-semibold mb-4">Amenities</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {amenities.map((amenity) => (
                      <div key={amenity.key} className="flex items-center">
                        <Check className="text-green-600 mr-2" size={18} />
                        <span className="text-text-secondary">{amenity.label}</span>
                      </div>
                    ))}
                  </div>
                  {development.amenities_other && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-text-secondary">{development.amenities_other}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Accessibility */}
              {(development.pets_allowed || development.wheelchair_accessible) && (
                <div className="bg-white rounded-lg border border-border p-6">
                  <h2 className="text-2xl font-semibold mb-4">Accessibility</h2>
                  <div className="space-y-3">
                    {development.pets_allowed && (
                      <div>
                        <div className="flex items-center mb-2">
                          <Check className="text-green-600 mr-2" size={18} />
                          <span className="font-medium">Pet Friendly</span>
                        </div>
                        {development.pet_policy_details && (
                          <p className="text-text-secondary text-sm ml-6">{development.pet_policy_details}</p>
                        )}
                      </div>
                    )}
                    {development.wheelchair_accessible && (
                      <div>
                        <div className="flex items-center mb-2">
                          <Check className="text-green-600 mr-2" size={18} />
                          <span className="font-medium">Wheelchair Accessible</span>
                        </div>
                        {development.accessibility_features && (
                          <p className="text-text-secondary text-sm ml-6">{development.accessibility_features}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Asset Owner */}
              {development.asset_owner && (
                <div className="bg-white rounded-lg border border-border p-6">
                  <div className="flex items-center mb-3">
                    <Briefcase className="text-primary-blue mr-2" size={20} />
                    <h3 className="text-lg font-semibold">Asset Owner</h3>
                  </div>
                  <Link href={`/asset-owners/${development.asset_owner.slug}`}>
                    <div className="hover:bg-gray-50 p-3 rounded-lg transition-colors">
                      {development.asset_owner.logo_url && (
                        <img
                          src={development.asset_owner.logo_url}
                          alt={development.asset_owner.name}
                          className="h-12 mb-3 object-contain"
                        />
                      )}
                      <div className="font-semibold text-primary-blue">{development.asset_owner.name}</div>
                      {development.asset_owner.headquarters && (
                        <div className="text-text-secondary text-sm mt-1">{development.asset_owner.headquarters}</div>
                      )}
                    </div>
                  </Link>
                </div>
              )}

              {/* Operator */}
              {development.operator && (
                <div className="bg-white rounded-lg border border-border p-6">
                  <div className="flex items-center mb-3">
                    <User className="text-primary-blue mr-2" size={20} />
                    <h3 className="text-lg font-semibold">Operator</h3>
                  </div>
                  <Link href={`/operators/${development.operator.slug}`}>
                    <div className="hover:bg-gray-50 p-3 rounded-lg transition-colors">
                      {development.operator.logo_url && (
                        <img
                          src={development.operator.logo_url}
                          alt={development.operator.name}
                          className="h-12 mb-3 object-contain"
                        />
                      )}
                      <div className="font-semibold text-primary-blue">{development.operator.name}</div>
                      {development.operator.headquarters && (
                        <div className="text-text-secondary text-sm mt-1">{development.operator.headquarters}</div>
                      )}
                    </div>
                  </Link>
                </div>
              )}

              {/* Contact */}
              {(development.contact_email || development.contact_phone) && (
                <div className="bg-white rounded-lg border border-border p-6">
                  <h3 className="text-lg font-semibold mb-3">Contact</h3>
                  {development.contact_name && (
                    <div className="mb-2">
                      <span className="font-medium">{development.contact_name}</span>
                    </div>
                  )}
                  {development.contact_email && (
                    <div className="mb-2">
                      <a href={`mailto:${development.contact_email}`} className="text-primary-blue hover:underline text-sm">
                        {development.contact_email}
                      </a>
                    </div>
                  )}
                  {development.contact_phone && (
                    <div>
                      <a href={`tel:${development.contact_phone}`} className="text-primary-blue hover:underline text-sm">
                        {development.contact_phone}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
