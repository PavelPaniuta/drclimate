'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { api } from '@/lib/api';
import { City, findCityBySlug, getCityName } from '@/lib/cities';

interface Props {
  value: string;
  onChange: (slug: string) => void;
  required?: boolean;
  className?: string;
  label?: string;
}

export function CitySelect({ value, onChange, required, className = 'input', label }: Props) {
  const locale = useLocale();
  const [cities, setCities] = useState<City[]>([]);

  useEffect(() => {
    api<City[]>('/cities').then(setCities).catch(() => setCities([]));
  }, []);

  return (
    <div>
      {label && <label className="mb-1 block text-sm font-medium">{label}</label>}
      <select
        className={className}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      >
        <option value="">—</option>
        {cities.map((c) => (
          <option key={c.slug} value={c.slug}>
            {getCityName(c, c.slug, locale)}
          </option>
        ))}
        {value && !findCityBySlug(cities, value) && (
          <option value={value}>{value}</option>
        )}
      </select>
    </div>
  );
}

export function useCities() {
  const [cities, setCities] = useState<City[]>([]);
  useEffect(() => {
    api<City[]>('/cities').then(setCities).catch(() => setCities([]));
  }, []);
  return cities;
}

export function CityLabel({ slug }: { slug: string }) {
  const locale = useLocale();
  const cities = useCities();
  const city = findCityBySlug(cities, slug);
  return <>{getCityName(city, slug, locale)}</>;
}
