'use client';

import { useState, useId } from 'react';
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
  const customInputId = useId();
  const amountGroupId = useId();

  // Only render if Stripe publishable key is configured
  if (!process.env['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY']) {
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

  const getAmountLabel = () => {
    if (isCustom && customAmount) {
      return '$' + customAmount;
    }
    const preset = PRESET_AMOUNTS.find(p => p.value === selectedAmount);
    return preset ? preset.label : '$10';
  };

  return (
    <section className="section-content border-t border-border" aria-labelledby="donation-heading">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-secondary mx-auto mb-6">
            <Heart className="w-6 h-6" aria-hidden="true" />
          </div>

          <h2 id="donation-heading" className="display-sm mb-4">{t('donate.title')}</h2>
          <p className="body-md mb-8 text-muted-foreground">
            {t('donate.description')}
          </p>

          <div 
            className="flex flex-wrap items-center justify-center gap-3 mb-6"
            role="radiogroup"
            aria-labelledby={amountGroupId}
          >
            <span id={amountGroupId} className="sr-only">Select donation amount</span>
            {PRESET_AMOUNTS.map((preset) => {
              const isSelected = !isCustom && selectedAmount === preset.value;
              return (
                <button
                  key={preset.value}
                  onClick={() => {
                    setSelectedAmount(preset.value);
                    setIsCustom(false);
                  }}
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={'Donate ' + preset.label}
                  className={'px-6 py-3 rounded-lg border text-sm font-medium transition-colors min-h-[44px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none ' + (
                    isSelected
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border hover:border-foreground'
                  )}
                  type="button"
                >
                  {preset.label}
                </button>
              );
            })}
            <button
              onClick={() => setIsCustom(true)}
              role="radio"
              aria-checked={isCustom}
              aria-label="Enter custom donation amount"
              className={'px-6 py-3 rounded-lg border text-sm font-medium transition-colors min-h-[44px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none ' + (
                isCustom
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border hover:border-foreground'
              )}
              type="button"
            >
              {t('donate.custom')}
            </button>
          </div>

          {isCustom && (
            <div className="mb-6">
              <label htmlFor={customInputId} className="sr-only">
                Custom donation amount in dollars
              </label>
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg font-medium" aria-hidden="true">$</span>
                <input
                  id={customInputId}
                  type="number"
                  min="1"
                  step="1"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="10"
                  aria-describedby="custom-amount-hint"
                  className="w-24 px-3 py-2 rounded-lg border border-border bg-background text-center text-lg min-h-[44px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                />
              </div>
              <span id="custom-amount-hint" className="sr-only">
                Enter a custom amount in US dollars. Minimum donation is $1.
              </span>
            </div>
          )}

          <Button
            onClick={handleDonate}
            disabled={loading || (isCustom && !customAmount)}
            size="lg"
            aria-label={loading ? 'Processing donation' : 'Donate ' + getAmountLabel()}
            aria-busy={loading}
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
