'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe, Keyboard, ArrowRight, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/language-context';
import { motion, AnimatePresence } from 'framer-motion';

export interface ManualConnectProps {
    onConnectByIP: (ip: string, port: number) => void;
    onConnectByCode: (code: string) => void;
    isConnecting?: boolean;
}

/**
 * EUVEKA Form Styling Applied:
 * - Input height: 48px (h-12)
 * - Input border-radius: 12px (rounded-xl)
 * - Button height: 56px (h-14)
 * - Button border-radius: 60px (pill shape)
 * - Border colors: #e5dac7 (light) / #544a36 (dark)
 * - Focus ring: #b2987d accent
 */
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
            setError('That IP address doesn\'t look right. It should be like 192.168.1.100');
            return;
        }
        const portNum = parseInt(port, 10);
        if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
            setError('Port should be a number between 1 and 65535');
            return;
        }
        onConnectByIP(ip, portNum);
    };

    const handleCodeConnect = () => {
        setError(null);
        if (!code.trim()) {
            setError('Enter the code shown on the other device');
            return;
        }
        onConnectByCode(code.trim().toUpperCase());
    };

    return (
        <Card className="p-6 rounded-2xl border border-[#e5dac7] dark:border-[#544a36] bg-[#fefefc] dark:bg-[#191610] shadow-[0_4px_20px_-4px_rgba(25,22,16,0.08)] dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.3)]">
            <h3 className="font-semibold mb-4 text-[#191610] dark:text-[#fefefc]">{t('app.receive')}</h3>

            <Tabs defaultValue="code" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4 h-12 rounded-xl bg-[#e5dac7]/30 dark:bg-[#544a36]/30 p-1">
                    <TabsTrigger
                        value="code"
                        className="flex items-center gap-2 text-base sm:text-sm rounded-xl data-[state=active]:bg-[#fefefc] dark:data-[state=active]:bg-[#191610] data-[state=active]:text-[#191610] dark:data-[state=active]:text-[#fefefc] data-[state=active]:shadow-sm transition-all duration-300"
                    >
                        <Keyboard className="w-5 h-5 sm:w-4 sm:h-4" aria-hidden="true" />
                        {t('app.enterCode')}
                    </TabsTrigger>
                    <TabsTrigger
                        value="ip"
                        className="flex items-center gap-2 text-base sm:text-sm rounded-xl data-[state=active]:bg-[#fefefc] dark:data-[state=active]:bg-[#191610] data-[state=active]:text-[#191610] dark:data-[state=active]:text-[#fefefc] data-[state=active]:shadow-sm transition-all duration-300"
                    >
                        <Globe className="w-5 h-5 sm:w-4 sm:h-4" aria-hidden="true" />
                        IP
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="code" className="space-y-4">
                    <div className="space-y-2">
                        <Label
                            htmlFor="code"
                            className="text-sm font-medium text-[#191610] dark:text-[#fefefc]"
                        >
                            {t('app.enterCode')}
                        </Label>
                        <Input
                            id="code"
                            placeholder="e.g. apple-berry-cloud or AB3X#K"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="font-mono text-lg text-center h-12"
                            inputSize="default"
                            state={error ? 'error' : 'default'}
                            aria-required="true"
                            aria-invalid={!!error}
                            aria-describedby={error ? "manual-connect-error" : undefined}
                        />
                        <p className="text-xs text-[#b2987d]">
                            {t('app.orEnterCode')}
                        </p>
                    </div>
                    {/* EUVEKA: 56px button height with pill shape */}
                    <Button
                        className="w-full"
                        size="default"
                        variant="primary"
                        onClick={handleCodeConnect}
                        disabled={isConnecting || !code.trim()}
                        loading={isConnecting ?? false}
                        rightIcon={!isConnecting ? <ArrowRight className="w-5 h-5" aria-hidden="true" /> : undefined}
                    >
                        {t('app.connect')}
                    </Button>
                </TabsContent>

                <TabsContent value="ip" className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2 space-y-2">
                            <Label
                                htmlFor="ip"
                                className="text-sm font-medium text-[#191610] dark:text-[#fefefc]"
                            >
                                IP Address
                            </Label>
                            <Input
                                id="ip"
                                placeholder="192.168.1.100"
                                value={ip}
                                onChange={(e) => setIp(e.target.value)}
                                className="font-mono"
                                inputSize="default"
                                state={error ? 'error' : 'default'}
                                aria-required="true"
                                aria-invalid={!!error}
                                aria-describedby={error ? "manual-connect-error" : undefined}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label
                                htmlFor="port"
                                className="text-sm font-medium text-[#191610] dark:text-[#fefefc]"
                            >
                                Port
                            </Label>
                            <Input
                                id="port"
                                placeholder="53317"
                                value={port}
                                onChange={(e) => setPort(e.target.value)}
                                className="font-mono"
                                inputSize="default"
                                state={error ? 'error' : 'default'}
                                aria-required="true"
                                aria-invalid={!!error}
                                aria-describedby={error ? "manual-connect-error" : undefined}
                            />
                        </div>
                    </div>
                    {/* EUVEKA: 56px button height with pill shape */}
                    <Button
                        className="w-full"
                        size="default"
                        variant="primary"
                        onClick={handleIPConnect}
                        disabled={isConnecting || !ip.trim()}
                        loading={isConnecting ?? false}
                        rightIcon={!isConnecting ? <ArrowRight className="w-5 h-5" aria-hidden="true" /> : undefined}
                    >
                        {t('app.connect')}
                    </Button>
                </TabsContent>
            </Tabs>

            {/* EUVEKA styled error message */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        id="manual-connect-error"
                        role="alert"
                        aria-live="assertive"
                        className="flex items-center gap-2 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20"
                    >
                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0" aria-hidden="true" />
                        <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                            {error}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
}

export default ManualConnect;
