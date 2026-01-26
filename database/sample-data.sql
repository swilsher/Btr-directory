-- Sample Data for BTR Directory
-- Run this AFTER schema.sql to populate the database with test data

-- Insert Sample Asset Owners
INSERT INTO asset_owners (name, slug, description, headquarters, website) VALUES
('Greystar', 'greystar', 'One of the largest BTR operators globally with a significant UK presence.', 'London', 'https://www.greystar.com'),
('Legal & General', 'legal-and-general', 'Major UK institutional investor in build-to-rent housing.', 'London', 'https://www.legalandgeneral.com'),
('Residential Secure Income', 'residential-secure-income', 'UK REIT focused on build-to-rent residential property.', 'London', 'https://www.rsipreit.com');

-- Insert Sample Operators
INSERT INTO operators (name, slug, description, headquarters, specialization, website) VALUES
('Greystar Europe', 'greystar-europe', 'Leading multifamily operator managing premium BTR developments.', 'London', 'Multifamily', 'https://www.greystar.com'),
('Essential Living', 'essential-living', 'Specialist BTR operator focused on community-driven developments.', 'London', 'Multifamily', 'https://www.essentialliving.co.uk'),
('Sage Housing', 'sage-housing', 'Professional property management for single family rentals.', 'Manchester', 'Single Family', 'https://www.sagehousing.co.uk');

-- Insert Sample Developments
INSERT INTO developments (
  name, slug, development_type, area, region, postcode,
  number_of_units, status, completion_date, description,
  amenity_gym, amenity_pool, amenity_coworking, amenity_concierge,
  amenity_cinema, amenity_roof_terrace, amenity_bike_storage,
  pets_allowed, wheelchair_accessible,
  is_published, is_featured
) VALUES
(
  'The Forge', 'the-forge', 'Multifamily', 'Greenwich', 'London', 'SE10 0AG',
  250, 'Complete - Operational', '2021-06-01',
  'Premium waterside development with stunning views of the Thames and Canary Wharf.',
  true, true, true, true, true, true, true,
  true, true,
  true, true
),
(
  'Angel Gardens', 'angel-gardens', 'Multifamily', 'Manchester', 'North West', 'M4 4BF',
  186, 'Complete - Operational', '2020-11-01',
  'Landmark development in Manchester city centre with exceptional amenities.',
  true, false, true, true, false, true, true,
  false, true,
  true, true
),
(
  'Meridian Quay', 'meridian-quay', 'Multifamily', 'Swansea', 'Wales', 'SA1 2FA',
  107, 'Complete - Operational', '2019-03-01',
  'Modern waterfront living in the heart of Swanseas Maritime Quarter.',
  true, false, false, false, false, true, true,
  true, true,
  true, false
);

-- Link developments to asset owners and operators
-- Get IDs first, then update
DO $$
DECLARE
  greystar_owner_id UUID;
  greystar_operator_id UUID;
  essential_operator_id UUID;
BEGIN
  SELECT id INTO greystar_owner_id FROM asset_owners WHERE slug = 'greystar';
  SELECT id INTO greystar_operator_id FROM operators WHERE slug = 'greystar-europe';
  SELECT id INTO essential_operator_id FROM operators WHERE slug = 'essential-living';

  UPDATE developments SET asset_owner_id = greystar_owner_id, operator_id = greystar_operator_id WHERE slug = 'the-forge';
  UPDATE developments SET operator_id = essential_operator_id WHERE slug = 'angel-gardens';
  UPDATE developments SET operator_id = greystar_operator_id WHERE slug = 'meridian-quay';
END $$;

-- Insert Sample Suppliers
INSERT INTO suppliers (name, slug, category, description, website, is_featured) VALUES
('Smart Spaces', 'smart-spaces', 'Proptech', 'Leading provider of smart home technology for BTR developments.', 'https://www.smartspaces.io', true),
('BTR Furniture Solutions', 'btr-furniture-solutions', 'Furniture', 'Complete furniture packages for build-to-rent properties.', 'https://www.btrfurniture.co.uk', true),
('GymFit Pro', 'gymfit-pro', 'Gym Equipment', 'Professional gym equipment and installation for residential developments.', 'https://www.gymfitpro.com', false),
('SecureHome', 'securehome', 'Security', 'Advanced security systems for BTR properties.', 'https://www.securehome.co.uk', false),
('EcoEnergy BTR', 'ecoenergy-btr', 'Energy Solutions', 'Sustainable energy solutions for residential properties.', 'https://www.ecoenergybtr.com', false);

-- Insert Sample Newsletter Signups (optional)
INSERT INTO newsletter_signups (email, name, subscribed) VALUES
('test@example.com', 'Test User', true);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Sample data inserted successfully!';
  RAISE NOTICE 'Asset Owners: 3';
  RAISE NOTICE 'Operators: 3';
  RAISE NOTICE 'Developments: 3';
  RAISE NOTICE 'Suppliers: 5';
END $$;
