"use client";

import { useState, ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ExpandableSectionProps {
    title: string;
    icon: ReactNode;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

export function ExpandableSection({
    title,
    icon,
    children,
    defaultOpen = false
}: ExpandableSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border border-border rounded-lg overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-6 bg-hero-fg/5 hover:bg-hero-fg/10 transition-colors text-left"
                aria-expanded={isOpen}
                aria-controls={`section-${title.replace(/\s+/g, '-').toLowerCase()}`}
            >
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-hero-fg/10">
                        {icon}
                    </div>
                    <span className="heading-md">{title}</span>
                </div>
                {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
            </button>
            {isOpen && (
                <div
                    id={`section-${title.replace(/\s+/g, '-').toLowerCase()}`}
                    className="p-6 border-t border-border"
                >
                    {children}
                </div>
            )}
        </div>
    );
}
