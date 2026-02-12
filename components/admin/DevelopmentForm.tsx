'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Development, Operator, AssetOwner } from '@/types/database';
import { generateSlug } from '@/lib/utils';
import { Autocomplete } from '@/components/ui/Autocomplete';
import { Loader2, Upload, X, Star, Trash2, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const STATUS_OPTIONS = [
  'In Planning',
  'Under Construction',
  'Operational',
];

const SUB_CATEGORY_OPTIONS = [
  'Co-Living',
];

const REGION_OPTIONS = [
  'London', 'South East', 'South West', 'East of England',
  'East Midlands', 'West Midlands', 'North West', 'North East',
  'Yorkshire and The Humber', 'Scotland', 'Wales',
];

interface DevelopmentImage {
  id: string;
  url: string;
  path: string;
  is_primary: boolean;
}

interface DevelopmentFormProps {
  development?: Development;
  isEdit?: boolean;
}

interface FormData {
  name: string;
  slug: string;
  development_type: 'Multifamily' | 'Single Family';
  operator_id: string | null;
  asset_owner_id: string | null;
  area: string;
  region: string;
  postcode: string;
  latitude: string;
  longitude: string;
  status: string;
  sub_category: string[];
  number_of_units: string;
  completion_date: string;
  description: string;
  website_url: string;
  image_url: string;
}

export default function DevelopmentForm({ development, isEdit = false }: DevelopmentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [assetOwners, setAssetOwners] = useState<AssetOwner[]>([]);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Image upload state
  const [images, setImages] = useState<DevelopmentImage[]>([]);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    slug: '',
    development_type: 'Multifamily',
    operator_id: null,
    asset_owner_id: null,
    area: '',
    region: '',
    postcode: '',
    latitude: '',
    longitude: '',
    status: '',
    sub_category: [],
    number_of_units: '',
    completion_date: '',
    description: '',
    website_url: '',
    image_url: '',
  });

  // Populate form if editing
  useEffect(() => {
    if (development && isEdit) {
      setFormData({
        name: development.name || '',
        slug: development.slug || '',
        development_type: development.development_type || 'Multifamily',
        operator_id: development.operator_id || null,
        asset_owner_id: development.asset_owner_id || null,
        area: development.area || '',
        region: development.region || '',
        postcode: development.postcode || '',
        latitude: development.latitude?.toString() || '',
        longitude: development.longitude?.toString() || '',
        status: development.status || '',
        sub_category: development.sub_category || [],
        number_of_units: development.number_of_units?.toString() || '',
        completion_date: development.completion_date || '',
        description: development.description || '',
        website_url: development.website_url || '',
        image_url: development.image_url || '',
      });
      setSlugManuallyEdited(true);

      // Load existing images from storage
      if (development.id) {
        loadExistingImages(development.id);
      }
    }
  }, [development, isEdit]);

  useEffect(() => {
    fetchOperators();
    fetchAssetOwners();
  }, []);

  const fetchOperators = async () => {
    const { data } = await supabase
      .from('operators')
      .select('*')
      .order('name');
    if (data) setOperators(data);
  };

  const fetchAssetOwners = async () => {
    const { data } = await supabase
      .from('asset_owners')
      .select('*')
      .order('name');
    if (data) setAssetOwners(data);
  };

  const loadExistingImages = async (developmentId: string) => {
    try {
      const { data: files, error } = await supabase.storage
        .from('development-images')
        .list(developmentId);

      if (error || !files) return;

      const loadedImages: DevelopmentImage[] = files
        .filter(f => f.name !== '.emptyFolderPlaceholder')
        .map(f => {
          const { data: urlData } = supabase.storage
            .from('development-images')
            .getPublicUrl(`${developmentId}/${f.name}`);

          return {
            id: f.id || f.name,
            url: urlData.publicUrl,
            path: `${developmentId}/${f.name}`,
            is_primary: false,
          };
        });

      // Mark the first image matching image_url as primary
      if (development?.image_url) {
        const primaryIdx = loadedImages.findIndex(img => img.url === development.image_url);
        if (primaryIdx >= 0) {
          loadedImages[primaryIdx].is_primary = true;
        } else if (loadedImages.length > 0) {
          loadedImages[0].is_primary = true;
        }
      } else if (loadedImages.length > 0) {
        loadedImages[0].is_primary = true;
      }

      setImages(loadedImages);
    } catch (err) {
      console.error('Error loading images:', err);
    }
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: slugManuallyEdited ? prev.slug : generateSlug(name),
    }));
  };

  const handleSlugChange = (slug: string) => {
    setSlugManuallyEdited(true);
    setFormData(prev => ({ ...prev, slug: generateSlug(slug) }));
  };

  const updateField = (field: keyof FormData, value: string | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Image upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    // Use a temporary folder name for new developments, actual ID for existing
    const folderId = development?.id || `temp-${Date.now()}`;

    try {
      const newImages: DevelopmentImage[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${i}.${fileExt}`;
        const filePath = `${folderId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('development-images')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('development-images')
          .getPublicUrl(filePath);

        newImages.push({
          id: fileName,
          url: urlData.publicUrl,
          path: filePath,
          is_primary: images.length === 0 && i === 0,
        });
      }

      setImages(prev => {
        const updated = [...prev, ...newImages];
        // If no primary set yet, set the first one
        if (!updated.some(img => img.is_primary) && updated.length > 0) {
          updated[0].is_primary = true;
        }
        return updated;
      });

      // Update the primary image URL in the form
      if (images.length === 0 && newImages.length > 0) {
        updateField('image_url', newImages[0].url);
      }
    } catch (err) {
      console.error('Error uploading images:', err);
      alert('Failed to upload some images');
    } finally {
      setUploading(false);
      // Reset the file input
      e.target.value = '';
    }
  };

  const handleSetPrimary = (imageId: string) => {
    setImages(prev => {
      const updated = prev.map(img => ({
        ...img,
        is_primary: img.id === imageId,
      }));
      const primary = updated.find(img => img.is_primary);
      if (primary) {
        updateField('image_url', primary.url);
      }
      return updated;
    });
  };

  const handleDeleteImage = async (image: DevelopmentImage) => {
    try {
      const { error } = await supabase.storage
        .from('development-images')
        .remove([image.path]);

      if (error) {
        console.error('Error deleting image:', error);
        alert('Failed to delete image');
        return;
      }

      setImages(prev => {
        const updated = prev.filter(img => img.id !== image.id);
        // If deleted image was primary, set new primary
        if (image.is_primary && updated.length > 0) {
          updated[0].is_primary = true;
          updateField('image_url', updated[0].url);
        } else if (updated.length === 0) {
          updateField('image_url', '');
        }
        return updated;
      });
    } catch (err) {
      console.error('Error deleting image:', err);
    }
  };

  // Create new operator inline
  const handleOperatorChange = async (id: string | null, name: string | null) => {
    if (id) {
      updateField('operator_id', id);
    } else if (name) {
      // New operator - create it first
      try {
        const slug = generateSlug(name);
        const { data, error } = await supabase
          .from('operators')
          .insert({ name: name.trim(), slug })
          .select()
          .single();

        if (error) {
          console.error('Error creating operator:', error);
          alert('Failed to create new operator. Check RLS policies allow INSERT on operators table.');
          return;
        }

        setOperators(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
        setFormData(prev => ({ ...prev, operator_id: data.id }));
      } catch (error) {
        console.error('Error:', error);
        alert('Failed to create new operator');
      }
    } else {
      updateField('operator_id', null);
    }
  };

  // Create new asset owner inline
  const handleAssetOwnerChange = async (id: string | null, name: string | null) => {
    if (id) {
      updateField('asset_owner_id', id);
    } else if (name) {
      // New asset owner - create it first
      try {
        const slug = generateSlug(name);
        const { data, error } = await supabase
          .from('asset_owners')
          .insert({ name: name.trim(), slug })
          .select()
          .single();

        if (error) {
          console.error('Error creating asset owner:', error);
          alert('Failed to create new asset owner. Check RLS policies allow INSERT on asset_owners table.');
          return;
        }

        setAssetOwners(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
        setFormData(prev => ({ ...prev, asset_owner_id: data.id }));
      } catch (error) {
        console.error('Error:', error);
        alert('Failed to create new asset owner');
      }
    } else {
      updateField('asset_owner_id', null);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      alert('Name is required');
      return;
    }
    if (!formData.slug.trim()) {
      alert('Slug is required');
      return;
    }
    if (!formData.status) {
      alert('Status is required');
      return;
    }

    setLoading(true);
    try {
      const devData: Record<string, unknown> = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        development_type: formData.development_type,
        operator_id: formData.operator_id || null,
        asset_owner_id: formData.asset_owner_id || null,
        area: formData.area.trim() || null,
        region: formData.region || null,
        postcode: formData.postcode.trim() || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        status: formData.status || null,
        sub_category: formData.sub_category.length > 0 ? formData.sub_category : null,
        number_of_units: formData.number_of_units ? parseInt(formData.number_of_units) : null,
        completion_date: formData.completion_date || null,
        description: formData.description.trim() || null,
        website_url: formData.website_url.trim() || null,
        image_url: formData.image_url || null,
        updated_at: new Date().toISOString(),
        verified: true,
        verified_at: new Date().toISOString(),
      };

      if (isEdit && development) {
        const { error } = await supabase
          .from('developments')
          .update(devData)
          .eq('id', development.id);

        if (error) throw error;

        // Move temp images to proper folder if needed
        // (images uploaded during edit are already in the right folder)
      } else {
        const { data: newDev, error } = await supabase
          .from('developments')
          .insert(devData)
          .select()
          .single();

        if (error) throw error;

        // If images were uploaded to a temp folder, move them
        // For simplicity, if we have images that were uploaded with temp prefix,
        // we need to re-upload them to the proper folder
        if (newDev && images.length > 0) {
          const tempImages = images.filter(img => img.path.startsWith('temp-'));
          if (tempImages.length > 0) {
            let primaryUrl = '';
            for (const img of tempImages) {
              // Download the file from temp location
              const { data: fileData } = await supabase.storage
                .from('development-images')
                .download(img.path);

              if (fileData) {
                const fileName = img.path.split('/').pop()!;
                const newPath = `${newDev.id}/${fileName}`;

                await supabase.storage
                  .from('development-images')
                  .upload(newPath, fileData);

                // Delete temp file
                await supabase.storage
                  .from('development-images')
                  .remove([img.path]);

                if (img.is_primary) {
                  const { data: urlData } = supabase.storage
                    .from('development-images')
                    .getPublicUrl(newPath);
                  primaryUrl = urlData.publicUrl;
                }
              }
            }

            // Update the development with the correct primary image URL
            if (primaryUrl) {
              await supabase
                .from('developments')
                .update({ image_url: primaryUrl })
                .eq('id', newDev.id);
            }
          }
        }
      }

      router.push('/admin/developments');
    } catch (error: unknown) {
      console.error('Error saving development:', error);
      const err = error as { code?: string; message?: string };
      if (err.code === '23505') {
        alert('A development with this slug already exists. Please use a different slug.');
      } else {
        alert('Failed to save development: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/developments"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </Link>
              <h1 className="text-xl font-semibold">
                {isEdit ? `Edit: ${development?.name || 'Development'}` : 'Add New Development'}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-lg font-medium hover:bg-primary-blue-hover transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {isEdit ? 'Save Changes' : 'Create Development'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Main Content - Left 2 columns */}
          <div className="col-span-2 space-y-6">
            {/* Name & Slug */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Development Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Enter development name..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
              />

              <label className="block text-sm font-medium text-gray-700 mb-2 mt-4">
                URL Slug *
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">/development/</span>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="url-slug"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
                />
              </div>
            </div>

            {/* Location */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-800 mb-4 uppercase tracking-wider">Location</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City / Area</label>
                  <input
                    type="text"
                    value={formData.area}
                    onChange={(e) => updateField('area', e.target.value)}
                    placeholder="e.g. Manchester"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                  <select
                    value={formData.region}
                    onChange={(e) => updateField('region', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
                  >
                    <option value="">Select region...</option>
                    {REGION_OPTIONS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
                  <input
                    type="text"
                    value={formData.postcode}
                    onChange={(e) => updateField('postcode', e.target.value)}
                    placeholder="e.g. M1 5QP"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => updateField('latitude', e.target.value)}
                      placeholder="53.483"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => updateField('longitude', e.target.value)}
                      placeholder="-2.244"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-800 mb-4 uppercase tracking-wider">Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => updateField('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
                  >
                    <option value="">Select status...</option>
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Units</label>
                  <input
                    type="number"
                    value={formData.number_of_units}
                    onChange={(e) => updateField('number_of_units', e.target.value)}
                    placeholder="e.g. 250"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Development Type</label>
                  <select
                    value={formData.development_type}
                    onChange={(e) => updateField('development_type', e.target.value as 'Multifamily' | 'Single Family')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
                  >
                    <option value="Multifamily">Multifamily</option>
                    <option value="Single Family">Single Family</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Completion Date</label>
                  <input
                    type="date"
                    value={formData.completion_date}
                    onChange={(e) => updateField('completion_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
                  />
                </div>
              </div>

              {/* Sub-Category (Multifamily only) */}
              {formData.development_type === 'Multifamily' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sub-Category</label>
                  <div className="flex flex-wrap gap-3">
                    {SUB_CATEGORY_OPTIONS.map(option => (
                      <label key={option} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.sub_category.includes(option)}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              sub_category: e.target.checked
                                ? [...prev.sub_category, option]
                                : prev.sub_category.filter(s => s !== option),
                            }));
                          }}
                          className="rounded border-gray-300 text-primary-blue focus:ring-primary-blue"
                        />
                        <span className="text-sm text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                <input
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => updateField('website_url', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
                />
              </div>
            </div>

            {/* Description */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Enter development description..."
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
              />
            </div>

            {/* Images */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-800 mb-4 uppercase tracking-wider">Images</h3>

              {/* Upload area */}
              <div className="mb-4">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-blue hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {uploading ? (
                      <Loader2 size={24} className="animate-spin text-primary-blue mb-2" />
                    ) : (
                      <Upload size={24} className="text-gray-400 mb-2" />
                    )}
                    <p className="text-sm text-gray-600">
                      {uploading ? 'Uploading...' : 'Click to upload images'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG, WebP up to 5MB each</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
              </div>

              {/* Image thumbnails */}
              {images.length > 0 && (
                <div className="grid grid-cols-4 gap-3">
                  {images.map((image) => (
                    <div
                      key={image.id}
                      className={`relative group rounded-lg overflow-hidden border-2 ${
                        image.is_primary ? 'border-primary-blue' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={image.url}
                        alt=""
                        className="w-full h-24 object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23f3f4f6" width="100" height="100"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="12">Error</text></svg>';
                        }}
                      />

                      {image.is_primary && (
                        <div className="absolute top-1 left-1 bg-primary-blue text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Star size={10} className="fill-current" /> Primary
                        </div>
                      )}

                      {/* Overlay actions */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        {!image.is_primary && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimary(image.id)}
                            className="p-1.5 bg-white rounded-lg text-primary-blue hover:bg-gray-100"
                            title="Set as primary"
                          >
                            <Star size={14} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(image)}
                          className="p-1.5 bg-white rounded-lg text-red-600 hover:bg-gray-100"
                          title="Delete image"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Manual URL fallback */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Or enter image URL directly
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => updateField('image_url', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
                />
                {formData.image_url && images.length === 0 && (
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="mt-2 w-full h-32 object-cover rounded-lg"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Right column */}
          <div className="space-y-6">
            {/* Operator */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Operator
              </label>
              <Autocomplete
                options={operators.map(o => ({ id: o.id, name: o.name }))}
                value={formData.operator_id}
                onChange={handleOperatorChange}
                placeholder="Select or add operator..."
                allowCustom={true}
              />
            </div>

            {/* Asset Owner */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Asset Owner
              </label>
              <Autocomplete
                options={assetOwners.map(a => ({ id: a.id, name: a.name }))}
                value={formData.asset_owner_id}
                onChange={handleAssetOwnerChange}
                placeholder="Select or add asset owner..."
                allowCustom={true}
              />
            </div>

            {/* Quick Actions - Edit mode only */}
            {isEdit && development && (
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Quick Info
                </label>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-600">
                    <span className="font-medium">Created:</span>{' '}
                    {development.created_at ? new Date(development.created_at).toLocaleDateString('en-GB') : 'N/A'}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Updated:</span>{' '}
                    {development.updated_at ? new Date(development.updated_at).toLocaleDateString('en-GB') : 'N/A'}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Verified:</span>{' '}
                    {development.verified ? 'Yes' : 'No'}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Published:</span>{' '}
                    {development.is_published ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
            )}

            {/* Save button (duplicate for convenience) */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-blue text-white rounded-lg font-semibold hover:bg-primary-blue-hover transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {isEdit ? 'Save Changes' : 'Create Development'}
              </button>
              <Link
                href="/admin/developments"
                className="block text-center mt-3 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancel
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
