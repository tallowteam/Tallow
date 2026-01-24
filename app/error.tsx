'use client';

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
            <Card className="p-8 max-w-md text-center">
                <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
                <p className="text-sm text-muted-foreground mb-4">
                    An unexpected error occurred. Please try refreshing the page.
                </p>
                <Button onClick={reset}>Try again</Button>
            </Card>
        </div>
    );
}
