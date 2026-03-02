import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbSchema } from '@/lib/schema';
import { SITE_URL } from '@/lib/constants';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  const schemaItems = items.map((item) => ({
    name: item.label,
    url: `${SITE_URL}${item.href}`,
  }));

  return (
    <>
      <JsonLd data={breadcrumbSchema(schemaItems)} />
      <nav aria-label="Breadcrumb" className="container-custom py-3">
        <ol className="flex items-center flex-wrap gap-1 text-sm text-text-secondary">
          {items.map((item, index) => (
            <li key={item.href} className="flex items-center">
              {index > 0 && <ChevronRight size={14} className="mx-1 text-text-muted" />}
              {index === items.length - 1 ? (
                <span className="text-text-primary font-medium truncate max-w-[200px]">{item.label}</span>
              ) : (
                <Link href={item.href} className="hover:text-primary-blue transition-colors">
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
