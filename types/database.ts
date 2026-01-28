export interface Development {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  slug: string;
  development_type: 'Multifamily' | 'Single Family';
  asset_owner_id?: string;
  operator_id?: string;
  area?: string;
  region?: string;
  postcode?: string;
  latitude?: number;
  longitude?: number;
  number_of_units?: number;
  status?: string;
  completion_date?: string;
  website_url?: string;
  image_url?: string;
  description?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  total_investment?: number;
  average_rent?: number;
  studio_units?: number;
  one_bed_units?: number;
  two_bed_units?: number;
  three_bed_plus_units?: number;
  parking_spaces?: number;
  commercial_space_sqft?: number;
  pets_allowed?: boolean;
  wheelchair_accessible?: boolean;
  pet_policy_details?: string;
  accessibility_features?: string;
  sustainability_rating?: string;
  sustainability_certifications?: string[];
  amenity_gym?: boolean;
  amenity_pool?: boolean;
  amenity_coworking?: boolean;
  amenity_concierge?: boolean;
  amenity_cinema?: boolean;
  amenity_roof_terrace?: boolean;
  amenity_bike_storage?: boolean;
  amenity_pet_facilities?: boolean;
  amenity_ev_charging?: boolean;
  amenity_parcel_room?: boolean;
  amenity_guest_suites?: boolean;
  amenity_playground?: boolean;
  amenities_other?: string;
  is_featured?: boolean;
  is_published?: boolean;
  verified?: boolean;
  verified_at?: string;
  verification_notes?: string;
  flagged_for_review?: boolean;
  asset_owner?: AssetOwner;
  operator?: Operator;
}

export interface AssetOwner {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  website?: string;
  description?: string;
  headquarters?: string;
}

export interface Operator {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  website?: string;
  description?: string;
  headquarters?: string;
  specialization?: string;
}

export interface Supplier {
  id: string;
  name: string;
  slug: string;
  category: string;
  logo_url?: string;
  website?: string;
  description?: string;
  contact_email?: string;
  is_featured?: boolean;
}

export interface CorrectionRequest {
  id: string;
  created_at: string;
  development_id?: string;
  request_type: 'correction' | 'missing_site';
  user_name: string;
  user_email: string;
  message: string;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
}

export interface SupplierSubmission {
  id: string;
  created_at: string;
  company_name: string;
  category: string;
  website: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  description: string;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
}

export interface NewsletterSignup {
  id: string;
  created_at: string;
  email: string;
  name?: string;
  subscribed: boolean;
}

export type DevelopmentStatus = 
  | 'Proposed' 
  | 'Under Construction' 
  | 'Stabilised' 
  | 'Completed'
  | 'Complete - Operational'
  | 'Pending completion - Construction'
  | 'Pending completion - Planning'
  | 'Lease-up';

export type FriendlyStatus = 
  | 'Pre-Planning'
  | 'In Planning'
  | 'Under Construction'
  | 'Operational';

export type SupplierCategory = 
  | 'Furniture'
  | 'Gym Equipment'
  | 'Proptech'
  | 'Security'
  | 'Energy Solutions'
  | 'Broadband Providers'
  | 'Locker and Storage Solutions'
  | 'Water and Flooding Solutions'
  | 'Smart Home'
  | 'Other';
