# Quick Start - Tallow App Components

Get started with Tallow's app components in 5 minutes.

## Installation

Components are already installed in your project at:
```
C:/Users/aamir/Documents/Apps/Tallow/components/app/
```

## Basic Usage

### 1. Import Components

```tsx
import {
  TransferZone,
  ConnectionPanel,
  DeviceList,
  TransferProgress,
  TransferComplete,
  SecurityBadge,
  StatusIndicator
} from '@/components/app';
```

### 2. Import Stores

```tsx
import { useDeviceStore, useTransferStore } from '@/lib/stores';
```

### 3. Simple Example

```tsx
'use client';

import { TransferZone, StatusIndicator } from '@/components/app';
import { useDeviceStore, useTransferStore } from '@/lib/stores';

export default function MyPage() {
  const { connection } = useDeviceStore();
  const { addToQueue } = useTransferStore();

  return (
    <div>
      <StatusIndicator status={connection.status} />
      <TransferZone onFilesSelected={addToQueue} />
    </div>
  );
}
```

## Complete Example

```tsx
'use client';

import { useState } from 'react';
import {
  TransferZone,
  ConnectionPanel,
  DeviceList,
  TransferProgress,
  SecurityBadge,
  StatusIndicator
} from '@/components/app';
import { useDeviceStore, useTransferStore } from '@/lib/stores';

export default function TransferPage() {
  const [connectionCode] = useState('ABCD-1234-EFGH');

  // Device store
  const { devices, connection, selectDevice, selectedDevice } = useDeviceStore();

  // Transfer store
  const { addToQueue, activeTransfers } = useTransferStore();

  const handleConnect = (code: string) => {
    console.log('Connect:', code);
  };

  const handleCancel = (id: string) => {
    console.log('Cancel:', id);
  };

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Tallow Transfer</h1>
          <div className="flex items-center gap-4">
            <StatusIndicator status={connection.status} />
            <SecurityBadge isActive={activeTransfers.length > 0} isPQC />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main area */}
          <div className="lg:col-span-2 space-y-6">
            <TransferZone onFilesSelected={addToQueue} />

            {activeTransfers.map(transfer => (
              <TransferProgress
                key={transfer.id}
                transfer={transfer}
                onCancel={handleCancel}
              />
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <ConnectionPanel
              connectionCode={connectionCode}
              onConnect={handleConnect}
            />

            <DeviceList
              devices={devices}
              onDeviceClick={selectDevice}
              selectedDeviceId={selectedDevice?.id}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
```

## Component Reference

### TransferZone
Drop files or click to select.
```tsx
<TransferZone
  onFilesSelected={(files) => console.log(files)}
  disabled={false}
/>
```

### ConnectionPanel
Display connection code and connect to devices.
```tsx
<ConnectionPanel
  connectionCode="ABCD-1234"
  onConnect={(code) => console.log(code)}
  onGenerateCode={() => console.log('new code')}
/>
```

### DeviceList
Show nearby devices.
```tsx
<DeviceList
  devices={devices}
  onDeviceClick={(device) => console.log(device)}
  selectedDeviceId={selectedId}
/>
```

### TransferProgress
Show active transfer.
```tsx
<TransferProgress
  transfer={transfer}
  onCancel={(id) => console.log('cancel', id)}
  onPause={(id) => console.log('pause', id)}
  onResume={(id) => console.log('resume', id)}
/>
```

### TransferComplete
Show completed transfer.
```tsx
<TransferComplete
  transfer={transfer}
  onTransferAnother={() => console.log('another')}
  onViewHistory={() => console.log('history')}
/>
```

### SecurityBadge
Show encryption status.
```tsx
<SecurityBadge
  isActive={true}
  isPQC={true}
  algorithm="Kyber-1024"
/>
```

### StatusIndicator
Show connection status.
```tsx
<StatusIndicator
  status="connected"
  peerName="Device Name"
  size="md"
/>
```

## Styling

Components use Tailwind CSS classes. Make sure Tailwind is configured:

```js
// tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  // ... rest of config
};
```

## TypeScript

All components are fully typed. Import types:

```tsx
import type { Device, Transfer } from '@/lib/types';
import type { ConnectionStatus } from '@/components/app/StatusIndicator';
```

## Troubleshooting

### Components not rendering?
Make sure you're using `'use client'` directive at the top of your page.

### Store not working?
Verify Zustand stores are properly initialized in your app.

### Styles not applied?
Check that Tailwind CSS is configured and processing the component files.

### TypeScript errors?
Ensure `@/lib/types` and `@/lib/stores` paths are configured in `tsconfig.json`.

## Next Steps

1. Read full documentation: `components/app/README.md`
2. See delivery summary: `REACT_APP_COMPONENTS_DELIVERY.md`
3. Check existing app page: `app/app/page.tsx`
4. Review store types: `lib/stores/`

## Support

For issues or questions, refer to:
- Component README: `components/app/README.md`
- Main delivery doc: `REACT_APP_COMPONENTS_DELIVERY.md`
- Type definitions: `lib/types.ts`
