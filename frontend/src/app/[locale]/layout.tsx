import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/i18n/config';
import { Header } from '@/components/Header';
import '../globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  manifest: '/manifest.webmanifest',
  themeColor: '#1d4ed8',
  appleWebApp: { capable: true, title: 'dr.Climate' },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const locale = params.locale as Locale;
  if (!locales.includes(locale)) notFound();

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          <Header />
          <main className="min-h-[calc(100vh-65px)]">{children}</main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
