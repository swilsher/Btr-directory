-- BTR Directory Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Asset Owners table
CREATE TABLE asset_owners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  website TEXT,
  description TEXT,
  headquarters TEXT
);

-- Operators table
CREATE TABLE operators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  website TEXT,
  description TEXT,
  headquarters TEXT,
  specialization TEXT
);

-- Developments table
CREATE TABLE developments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  development_type TEXT NOT NULL CHECK (development_type IN ('Multifamily', 'Single Family')),
  asset_owner_id UUID REFERENCES asset_owners(id),
  operator_id UUID REFERENCES operators(id),

  -- Location
  area TEXT,
  region TEXT,
  postcode TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Basic Info
  number_of_units INTEGER,
  status TEXT,
  completion_date DATE,

  -- Contact
  website_url TEXT,
  image_url TEXT,
  description TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,

  -- Financial
  total_investment DECIMAL(15, 2),
  average_rent DECIMAL(10, 2),

  -- Unit Mix
  studio_units INTEGER,
  one_bed_units INTEGER,
  two_bed_units INTEGER,
  three_bed_plus_units INTEGER,

  -- Facilities
  parking_spaces INTEGER,
  commercial_space_sqft INTEGER,

  -- Accessibility
  pets_allowed BOOLEAN DEFAULT false,
  wheelchair_accessible BOOLEAN DEFAULT false,
  pet_policy_details TEXT,
  accessibility_features TEXT,

  -- Sustainability
  sustainability_rating TEXT,
  sustainability_certifications TEXT[],

  -- Amenities (Boolean flags)
  amenity_gym BOOLEAN DEFAULT false,
  amenity_pool BOOLEAN DEFAULT false,
  amenity_coworking BOOLEAN DEFAULT false,
  amenity_concierge BOOLEAN DEFAULT false,
  amenity_cinema BOOLEAN DEFAULT false,
  amenity_roof_terrace BOOLEAN DEFAULT false,
  amenity_bike_storage BOOLEAN DEFAULT false,
  amenity_pet_facilities BOOLEAN DEFAULT false,
  amenity_ev_charging BOOLEAN DEFAULT false,
  amenity_parcel_room BOOLEAN DEFAULT false,
  amenity_guest_suites BOOLEAN DEFAULT false,
  amenity_playground BOOLEAN DEFAULT false,
  amenities_other TEXT,

  -- Meta
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true
);

-- Suppliers table
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  logo_url TEXT,
  website TEXT,
  description TEXT,
  contact_email TEXT,
  is_featured BOOLEAN DEFAULT false
);

-- Correction Requests table
CREATE TABLE correction_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  development_id UUID REFERENCES developments(id),
  request_type TEXT NOT NULL CHECK (request_type IN ('correction', 'missing_site')),
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected'))
);

-- Supplier Submissions table
CREATE TABLE supplier_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  company_name TEXT NOT NULL,
  category TEXT NOT NULL,
  website TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected'))
);

-- Newsletter Signups table
CREATE TABLE newsletter_signups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  subscribed BOOLEAN DEFAULT true
);

-- Indexes for better query performance
CREATE INDEX idx_developments_type ON developments(development_type);
CREATE INDEX idx_developments_status ON developments(status);
CREATE INDEX idx_developments_area ON developments(area);
CREATE INDEX idx_developments_region ON developments(region);
CREATE INDEX idx_developments_published ON developments(is_published);
CREATE INDEX idx_developments_featured ON developments(is_featured);
CREATE INDEX idx_developments_asset_owner ON developments(asset_owner_id);
CREATE INDEX idx_developments_operator ON developments(operator_id);
CREATE INDEX idx_suppliers_category ON suppliers(category);
CREATE INDEX idx_correction_requests_status ON correction_requests(status);
CREATE INDEX idx_supplier_submissions_status ON supplier_submissions(status);

-- Full text search indexes
CREATE INDEX idx_developments_search ON developments USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || COALESCE(area, '')));
CREATE INDEX idx_operators_search ON operators USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));
CREATE INDEX idx_asset_owners_search ON asset_owners USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));
CREATE INDEX idx_suppliers_search ON suppliers USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Row Level Security (RLS) Policies
ALTER TABLE asset_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE developments ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE correction_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_signups ENABLE ROW LEVEL SECURITY;

-- Allow public read access to published data
CREATE POLICY "Public can view published asset owners" ON asset_owners FOR SELECT USING (true);
CREATE POLICY "Public can view published operators" ON operators FOR SELECT USING (true);
CREATE POLICY "Public can view published developments" ON developments FOR SELECT USING (is_published = true);
CREATE POLICY "Public can view suppliers" ON suppliers FOR SELECT USING (true);

-- Allow public insert for forms
CREATE POLICY "Anyone can submit corrections" ON correction_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can submit suppliers" ON supplier_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can subscribe to newsletter" ON newsletter_signups FOR INSERT WITH CHECK (true);
