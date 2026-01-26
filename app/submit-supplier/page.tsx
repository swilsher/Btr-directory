'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface SupplierFormData {
  companyName: string;
  category: string;
  website: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  description: string;
}

const categories = [
  'Furniture',
  'Gym Equipment',
  'Proptech',
  'Security',
  'Energy Solutions',
  'Broadband Providers',
  'Locker and Storage Solutions',
  'Water and Flooding Solutions',
  'Smart Home',
  'Other',
];

export default function SubmitSupplierPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SupplierFormData>();

  const onSubmit = async (data: SupplierFormData) => {
    setStatus('loading');
    setErrorMessage('');

    try {
      const { error } = await supabase
        .from('supplier_submissions')
        .insert([{
          company_name: data.companyName,
          category: data.category,
          website: data.website,
          contact_name: data.contactName,
          contact_email: data.contactEmail,
          contact_phone: data.contactPhone || null,
          description: data.description,
          status: 'pending',
        }]);

      if (error) throw error;

      setStatus('success');
      reset();
    } catch (error) {
      console.error('Error submitting supplier:', error);
      setStatus('error');
      setErrorMessage('Failed to submit your application. Please try again later.');
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <section className="bg-gradient-to-br from-primary-blue to-primary-blue-hover text-white py-12">
          <div className="container-custom">
            <h1 className="text-4xl font-bold mb-3">Submit Your Company</h1>
            <p className="text-xl text-blue-50">
              Get listed in our BTR supplier directory
            </p>
          </div>
        </section>

        <div className="container-custom py-8">
          <div className="max-w-2xl mx-auto">
            {status === 'success' ? (
              <div className="bg-white rounded-lg border border-border p-8 text-center">
                <CheckCircle className="mx-auto text-green-600 mb-4" size={64} />
                <h2 className="text-2xl font-bold text-text-primary mb-3">Application Received!</h2>
                <p className="text-text-secondary mb-6">
                  Thank you for your submission. We'll review your application and get back to you within 2-3 business days.
                </p>
                <Button onClick={() => setStatus('idle')} variant="primary">
                  Submit Another
                </Button>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-border p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold mb-2">List Your Company</h2>
                  <p className="text-text-secondary">
                    Join our directory of BTR suppliers and reach thousands of industry professionals.
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Company Name */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Company Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('companyName', { required: 'Company name is required' })}
                      className="input-field"
                      placeholder="Your Company Ltd"
                    />
                    {errors.companyName && (
                      <p className="mt-1 text-sm text-red-600">{errors.companyName.message}</p>
                    )}
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Category <span className="text-red-600">*</span>
                    </label>
                    <select
                      {...register('category', { required: 'Category is required' })}
                      className="input-field"
                    >
                      <option value="">Select a category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                    )}
                  </div>

                  {/* Website */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Website <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="url"
                      {...register('website', {
                        required: 'Website is required',
                        pattern: {
                          value: /^https?:\/\/.+/i,
                          message: 'Please enter a valid URL (including http:// or https://)',
                        },
                      })}
                      className="input-field"
                      placeholder="https://www.yourcompany.com"
                    />
                    {errors.website && (
                      <p className="mt-1 text-sm text-red-600">{errors.website.message}</p>
                    )}
                  </div>

                  {/* Contact Name */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Contact Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('contactName', { required: 'Contact name is required' })}
                      className="input-field"
                      placeholder="John Smith"
                    />
                    {errors.contactName && (
                      <p className="mt-1 text-sm text-red-600">{errors.contactName.message}</p>
                    )}
                  </div>

                  {/* Contact Email */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Contact Email <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="email"
                      {...register('contactEmail', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address',
                        },
                      })}
                      className="input-field"
                      placeholder="john@yourcompany.com"
                    />
                    {errors.contactEmail && (
                      <p className="mt-1 text-sm text-red-600">{errors.contactEmail.message}</p>
                    )}
                  </div>

                  {/* Contact Phone */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Contact Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      {...register('contactPhone')}
                      className="input-field"
                      placeholder="+44 20 1234 5678"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Company Description <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      {...register('description', {
                        required: 'Description is required',
                        minLength: {
                          value: 50,
                          message: 'Description must be at least 50 characters',
                        },
                      })}
                      rows={6}
                      className="input-field"
                      placeholder="Tell us about your company, products, and services for the BTR sector..."
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                    )}
                    <p className="mt-1 text-sm text-text-muted">Minimum 50 characters</p>
                  </div>

                  {/* Error Message */}
                  {status === 'error' && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                      <AlertCircle className="text-red-600 mr-2 mt-0.5 flex-shrink-0" size={20} />
                      <p className="text-red-800 text-sm">{errorMessage}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={status === 'loading'}
                      className="w-full sm:w-auto"
                    >
                      {status === 'loading' ? 'Submitting...' : 'Submit Application'}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
