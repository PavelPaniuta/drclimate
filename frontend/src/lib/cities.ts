export interface City {
  id: string;
  slug: string;
  nameUk: string;
  nameRu: string;
  nameEn: string;
  isActive: boolean;
  sortOrder: number;
}

export function getCityName(city: City | undefined, slug: string | undefined, locale: string): string {
  if (city) {
    if (locale === 'ru') return city.nameRu;
    if (locale === 'en') return city.nameEn;
    return city.nameUk;
  }
  return slug || '—';
}

export function findCityBySlug(cities: City[], slug?: string | null) {
  return cities.find((c) => c.slug === slug);
}
