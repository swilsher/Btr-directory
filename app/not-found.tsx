import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { Search, Home, Building2 } from 'lucide-react';

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <section className="py-20">
          <div className="container-custom text-center">
            <div className="w-20 h-20 mx-auto bg-blue-50 rounded-full flex items-center justify-center mb-6">
              <Search className="text-primary-blue" size={40} />
            </div>
            <h1 className="text-6xl font-semibold text-text-primary mb-4">404</h1>
            <h2 className="text-2xl font-semibold text-text-secondary mb-4">Page Not Found</h2>
            <p className="text-text-secondary mb-8 max-w-md mx-auto">
              The page you are looking for does not exist or may have been moved. Try browsing our directory instead.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/">
                <Button variant="primary">
                  <Home className="mr-2" size={18} />
                  Go Home
                </Button>
              </Link>
              <Link href="/multifamily">
                <Button variant="outline">
                  <Building2 className="mr-2" size={18} />
                  Browse Developments
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
