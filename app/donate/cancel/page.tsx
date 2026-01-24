'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n/language-context';

export default function DonateCancel() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h1 className="display-sm mb-4">{t('donate.cancel.title')}</h1>
        <p className="body-md text-muted-foreground mb-8">
          {t('donate.cancel.message')}
        </p>
        <Link href="/">
          <Button>{t('donate.cancel.back')}</Button>
        </Link>
      </div>
    </div>
  );
}
