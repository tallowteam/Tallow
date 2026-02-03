'use client';

import { useEffect, useRef, useState } from 'react';

interface Stat {
  value: string;
  label: string;
  suffix?: string;
  prefix?: string;
}

const stats: Stat[] = [
  {
    value: '10',
    suffix: 'M+',
    label: 'Files Transferred',
  },
  {
    value: '256',
    suffix: '-bit',
    label: 'Encryption Strength',
  },
  {
    value: '0',
    label: 'Data Stored',
  },
  {
    value: '99.9',
    suffix: '%',
    label: 'Uptime',
  },
];

function Counter({ value, suffix = '', prefix = '', duration = 2000 }: {
  value: string;
  suffix?: string;
  prefix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const countRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.5 }
    );

    if (countRef.current) {
      observer.observe(countRef.current);
    }

    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) return;

    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(numericValue * easeOutQuart);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [hasStarted, value, duration]);

  const displayValue = value.includes('.') ? count.toFixed(1) : Math.floor(count);

  return (
    <div ref={countRef}>
      <span>{prefix}</span>
      <span>{displayValue}</span>
      <span>{suffix}</span>
    </div>
  );
}

function StatCard({ stat, index, isVisible }: { stat: Stat; index: number; isVisible: boolean }) {
  return (
    <div
      className={`relative transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="relative group p-8 rounded-2xl bg-gradient-to-br from-gray-900/50 to-gray-950/50 border border-gray-800 hover:border-emerald-500/30 transition-all duration-300 backdrop-blur-sm">
        {/* Hover glow */}
        <div className="absolute inset-0 rounded-2xl bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-xl" />

        {/* Value */}
        <div className="text-5xl md:text-6xl font-bold mb-3 bg-gradient-to-br from-white via-emerald-100 to-emerald-400 bg-clip-text text-transparent">
          <Counter
            value={stat.value}
            suffix={stat.suffix}
            prefix={stat.prefix}
          />
        </div>

        {/* Label */}
        <div className="text-gray-400 font-medium">{stat.label}</div>

        {/* Decorative corner */}
        <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-emerald-500/20 rounded-tr-xl group-hover:border-emerald-500/40 transition-colors duration-300" />
      </div>
    </div>
  );
}

export function Stats() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-black" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(to right, #8B9A7D 1px, transparent 1px),
                           linear-gradient(to bottom, #8B9A7D 1px, transparent 1px)`,
          backgroundSize: '80px 80px'
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Stats grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <StatCard key={index} stat={stat} index={index} isVisible={isVisible} />
          ))}
        </div>

        {/* Bottom text */}
        <div
          className={`mt-16 text-center transition-all duration-1000 delay-500 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <p className="text-gray-500 text-sm">
            Trusted by developers, security professionals, and privacy advocates worldwide
          </p>
        </div>
      </div>
    </section>
  );
}
