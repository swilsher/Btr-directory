'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface CorrectionFormData {
  requestType: 'correction' | 'missing_site';
  userName: string;
  userEmail: string;
  developmentName?: string;
  message: string;
}

export default function SubmitCorrectionPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CorrectionFormData>({
    defaultValues: {
      requestType: 'correction',
    },
  });

  const onSubmit = async (data: CorrectionFormData) => {
    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/correction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: data.requestType,
          userName: data.userName,
          userEmail: data.userEmail,
          developmentName: data.developmentName,
          message: data.message,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error);
      }

      setStatus('success');
      reset();
    } catch (error) {
      console.error('Error submitting correction:', error);
      setStatus('error');
      setErrorMessage('Failed to submit your request. Please try again later.');
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <section className="bg-gradient-to-br from-primary-blue to-primary-blue-hover text-white py-12">
          <div className="container-custom">
            <h1 className="text-4xl font-bold mb-3">Submit a Correction</h1>
            <p className="text-xl text-blue-50">
              Help us keep our database accurate and up-to-date
            </p>
          </div>
        </section>

        <div className="container-custom py-8">
          <div className="max-w-2xl mx-auto">
            {status === 'success' ? (
              <div className="bg-white rounded-lg border border-border p-8 text-center">
                <CheckCircle className="mx-auto text-green-600 mb-4" size={64} />
                <h2 className="text-2xl font-bold text-text-primary mb-3">Thank You!</h2>
                <p className="text-text-secondary mb-6">
                  Your submission has been received. We'll review it and update our database accordingly.
                </p>
                <Button onClick={() => setStatus('idle')} variant="primary">
                  Submit Another
                </Button>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-border p-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Request Type */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Request Type <span className="text-red-600">*</span>
                    </label>
                    <select
                      {...register('requestType', { required: 'Request type is required' })}
                      className="input-field"
                    >
                      <option value="correction">Report an Error</option>
                      <option value="missing_site">Report Missing Development</option>
                    </select>
                    {errors.requestType && (
                      <p className="mt-1 text-sm text-red-600">{errors.requestType.message}</p>
                    )}
                  </div>

                  {/* Your Name */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Your Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('userName', { required: 'Name is required' })}
                      className="input-field"
                      placeholder="John Smith"
                    />
                    {errors.userName && (
                      <p className="mt-1 text-sm text-red-600">{errors.userName.message}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Your Email <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="email"
                      {...register('userEmail', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address',
                        },
                      })}
                      className="input-field"
                      placeholder="john@example.com"
                    />
                    {errors.userEmail && (
                      <p className="mt-1 text-sm text-red-600">{errors.userEmail.message}</p>
                    )}
                  </div>

                  {/* Development Name (conditional) */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Development Name
                    </label>
                    <input
                      type="text"
                      {...register('developmentName')}
                      className="input-field"
                      placeholder="Name of the development"
                    />
                    <p className="mt-1 text-sm text-text-muted">
                      If reporting a missing site or correcting a specific development
                    </p>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Details <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      {...register('message', { required: 'Please provide details' })}
                      rows={6}
                      className="input-field"
                      placeholder="Please provide as much detail as possible about the correction or missing development..."
                    />
                    {errors.message && (
                      <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
                    )}
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
                      {status === 'loading' ? 'Submitting...' : 'Submit Request'}
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
