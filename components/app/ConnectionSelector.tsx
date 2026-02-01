'use client';

import { Card } from '@/components/ui/card';
import { Wifi, Globe, Users } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';

interface ConnectionSelectorProps {
  onSelectType: (type: 'local' | 'internet' | 'friends') => void;
  friendRequestCount?: number;
}

export function ConnectionSelector({ onSelectType, friendRequestCount = 0 }: ConnectionSelectorProps) {
  const { t } = useLanguage();

  const connectionTypes = [
    {
      id: 'local' as const,
      icon: Wifi,
      title: t('app.connectionType.local.title'),
      description: t('app.connectionType.local.description'),
      badge: null,
    },
    {
      id: 'internet' as const,
      icon: Globe,
      title: t('app.connectionType.internet.title'),
      description: t('app.connectionType.internet.description'),
      badge: null,
    },
    {
      id: 'friends' as const,
      icon: Users,
      title: t('app.connectionType.friends.title'),
      description: t('app.connectionType.friends.description'),
      badge: friendRequestCount > 0 ? friendRequestCount : null,
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold" id="connection-type-heading">
        {t('app.selectConnectionType')}
      </h2>
      <div
        className="grid gap-4 sm:grid-cols-3"
        role="radiogroup"
        aria-labelledby="connection-type-heading"
      >
        {connectionTypes.map(({ id, icon: Icon, title, description, badge }) => (
          <Card
            key={id}
            className="p-6 cursor-pointer hover:border-primary transition-colors relative"
            onClick={() => onSelectType(id)}
            role="radio"
            aria-checked="false"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectType(id);
              }
            }}
          >
            {badge && (
              <div
                className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold"
                aria-label={`${badge} pending friend requests`}
              >
                {badge}
              </div>
            )}
            <div className="flex flex-col items-center text-center gap-3">
              <Icon className="w-8 h-8 text-primary" aria-hidden="true" />
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
