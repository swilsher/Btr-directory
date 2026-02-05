import Link from 'next/link';
import { Mail, MapPin } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-border mt-20">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-primary-blue rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">B</span>
              </div>
              <span className="text-xl font-bold text-text-primary">BTR Directory</span>
            </div>
            <p className="text-text-secondary mb-4 max-w-md">
              The UK's most comprehensive database of Build-to-Rent developments, operators, asset owners, and suppliers.
            </p>
            <div className="flex items-center space-x-2 text-text-secondary mb-2">
              <MapPin size={16} />
              <span>United Kingdom</span>
            </div>
            <div className="flex items-center space-x-2 text-text-secondary">
              <Mail size={16} />
              <a href="mailto:info@btrdirectory.com" className="hover:text-primary-blue transition-colors">
                info@btrdirectory.com
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-text-primary mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/multifamily" className="text-text-secondary hover:text-primary-blue transition-colors">
                  Multifamily
                </Link>
              </li>
              <li>
                <Link href="/single-family" className="text-text-secondary hover:text-primary-blue transition-colors">
                  Single Family
                </Link>
              </li>
              <li>
                <Link href="/asset-owners" className="text-text-secondary hover:text-primary-blue transition-colors">
                  Asset Owners
                </Link>
              </li>
              <li>
                <Link href="/operators" className="text-text-secondary hover:text-primary-blue transition-colors">
                  Operators
                </Link>
              </li>
              <li>
                <Link href="/suppliers" className="text-text-secondary hover:text-primary-blue transition-colors">
                  Suppliers
                </Link>
              </li>
              <li>
                <Link href="/insights" className="text-text-secondary hover:text-primary-blue transition-colors">
                  Insights
                </Link>
              </li>
            </ul>
          </div>

          {/* Get Involved */}
          <div>
            <h4 className="font-semibold text-text-primary mb-4">Get Involved</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/submit-correction" className="text-text-secondary hover:text-primary-blue transition-colors">
                  Submit Correction
                </Link>
              </li>
              <li>
                <Link href="/submit-supplier" className="text-text-secondary hover:text-primary-blue transition-colors">
                  Add Your Company
                </Link>
              </li>
              <li>
                <Link href="/#newsletter" className="text-text-secondary hover:text-primary-blue transition-colors">
                  Newsletter
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-text-secondary text-sm">
          <p>&copy; {currentYear} BTR Directory. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
