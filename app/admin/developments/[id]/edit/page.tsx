'use client';

import { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase';
import { Development } from '@/types/database';
import DevelopmentForm from '@/components/admin/DevelopmentForm';
import { Loader2 } from 'lucide-react';

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'btr2025admin';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditDevelopmentPage({ params }: PageProps) {
  const { id } = use(params);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [development, setDevelopment] = useState<Development | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const auth = sessionStorage.getItem('admin_authenticated');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDevelopment();
    }
  }, [isAuthenticated, id]);

  const fetchDevelopment = async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('developments')
        .select('*, operator:operators(*), asset_owner:asset_owners(*)')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      setDevelopment(data);
    } catch (err) {
      console.error('Error fetching development:', err);
      setError('Development not found');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_authenticated', 'true');
    } else {
      alert('Incorrect password');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary-blue" size={48} />
      </div>
    );
  }

  if (error || !development) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg mb-4">{error || 'Development not found'}</p>
          <a
            href="/admin/developments"
            className="text-primary-blue hover:underline"
          >
            Back to Developments
          </a>
        </div>
      </div>
    );
  }

  return <DevelopmentForm development={development} isEdit />;
}
