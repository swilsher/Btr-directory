'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Development } from '@/types/database';
import Link from 'next/link';
import { Plus, Edit, Trash2, Loader2, Search, Building2 } from 'lucide-react';
import { getFriendlyStatus } from '@/lib/utils';

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'btr2025admin';

const STATUS_OPTIONS = [
  'Proposed',
  'Pending completion - Planning',
  'Pending completion - Construction',
  'Under Construction',
  'Lease-up',
  'Stabilised',
  'Complete - Operational',
  'Completed',
];

export default function AdminDevelopmentsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [developments, setDevelopments] = useState<Development[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');

  useEffect(() => {
    const auth = sessionStorage.getItem('admin_authenticated');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDevelopments();
    }
  }, [isAuthenticated, searchQuery, statusFilter, regionFilter]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_authenticated', 'true');
    } else {
      alert('Incorrect password');
    }
  };

  const fetchDevelopments = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('developments')
        .select('*, operator:operators(id, name), asset_owner:asset_owners(id, name)')
        .order('created_at', { ascending: false });

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      if (regionFilter) {
        query = query.eq('region', regionFilter);
      }

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDevelopments(data || []);
    } catch (error) {
      console.error('Error fetching developments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (devId: string, devName: string) => {
    if (!confirm(`Are you sure you want to delete "${devName}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(devId);
    try {
      const { error } = await supabase
        .from('developments')
        .delete()
        .eq('id', devId);

      if (error) throw error;

      setDevelopments(prev => prev.filter(d => d.id !== devId));
    } catch (error) {
      console.error('Error deleting development:', error);
      alert('Failed to delete development');
    } finally {
      setDeleting(null);
    }
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold">Development Management</h1>
            <div className="flex items-center gap-4">
              <Link
                href="/admin/developments/new"
                className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-lg font-semibold hover:bg-primary-blue-hover transition-colors"
              >
                <Plus size={20} />
                Add New Development
              </Link>
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

          {/* Admin Navigation */}
          <div className="flex items-center gap-4 mb-4 text-sm">
            <Link href="/admin/verify" className="text-gray-600 hover:text-primary-blue transition-colors">
              Verify Developments
            </Link>
            <span className="text-gray-300">|</span>
            <span className="text-primary-blue font-medium">
              Manage Developments
            </span>
            <span className="text-gray-300">|</span>
            <Link href="/admin/blog" className="text-gray-600 hover:text-primary-blue transition-colors">
              Blog Management
            </Link>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-4 gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map(status => (
                <option key={status} value={status}>{getFriendlyStatus(status)} ({status})</option>
              ))}
            </select>

            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
            >
              <option value="">All Regions</option>
              {[
                'London', 'South East', 'South West', 'East of England',
                'East Midlands', 'West Midlands', 'North West', 'North East',
                'Yorkshire and The Humber', 'Scotland', 'Wales'
              ].map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>

            <div className="col-span-2 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search developments..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-primary-blue" size={48} />
          </div>
        ) : developments.length === 0 ? (
          <div className="text-center py-20">
            <Building2 size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg mb-4">No developments found</p>
            <Link
              href="/admin/developments/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-blue text-white rounded-lg font-semibold hover:bg-primary-blue-hover transition-colors"
            >
              <Plus size={20} />
              Add First Development
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Operator
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    City / Region
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Units
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {developments.map((dev) => (
                  <tr key={dev.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {dev.image_url && (
                          <img
                            src={dev.image_url}
                            alt=""
                            className="w-12 h-12 object-cover rounded"
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                          />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{dev.name}</p>
                          <p className="text-sm text-gray-500">/{dev.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {dev.operator?.name || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <span className="text-sm text-gray-900">{dev.area || '-'}</span>
                        {dev.region && (
                          <p className="text-xs text-gray-500">{dev.region}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        dev.status === 'Complete - Operational' || dev.status === 'Completed' || dev.status === 'Stabilised'
                          ? 'bg-green-100 text-green-800'
                          : dev.status === 'Under Construction' || dev.status === 'Lease-up'
                          ? 'bg-orange-100 text-orange-800'
                          : dev.status === 'Proposed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {getFriendlyStatus(dev.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {dev.number_of_units || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/developments/${dev.id}/edit`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </Link>
                        <button
                          onClick={() => handleDelete(dev.id, dev.name)}
                          disabled={deleting === dev.id}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {deleting === dev.id ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Stats */}
        {!loading && developments.length > 0 && (
          <div className="mt-6 grid grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">Total Developments</p>
              <p className="text-2xl font-semibold">{developments.length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">Operational</p>
              <p className="text-2xl font-semibold text-green-600">
                {developments.filter(d => ['Complete - Operational', 'Completed', 'Stabilised'].includes(d.status || '')).length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">Under Construction</p>
              <p className="text-2xl font-semibold text-orange-600">
                {developments.filter(d => ['Under Construction', 'Lease-up', 'Pending completion - Construction'].includes(d.status || '')).length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">Total Units</p>
              <p className="text-2xl font-semibold text-blue-600">
                {developments.reduce((sum, d) => sum + (d.number_of_units || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
