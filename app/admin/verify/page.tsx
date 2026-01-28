'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Development, Operator, AssetOwner } from '@/types/database';
import { CheckCircle, Save, SkipForward, Flag, ChevronLeft, ExternalLink, Loader2 } from 'lucide-react';
import { Autocomplete } from '@/components/ui/Autocomplete';

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'btr2025admin';

const UK_REGIONS = [
  'London',
  'South East',
  'South West',
  'West Midlands',
  'North West',
  'North East',
  'Yorkshire and the Humber',
  'East Midlands',
  'East of England',
  'Scotland',
  'Wales',
];

const STATUS_OPTIONS = [
  'Proposed',
  'Under Construction',
  'Stabilised',
  'Completed',
  'Complete - Operational',
  'Pending completion - Construction',
  'Pending completion - Planning',
  'Lease-up',
];

// Generate last 12 months of options
function generateMonthOptions(): Array<{ value: string; label: string }> {
  const months: Array<{ value: string; label: string }> = [];

  for (let i = 0; i < 12; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);

    // Value format: 'YYYY-MM' (e.g., '2025-01')
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const value = `${year}-${month}`;

    // Label format: 'Verified January 2025'
    const monthName = date.toLocaleDateString('en-GB', { month: 'long' });
    const label = `Verified ${monthName} ${year}`;

    months.push({ value, label });
  }

  return months;
}

export default function AdminVerifyPage() {
  // Debug: Component initialization
  console.log('=== ADMIN VERIFY PAGE LOADED ===');
  console.log('Supabase client:', supabase);
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('Has anon key:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [developments, setDevelopments] = useState<Development[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | null>(null);
  const [editedData, setEditedData] = useState<Partial<Development>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Filters
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'unverified'>('unverified');
  const [monthFilter, setMonthFilter] = useState<string>(''); // Format: 'YYYY-MM' or empty
  const [regionFilter, setRegionFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Stats
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Autocomplete data
  const [operators, setOperators] = useState<Array<{ id: string; name: string }>>([]);
  const [assetOwners, setAssetOwners] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    const auth = sessionStorage.getItem('admin_authenticated');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDevelopments();
      fetchStats();
      fetchOperators();
      fetchAssetOwners();
    }
  }, [isAuthenticated, verificationFilter, monthFilter, regionFilter, typeFilter, searchQuery]);

  // Autosave every 5 seconds if there are unsaved changes
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const timer = setTimeout(() => {
      handleSaveChanges(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [editedData, hasUnsavedChanges]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        handleVerifyAndNext();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleSkipToNext();
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        handlePrevious();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, developments, editedData]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_authenticated', 'true');
    } else {
      alert('Incorrect password');
    }
  };

  const fetchStats = async () => {
    const { count: verified } = await supabase
      .from('developments')
      .select('id', { count: 'exact', head: true })
      .eq('verified', true);

    const { count: total } = await supabase
      .from('developments')
      .select('id', { count: 'exact', head: true });

    setVerifiedCount(verified || 0);
    setTotalCount(total || 0);
  };

  const fetchOperators = async () => {
    const { data, error } = await supabase
      .from('operators')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching operators:', error);
      return;
    }

    setOperators(data || []);
  };

  const fetchAssetOwners = async () => {
    const { data, error } = await supabase
      .from('asset_owners')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching asset owners:', error);
      return;
    }

    setAssetOwners(data || []);
  };

  const fetchDevelopments = async () => {
    console.log('=== FETCHING DEVELOPMENTS ===');
    setLoading(true);
    try {
      let query = supabase
        .from('developments')
        .select('*, operator:operators(id, name), asset_owner:asset_owners(id, name)')
        .eq('is_published', true);

      // Apply filters
      if (verificationFilter === 'unverified') {
        // Show only unverified
        query = query.eq('verified', false);
      } else if (verificationFilter === 'verified' && !monthFilter) {
        // Show all verified (no specific month)
        query = query.eq('verified', true);
      }
      // If verificationFilter is 'all' and no monthFilter, apply no verification filter

      if (regionFilter) {
        query = query.eq('region', regionFilter);
      }

      if (typeFilter) {
        query = query.eq('development_type', typeFilter);
      }

      // Apply month filter if selected
      if (monthFilter) {
        // Parse YYYY-MM format
        const [year, month] = monthFilter.split('-');
        const yearInt = parseInt(year);
        const monthInt = parseInt(month);

        // Calculate month start: YYYY-MM-01T00:00:00Z
        const monthStart = `${year}-${month}-01T00:00:00Z`;

        // Calculate month end: YYYY-MM-[lastDay]T23:59:59Z
        const lastDay = new Date(yearInt, monthInt, 0).getDate(); // Day 0 of next month = last day of current month
        const monthEnd = `${year}-${month}-${String(lastDay).padStart(2, '0')}T23:59:59Z`;

        // Filter by date range
        query = query.gte('verified_at', monthStart).lte('verified_at', monthEnd);

        // Also ensure verified = true when filtering by month
        query = query.eq('verified', true);
      }

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      // Order by unverified first, then by creation date
      query = query.order('verified', { ascending: true }).order('created_at', { ascending: false });

      const { data, error } = await query;

      console.log('Fetch results:', {
        error,
        count: data?.length,
        firstDevelopment: data?.[0]
      });

      if (error) throw error;
      setDevelopments(data || []);
      setCurrentIndex(0);
      setEditedData({});
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error fetching developments:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentDevelopment = developments[currentIndex];

  const handleFieldChange = (field: string, value: any) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
    setSaveStatus('unsaved');
  };

  const handleOperatorChange = async (operatorId: string | null, operatorName: string | null) => {
    if (operatorId) {
      // Existing operator selected
      handleFieldChange('operator_id', operatorId);
    } else if (operatorName) {
      // New operator - create it first
      try {
        const slug = operatorName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

        const { data, error } = await supabase
          .from('operators')
          .insert({ name: operatorName.trim(), slug })
          .select('id')
          .single();

        if (error) {
          console.error('Error creating operator:', error);
          alert('Failed to create new operator');
          return;
        }

        // Update with new operator ID
        handleFieldChange('operator_id', data.id);

        // Refresh operators list
        fetchOperators();
      } catch (error) {
        console.error('Error:', error);
        alert('Failed to create new operator');
      }
    } else {
      // Cleared
      handleFieldChange('operator_id', null);
    }
  };

  const handleAssetOwnerChange = async (ownerId: string | null, ownerName: string | null) => {
    if (ownerId) {
      // Existing asset owner selected
      handleFieldChange('asset_owner_id', ownerId);
    } else if (ownerName) {
      // New asset owner - create it first
      try {
        const slug = ownerName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

        const { data, error } = await supabase
          .from('asset_owners')
          .insert({ name: ownerName.trim(), slug })
          .select('id')
          .single();

        if (error) {
          console.error('Error creating asset owner:', error);
          alert('Failed to create new asset owner');
          return;
        }

        // Update with new asset owner ID
        handleFieldChange('asset_owner_id', data.id);

        // Refresh asset owners list
        fetchAssetOwners();
      } catch (error) {
        console.error('Error:', error);
        alert('Failed to create new asset owner');
      }
    } else {
      // Cleared
      handleFieldChange('asset_owner_id', null);
    }
  };

  const handleSaveChanges = async (showStatus = true) => {
    if (!currentDevelopment || Object.keys(editedData).length === 0) return;

    setSaving(true);
    if (showStatus) setSaveStatus('saving');

    try {
      const { error } = await supabase
        .from('developments')
        .update(editedData)
        .eq('id', currentDevelopment.id);

      if (error) throw error;

      // Update local state
      setDevelopments(prev => prev.map(dev =>
        dev.id === currentDevelopment.id ? { ...dev, ...editedData } : dev
      ));

      setEditedData({});
      setHasUnsavedChanges(false);
      if (showStatus) setSaveStatus('saved');

      setTimeout(() => {
        if (showStatus) setSaveStatus(null);
      }, 2000);
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyAndNext = async () => {
    console.log('=== VERIFY BUTTON CLICKED ===');
    console.log('Current development:', currentDevelopment);
    console.log('Current index:', currentIndex);
    console.log('Edited data:', editedData);

    if (!currentDevelopment) {
      console.error('ERROR: No current development, exiting early');
      return;
    }

    console.log('Setting saving state to true...');
    setSaving(true);

    try {
      const updates = {
        ...editedData,
        verified: true,
        verified_at: new Date().toISOString(),
      };

      console.log('Updates to be saved:', updates);
      console.log('Development ID:', currentDevelopment.id);
      console.log('About to call Supabase update...');

      const { data, error } = await supabase
        .from('developments')
        .update(updates)
        .eq('id', currentDevelopment.id);

      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Update successful, updating stats...');
      // Update stats
      setVerifiedCount(prev => prev + 1);

      console.log('Moving to next development...');
      // Move to next
      if (currentIndex < developments.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        console.log('At end of list, refreshing developments...');
        // Refresh list if at the end
        await fetchDevelopments();
      }

      setEditedData({});
      setHasUnsavedChanges(false);
      setSaveStatus(null);
      console.log('=== VERIFY COMPLETED SUCCESSFULLY ===');
    } catch (error) {
      console.error('=== ERROR IN VERIFY FUNCTION ===');
      console.error('Error details:', error);
      console.error('Error type:', typeof error);
      console.error('Error message:', (error as any)?.message);
      alert('Failed to verify development');
    } finally {
      console.log('Setting saving state to false...');
      setSaving(false);
    }
  };

  const handleSkipToNext = () => {
    if (hasUnsavedChanges) {
      if (!confirm('You have unsaved changes. Skip anyway?')) return;
    }

    if (currentIndex < developments.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setEditedData({});
      setHasUnsavedChanges(false);
      setSaveStatus(null);
    }
  };

  const handlePrevious = () => {
    if (hasUnsavedChanges) {
      if (!confirm('You have unsaved changes. Go back anyway?')) return;
    }

    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setEditedData({});
      setHasUnsavedChanges(false);
      setSaveStatus(null);
    }
  };

  const handleFlagForReview = async () => {
    if (!currentDevelopment) return;

    const notes = prompt('Enter review notes (optional):');

    setSaving(true);
    try {
      const { error } = await supabase
        .from('developments')
        .update({
          flagged_for_review: true,
          verification_notes: notes || '',
        })
        .eq('id', currentDevelopment.id);

      if (error) throw error;

      alert('Development flagged for review');
      handleSkipToNext();
    } catch (error) {
      console.error('Error flagging development:', error);
      alert('Failed to flag development');
    } finally {
      setSaving(false);
    }
  };

  const getFieldValue = (field: keyof Development): any => {
    return editedData[field] !== undefined ? editedData[field] : currentDevelopment?.[field];
  };

  const formatVerificationAge = (timestamp: string | null | undefined) => {
    if (!timestamp) return 'Never verified';

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Verified today';
    if (diffDays === 1) return 'Verified yesterday';
    if (diffDays < 30) return `Verified ${diffDays} days ago`;

    return `Verified ${date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-semibold mb-6 text-center">Admin Login</h1>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
              autoFocus
            />
            <button
              type="submit"
              className="w-full bg-primary-blue text-white py-3 rounded-lg font-semibold hover:bg-primary-blue-hover transition-colors"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary-blue" size={48} />
      </div>
    );
  }

  const verificationPercentage = totalCount > 0 ? ((verifiedCount / totalCount) * 100).toFixed(1) : '0.0';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold">Development Verification</h1>
            <div className="flex items-center gap-4">
              {saveStatus && (
                <span className={`text-sm ${saveStatus === 'saved' ? 'text-green-600' : saveStatus === 'saving' ? 'text-blue-600' : 'text-orange-600'}`}>
                  {saveStatus === 'saved' && '✓ Saved'}
                  {saveStatus === 'saving' && 'Saving...'}
                  {saveStatus === 'unsaved' && '• Unsaved changes'}
                </span>
              )}
              <button
                onClick={() => {
                  sessionStorage.removeItem('admin_authenticated');
                  setIsAuthenticated(false);
                }}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium">{verifiedCount} of {totalCount} developments verified ({verificationPercentage}%)</span>
              <span className="text-gray-600">Development {currentIndex + 1} of {developments.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-blue h-2 rounded-full transition-all duration-300"
                style={{ width: `${verificationPercentage}%` }}
              />
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-6 gap-3">
            <select
              value={verificationFilter}
              onChange={(e) => {
                setVerificationFilter(e.target.value as any);
                // Clear month filter when changing verification filter
                if (e.target.value !== 'verified') {
                  setMonthFilter('');
                }
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
            >
              <option value="all">All</option>
              <option value="unverified">Unverified</option>
              <option value="verified">Verified (All Months)</option>
            </select>

            {/* Month filter dropdown */}
            <select
              value={monthFilter}
              onChange={(e) => {
                setMonthFilter(e.target.value);
                // If selecting a month, automatically switch to 'verified' filter
                if (e.target.value && verificationFilter !== 'verified') {
                  setVerificationFilter('verified');
                }
              }}
              disabled={verificationFilter === 'unverified'} // Disable when viewing unverified
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-blue focus:border-primary-blue disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">All Months</option>
              {generateMonthOptions().map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
            >
              <option value="">All Regions</option>
              {UK_REGIONS.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
            >
              <option value="">All Types</option>
              <option value="Multifamily">Multifamily</option>
              <option value="Single Family">Single Family</option>
            </select>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name..."
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-blue focus:border-primary-blue col-span-2"
            />
          </div>

          {/* Keyboard shortcuts hint */}
          <div className="mt-3 text-xs text-gray-500">
            Shortcuts: <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">V</kbd> Verify
            <kbd className="ml-2 px-1.5 py-0.5 bg-gray-100 rounded">S</kbd> Skip
            <kbd className="ml-2 px-1.5 py-0.5 bg-gray-100 rounded">P</kbd> Previous
          </div>
        </div>
      </div>

      {/* Main Content */}
      {!currentDevelopment ? (
        <div className="max-w-[1800px] mx-auto px-6 py-20 text-center">
          <p className="text-gray-600 text-lg">No developments found matching your filters.</p>
        </div>
      ) : (
        <div className="max-w-[1800px] mx-auto px-6 py-6">
          <div className="grid grid-cols-2 gap-6">
            {/* LEFT: Development Data */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="text-xs text-gray-500 font-medium">Development Name</label>
                  <input
                    type="text"
                    value={getFieldValue('name')}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="text-xs text-gray-500 font-medium">Development Type</label>
                  <select
                    value={getFieldValue('development_type')}
                    onChange={(e) => handleFieldChange('development_type', e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
                  >
                    <option value="Multifamily">Multifamily</option>
                    <option value="Single Family">Single Family</option>
                  </select>
                </div>

                {/* Operator */}
                <div>
                  <Autocomplete
                    label="Operator"
                    options={operators}
                    value={getFieldValue('operator_id')}
                    onChange={handleOperatorChange}
                    placeholder="Select or add operator..."
                    allowCustom={true}
                  />
                </div>

                {/* Asset Owner */}
                <div>
                  <Autocomplete
                    label="Asset Owner"
                    options={assetOwners}
                    value={getFieldValue('asset_owner_id')}
                    onChange={handleAssetOwnerChange}
                    placeholder="Select or add asset owner..."
                    allowCustom={true}
                  />
                </div>

                {/* Units */}
                <div>
                  <label className="text-xs text-gray-500 font-medium">Number of Units</label>
                  <input
                    type="number"
                    value={getFieldValue('number_of_units') || ''}
                    onChange={(e) => handleFieldChange('number_of_units', parseInt(e.target.value))}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="text-xs text-gray-500 font-medium">Status</label>
                  <select
                    value={getFieldValue('status') || ''}
                    onChange={(e) => handleFieldChange('status', e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
                  >
                    <option value="">Select status...</option>
                    {STATUS_OPTIONS.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                {/* Region */}
                <div>
                  <label className="text-xs text-gray-500 font-medium">Region</label>
                  <select
                    value={getFieldValue('region') || ''}
                    onChange={(e) => handleFieldChange('region', e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
                  >
                    <option value="">Select region...</option>
                    {UK_REGIONS.map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>

                {/* Area/Location */}
                <div>
                  <label className="text-xs text-gray-500 font-medium">Area/Location</label>
                  <input
                    type="text"
                    value={getFieldValue('area') || ''}
                    onChange={(e) => handleFieldChange('area', e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
                  />
                </div>

                {/* Website URL */}
                <div>
                  <label className="text-xs text-gray-500 font-medium">Website URL</label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="url"
                      value={getFieldValue('website_url') || ''}
                      onChange={(e) => handleFieldChange('website_url', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
                    />
                    {getFieldValue('website_url') && (
                      <a
                        href={getFieldValue('website_url')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <ExternalLink size={20} />
                      </a>
                    )}
                  </div>
                </div>

                {/* Image URL */}
                <div>
                  <label className="text-xs text-gray-500 font-medium">Image URL</label>
                  <input
                    type="url"
                    value={getFieldValue('image_url') || ''}
                    onChange={(e) => handleFieldChange('image_url', e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
                  />
                  {getFieldValue('image_url') && (
                    <img
                      src={getFieldValue('image_url')}
                      alt="Preview"
                      className="mt-2 w-full h-32 object-cover rounded-lg"
                    />
                  )}
                </div>

                {/* Verification Status */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-gray-500 font-medium">Verification Status</label>
                    <span className={`text-sm font-medium ${currentDevelopment.verified ? 'text-green-600' : 'text-orange-600'}`}>
                      {currentDevelopment.verified ? '✓ Verified' : '⚠ Unverified'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatVerificationAge(currentDevelopment.verified_at)}
                  </div>
                </div>

                {/* Verification Notes */}
                <div>
                  <label className="text-xs text-gray-500 font-medium">Verification Notes (Optional)</label>
                  <textarea
                    value={getFieldValue('verification_notes') || ''}
                    onChange={(e) => handleFieldChange('verification_notes', e.target.value)}
                    placeholder="Add any notes about this development..."
                    rows={3}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
                  />
                </div>
              </div>
            </div>

            {/* RIGHT: Website Preview */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Website Preview</h2>
                {getFieldValue('website_url') && (
                  <a
                    href={getFieldValue('website_url')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary-blue hover:text-primary-blue-hover"
                  >
                    Open in New Tab <ExternalLink size={16} />
                  </a>
                )}
              </div>

              {getFieldValue('website_url') ? (
                <iframe
                  src={getFieldValue('website_url')}
                  className="w-full h-[calc(100vh-300px)] border border-gray-200 rounded-lg"
                  title="Website Preview"
                />
              ) : (
                <div className="w-full h-[calc(100vh-300px)] border border-gray-200 rounded-lg flex items-center justify-center bg-gray-50">
                  <p className="text-gray-500">No website URL provided</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} />
              Previous
            </button>

            <div className="flex gap-3">
              <button
                onClick={() => handleSaveChanges(true)}
                disabled={!hasUnsavedChanges || saving}
                className="flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={20} />
                Save Changes
              </button>

              <button
                onClick={handleFlagForReview}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors"
              >
                <Flag size={20} />
                Flag for Review
              </button>

              <button
                onClick={handleSkipToNext}
                disabled={currentIndex === developments.length - 1}
                className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SkipForward size={20} />
                Skip to Next
              </button>

              <button
                onClick={() => {
                  console.log('Button onClick fired');
                  console.log('Is saving?', saving);
                  console.log('Current development exists?', !!currentDevelopment);
                  handleVerifyAndNext();
                }}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-primary-blue hover:bg-primary-blue-hover text-white rounded-lg font-semibold transition-colors"
              >
                <CheckCircle size={20} />
                Verify & Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
