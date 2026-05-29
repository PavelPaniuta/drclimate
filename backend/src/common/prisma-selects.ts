/** Shared Prisma selects for user contact & master public profile */

export const userContactSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  address: true,
  telegram: true,
  city: true,
} as const;

export const masterProfilePublicSelect = {
  avatarUrl: true,
  bio: true,
  workPhotos: {
    orderBy: { sortOrder: 'asc' as const },
    select: { id: true, url: true, caption: true, sortOrder: true },
  },
} as const;

export const masterUserPublicSelect = {
  select: {
    ...userContactSelect,
    masterProfile: { select: masterProfilePublicSelect },
  },
} as const;
