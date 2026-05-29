import { PrismaClient, Role, ServiceType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const CITIES = [
  { slug: 'kyiv', nameUk: 'Київ', nameRu: 'Киев', nameEn: 'Kyiv', sortOrder: 1 },
  { slug: 'dnipro', nameUk: 'Дніпро', nameRu: 'Днепр', nameEn: 'Dnipro', sortOrder: 2 },
  { slug: 'lviv', nameUk: 'Львів', nameRu: 'Львов', nameEn: 'Lviv', sortOrder: 3 },
  { slug: 'kharkiv', nameUk: 'Харків', nameRu: 'Харьков', nameEn: 'Kharkiv', sortOrder: 4 },
  { slug: 'odesa', nameUk: 'Одеса', nameRu: 'Одесса', nameEn: 'Odesa', sortOrder: 5 },
  { slug: 'zaporizhzhia', nameUk: 'Запоріжжя', nameRu: 'Запорожье', nameEn: 'Zaporizhzhia', sortOrder: 6 },
  { slug: 'vinnytsia', nameUk: 'Вінниця', nameRu: 'Винница', nameEn: 'Vinnytsia', sortOrder: 7 },
  { slug: 'poltava', nameUk: 'Полтава', nameRu: 'Полтава', nameEn: 'Poltava', sortOrder: 8 },
  { slug: 'chernihiv', nameUk: 'Чернігів', nameRu: 'Чернигов', nameEn: 'Chernihiv', sortOrder: 9 },
  { slug: 'mykolaiv', nameUk: 'Миколаїв', nameRu: 'Николаев', nameEn: 'Mykolaiv', sortOrder: 10 },
  { slug: 'zhytomyr', nameUk: 'Житомир', nameRu: 'Житомир', nameEn: 'Zhytomyr', sortOrder: 11 },
  { slug: 'khmelnytskyi', nameUk: 'Хмельницький', nameRu: 'Хмельницкий', nameEn: 'Khmelnytskyi', sortOrder: 12 },
  { slug: 'rivne', nameUk: 'Рівне', nameRu: 'Ровно', nameEn: 'Rivne', sortOrder: 13 },
  { slug: 'lutsk', nameUk: 'Луцьк', nameRu: 'Луцк', nameEn: 'Lutsk', sortOrder: 14 },
  { slug: 'ivano-frankivsk', nameUk: 'Івано-Франківськ', nameRu: 'Ивано-Франковск', nameEn: 'Ivano-Frankivsk', sortOrder: 15 },
  { slug: 'uzhhorod', nameUk: 'Ужгород', nameRu: 'Ужгород', nameEn: 'Uzhhorod', sortOrder: 16 },
  { slug: 'ternopil', nameUk: 'Тернопіль', nameRu: 'Тернополь', nameEn: 'Ternopil', sortOrder: 17 },
  { slug: 'chernivtsi', nameUk: 'Чернівці', nameRu: 'Черновцы', nameEn: 'Chernivtsi', sortOrder: 18 },
  { slug: 'kropyvnytskyi', nameUk: 'Кропивницький', nameRu: 'Кропивницкий', nameEn: 'Kropyvnytskyi', sortOrder: 19 },
  { slug: 'sumy', nameUk: 'Суми', nameRu: 'Сумы', nameEn: 'Sumy', sortOrder: 20 },
  { slug: 'cherkasy', nameUk: 'Черкаси', nameRu: 'Черкассы', nameEn: 'Cherkasy', sortOrder: 21 },
  { slug: 'kherson', nameUk: 'Херсон', nameRu: 'Херсон', nameEn: 'Kherson', sortOrder: 22 },
];

async function main() {
  for (const city of CITIES) {
    await prisma.city.upsert({
      where: { slug: city.slug },
      update: city,
      create: city,
    });
  }

  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@drclimat.ua' },
    update: { city: 'kyiv' },
    create: {
      email: 'admin@drclimat.ua',
      password: adminPassword,
      role: Role.ADMIN,
      name: 'Admin',
      city: 'kyiv',
    },
  });

  const clientPassword = await bcrypt.hash('client123', 10);
  await prisma.user.upsert({
    where: { email: 'client@example.com' },
    update: { city: 'kyiv' },
    create: {
      email: 'client@example.com',
      password: clientPassword,
      role: Role.CLIENT,
      name: 'Олена Клієнт',
      phone: '+380501234567',
      city: 'kyiv',
    },
  });

  const masterPassword = await bcrypt.hash('master123', 10);
  const master = await prisma.user.upsert({
    where: { email: 'master@example.com' },
    update: { city: 'kyiv' },
    create: {
      email: 'master@example.com',
      password: masterPassword,
      role: Role.MASTER,
      name: 'Іван Майстер',
      phone: '+380671234567',
      city: 'kyiv',
      masterProfile: {
        create: {
          skills: [ServiceType.AC_INSTALLATION, ServiceType.AC_REPAIR, ServiceType.AC_MAINTENANCE],
          serviceArea: 'kyiv',
          isOnline: true,
          bio: 'Сертифікований майстер з кондиціонерів',
        },
      },
    },
  });

  await prisma.masterProfile.updateMany({
    where: { serviceArea: 'Kyiv' },
    data: { serviceArea: 'kyiv' },
  });
  await prisma.serviceRequest.updateMany({
    where: { city: 'Kyiv' },
    data: { city: 'kyiv' },
  });

  console.log('Seed completed:', { admin: admin.email, master: master.email, cities: CITIES.length });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
