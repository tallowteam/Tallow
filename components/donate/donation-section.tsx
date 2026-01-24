'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n/language-context';

const PRESET_AMOUNTS = [
  { value: 500, label: '$5' },
  { value: 1000, label: '$10' },
  { value: 2500, label: '$25' },
];

export function DonationSection() {
  const { t } = useLanguage();
  const [selectedAmount, setSelectedAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [loading, setLoading] = useState(false);

  // Only render if Stripe publishable key is configured
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return null;
  }

  const handleDonate = async () => {
    setLoading(true);

    try {
      const amount = isCustom
        ? Math.round(parseFloat(customAmount) * 100)
        : selectedAmount;

      if (!amount || amount < 100) {
        alert(t('donate.minAmount'));
        setLoading(false);
        return;
      }

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || t('donate.error'));
      }
    } catch {
      alert(t('donate.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section-content border-t border-border">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-secondary mx-auto mb-6">
            <Heart className="w-6 h-6" />
          </div>

          <h2 className="display-sm mb-4">{t('donate.title')}</h2>
          <p className="body-md mb-8 text-muted-foreground">
            {t('donate.description')}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            {PRESET_AMOUNTS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => {
                  setSelectedAmount(preset.value);
                  setIsCustom(false);
                }}
                className={`px-6 py-3 rounded-lg border text-sm font-medium transition-colors ${
                  !isCustom && selectedAmount === preset.value
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border hover:border-foreground'
                }`}
              >
                {preset.label}
              </button>
            ))}
            <button
              onClick={() => setIsCustom(true)}
              className={`px-6 py-3 rounded-lg border text-sm font-medium transition-colors ${
                isCustom
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border hover:border-foreground'
              }`}
            >
              {t('donate.custom')}
            </button>
          </div>

          {isCustom && (
            <div className="mb-6">
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg font-medium">$</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="10"
                  className="w-24 px-3 py-2 rounded-lg border border-border bg-background text-center text-lg"
                />
              </div>
            </div>
          )}

          <Button
            onClick={handleDonate}
            disabled={loading || (isCustom && !customAmount)}
            size="lg"
          >
            {loading ? t('donate.processing') : t('donate.button')}
          </Button>

          <p className="mt-4 text-xs text-muted-foreground">
            {t('donate.secure')}
          </p>
        </div>
      </div>
    </section>
  );
}
