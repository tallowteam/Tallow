'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Globe, Keyboard, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';

interface ManualConnectProps {
    onConnectByIP: (ip: string, port: number) => void;
    onConnectByCode: (code: string) => void;
    isConnecting?: boolean;
}

export function ManualConnect({ onConnectByIP, onConnectByCode, isConnecting }: ManualConnectProps) {
    const { t } = useLanguage();
    const [ip, setIp] = useState('');
    const [port, setPort] = useState('53317');
    const [code, setCode] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleIPConnect = () => {
        setError(null);
        // Validate IP
        const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipPattern.test(ip)) {
            setError('Please enter a valid IP address');
            return;
        }
        const portNum = parseInt(port, 10);
        if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
            setError('Please enter a valid port number (1-65535)');
            return;
        }
        onConnectByIP(ip, portNum);
    };

    const handleCodeConnect = () => {
        setError(null);
        if (!code.trim()) {
            setError('Please enter a connection code');
            return;
        }
        onConnectByCode(code.trim().toUpperCase());
    };

    return (
        <Card className="p-6 rounded-xl border border-border bg-card">
            <h3 className="font-semibold mb-4">{t('app.receive')}</h3>

            <Tabs defaultValue="code" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="code" className="flex items-center gap-2">
                        <Keyboard className="w-4 h-4" />
                        {t('app.enterCode')}
                    </TabsTrigger>
                    <TabsTrigger value="ip" className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        IP
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="code" className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="code">{t('app.enterCode')}</Label>
                        <Input
                            id="code"
                            placeholder="e.g. apple-berry-cloud or AB3X#K"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="font-mono text-lg text-center"
                        />
                        <p className="text-xs text-muted-foreground">
                            {t('app.orEnterCode')}
                        </p>
                    </div>
                    <Button
                        className="w-full"
                        onClick={handleCodeConnect}
                        disabled={isConnecting || !code.trim()}
                    >
                        {isConnecting ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <ArrowRight className="w-4 h-4 mr-2" />
                        )}
                        {t('app.connect')}
                    </Button>
                </TabsContent>

                <TabsContent value="ip" className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2 space-y-2">
                            <Label htmlFor="ip">IP</Label>
                            <Input
                                id="ip"
                                placeholder="192.168.1.100"
                                value={ip}
                                onChange={(e) => setIp(e.target.value)}
                                className="font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="port">Port</Label>
                            <Input
                                id="port"
                                placeholder="53317"
                                value={port}
                                onChange={(e) => setPort(e.target.value)}
                                className="font-mono"
                            />
                        </div>
                    </div>
                    <Button
                        className="w-full"
                        onClick={handleIPConnect}
                        disabled={isConnecting || !ip.trim()}
                    >
                        {isConnecting ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <ArrowRight className="w-4 h-4 mr-2" />
                        )}
                        {t('app.connect')}
                    </Button>
                </TabsContent>
            </Tabs>

            {error && (
                <p className="text-sm text-destructive mt-4">{error}</p>
            )}
        </Card>
    );
}

export default ManualConnect;
