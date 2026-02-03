/**
 * Animation Showcase
 *
 * Demo page showcasing all animation effects and components.
 * Useful for testing and documentation.
 */

'use client';

import React from 'react';
import {
  FadeIn,
  FadeInStagger,
  GradientText,
  PresetGradientText,
  GlowEffect,
  GridPattern,
  DotPattern,
  Spotlight,
  TypeWriter,
  RotatingTypeWriter,
  Counter,
  CounterGrid,
  PercentageCounter,
} from './index';

export function AnimationShowcase() {
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '3rem' }}>
        Tallow Animation Showcase
      </h1>

      {/* FadeIn Demos */}
      <Section title="FadeIn Animations">
        <Grid>
          <Demo title="Fade Up">
            <FadeIn direction="up">
              <Card>Fades in from bottom</Card>
            </FadeIn>
          </Demo>

          <Demo title="Fade Down">
            <FadeIn direction="down">
              <Card>Fades in from top</Card>
            </FadeIn>
          </Demo>

          <Demo title="Fade Left">
            <FadeIn direction="left">
              <Card>Fades in from right</Card>
            </FadeIn>
          </Demo>

          <Demo title="Fade Right">
            <FadeIn direction="right">
              <Card>Fades in from left</Card>
            </FadeIn>
          </Demo>
        </Grid>

        <Demo title="Staggered Animation">
          <FadeInStagger staggerDelay={100}>
            <Card>Item 1</Card>
            <Card>Item 2</Card>
            <Card>Item 3</Card>
            <Card>Item 4</Card>
          </FadeInStagger>
        </Demo>
      </Section>

      {/* GradientText Demos */}
      <Section title="Gradient Text">
        <Grid>
          <Demo title="Static Gradient">
            <GradientText
              colors={['#FF6B6B', '#4ECDC4', '#45B7D1']}
              fontSize="2rem"
            >
              Gradient Text
            </GradientText>
          </Demo>

          <Demo title="Animated Gradient">
            <GradientText
              colors={['#FF6B6B', '#4ECDC4', '#45B7D1']}
              animate
              fontSize="2rem"
            >
              Animated Gradient
            </GradientText>
          </Demo>
        </Grid>

        <Demo title="Preset Gradients">
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <PresetGradientText preset="sunset" fontSize="1.5rem">
              Sunset
            </PresetGradientText>
            <PresetGradientText preset="ocean" fontSize="1.5rem">
              Ocean
            </PresetGradientText>
            <PresetGradientText preset="forest" fontSize="1.5rem">
              Forest
            </PresetGradientText>
            <PresetGradientText preset="rainbow" fontSize="1.5rem" animate>
              Rainbow
            </PresetGradientText>
          </div>
        </Demo>
      </Section>

      {/* GlowEffect Demos */}
      <Section title="Glow Effects">
        <Grid>
          <Demo title="Static Glow">
            <div style={{ position: 'relative', padding: '2rem' }}>
              <GlowEffect color="#4ECDC4" intensity={30} opacity={0.5} />
              <Card>Content with glow</Card>
            </div>
          </Demo>

          <Demo title="Pulsing Glow">
            <div style={{ position: 'relative', padding: '2rem' }}>
              <GlowEffect
                color="#FF6B6B"
                intensity={40}
                opacity={0.6}
                pulse
              />
              <Card>Pulsing glow</Card>
            </div>
          </Demo>
        </Grid>
      </Section>

      {/* Pattern Demos */}
      <Section title="Background Patterns">
        <Grid>
          <Demo title="Grid Pattern">
            <div
              style={{
                position: 'relative',
                height: '200px',
                background: '#000',
                borderRadius: '8px',
              }}
            >
              <GridPattern strokeColor="#4ECDC4" fade />
            </div>
          </Demo>

          <Demo title="Dot Pattern">
            <div
              style={{
                position: 'relative',
                height: '200px',
                background: '#000',
                borderRadius: '8px',
              }}
            >
              <DotPattern color="#FF6B6B" spacing={30} fade />
            </div>
          </Demo>
        </Grid>
      </Section>

      {/* Spotlight Demo */}
      <Section title="Spotlight Effect">
        <Demo title="Mouse-Following Spotlight">
          <div
            style={{
              position: 'relative',
              height: '300px',
              background: '#000',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <Spotlight color="#4ECDC4" size={400} opacity={0.2} />
            <div style={{ color: '#fff', fontSize: '1.5rem', zIndex: 1 }}>
              Move your mouse here
            </div>
          </div>
        </Demo>
      </Section>

      {/* TypeWriter Demos */}
      <Section title="TypeWriter Effects">
        <Grid>
          <Demo title="Simple TypeWriter">
            <TypeWriter text="Welcome to Tallow!" speed={50} cursor />
          </Demo>

          <Demo title="Rotating Text">
            <div style={{ fontSize: '1.5rem' }}>
              <RotatingTypeWriter
                texts={['Fast', 'Secure', 'Private', 'Anonymous']}
                prefix="Tallow is "
                speed={50}
                deleteSpeed={30}
                pauseDuration={2000}
              />
            </div>
          </Demo>
        </Grid>
      </Section>

      {/* Counter Demos */}
      <Section title="Animated Counters">
        <Demo title="Statistics">
          <CounterGrid
            columns={4}
            gap="2rem"
            stats={[
              {
                value: 10000,
                label: 'Active Users',
                suffix: '+',
              },
              {
                value: 99.9,
                label: 'Uptime',
                suffix: '%',
                decimals: 1,
              },
              {
                value: 150,
                label: 'Countries',
              },
              {
                value: 1000000,
                label: 'Transfers',
                suffix: '+',
              },
            ]}
          />
        </Demo>

        <Grid>
          <Demo title="Percentage">
            <div style={{ fontSize: '2rem' }}>
              <PercentageCounter end={95.5} decimals={1} duration={2000} />
            </div>
          </Demo>

          <Demo title="Currency">
            <div style={{ fontSize: '2rem' }}>
              <Counter end={1250} prefix="$" separator="," duration={2000} />
            </div>
          </Demo>
        </Grid>
      </Section>

      {/* Combined Example */}
      <Section title="Combined Example: Hero Section">
        <div
          style={{
            position: 'relative',
            height: '500px',
            background: 'linear-gradient(to bottom, #000, #111)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            padding: '2rem',
          }}
        >
          {/* Background effects */}
          <GridPattern strokeColor="#333" opacity={0.3} fade />
          <GlowEffect color="#4ECDC4" position="top" intensity={60} />

          {/* Content */}
          <FadeIn direction="up" delay={200}>
            <GradientText
              colors={['#FF6B6B', '#4ECDC4', '#45B7D1']}
              fontSize="3rem"
              fontWeight="bold"
              animate
            >
              Welcome to Tallow
            </GradientText>
          </FadeIn>

          <FadeIn direction="up" delay={400}>
            <div
              style={{
                fontSize: '1.5rem',
                color: '#888',
                marginTop: '1rem',
              }}
            >
              <TypeWriter
                text="Secure • Private • Fast"
                speed={50}
                cursor
                startDelay={600}
              />
            </div>
          </FadeIn>

          <FadeIn direction="up" delay={800}>
            <div
              style={{
                marginTop: '2rem',
                display: 'flex',
                gap: '3rem',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                  <Counter end={10000} suffix="+" duration={2000} />
                </div>
                <div style={{ color: '#888' }}>Users</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                  <PercentageCounter end={99.9} decimals={1} duration={2000} />
                </div>
                <div style={{ color: '#888' }}>Uptime</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                  <Counter end={150} duration={2000} />
                </div>
                <div style={{ color: '#888' }}>Countries</div>
              </div>
            </div>
          </FadeIn>
        </div>
      </Section>
    </div>
  );
}

// Helper components for showcase

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: '4rem' }}>
      <h2
        style={{
          fontSize: '2rem',
          marginBottom: '2rem',
          borderBottom: '2px solid #333',
          paddingBottom: '0.5rem',
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function Demo({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: '2rem' }}>
      <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#666' }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}
    >
      {children}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: '1.5rem',
        background: '#1a1a1a',
        borderRadius: '8px',
        border: '1px solid #333',
      }}
    >
      {children}
    </div>
  );
}
