'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';

export default function DonateSuccess() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-green-100 dark:bg-green-900/20 mx-auto mb-6">
          <Heart className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="display-sm mb-4">{t('donate.success.title')}</h1>
        <p className="body-md text-muted-foreground mb-8">
          {t('donate.success.message')}
        </p>
        <Link href="/">
          <Button>{t('donate.success.back')}</Button>
        </Link>
      </div>
    </div>
  );
}
