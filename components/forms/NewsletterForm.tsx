'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Button from '@/components/ui/Button';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';

interface NewsletterFormData {
  email: string;
  name?: string;
}

export default function NewsletterForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<NewsletterFormData>();

  const onSubmit = async (data: NewsletterFormData) => {
    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          name: data.name || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setStatus('error');
        setMessage(result.error || 'Failed to subscribe. Please try again later.');
      } else {
        setStatus('success');
        setMessage('Successfully subscribed! Check your email for confirmation.');
        reset();
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      setStatus('error');
      setMessage('Failed to subscribe. Please try again later.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md mx-auto">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          placeholder="Enter your email"
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address',
            },
          })}
          className="input-field flex-1"
          disabled={status === 'loading'}
        />
        <Button
          type="submit"
          variant="primary"
          className="sm:w-auto"
          disabled={status === 'loading'}
        >
          {status === 'loading' ? (
            'Subscribing...'
          ) : (
            <>
              <Mail className="mr-2" size={18} />
              Subscribe
            </>
          )}
        </Button>
      </div>

      {errors.email && (
        <div className="mt-2 flex items-center text-red-600 text-sm">
          <AlertCircle size={16} className="mr-1" />
          {errors.email.message}
        </div>
      )}

      {status === 'success' && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
          <CheckCircle className="text-green-600 mr-2 mt-0.5 flex-shrink-0" size={20} />
          <p className="text-green-800 text-sm">{message}</p>
        </div>
      )}

      {status === 'error' && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="text-red-600 mr-2 mt-0.5 flex-shrink-0" size={20} />
          <p className="text-red-800 text-sm">{message}</p>
        </div>
      )}
    </form>
  );
}
