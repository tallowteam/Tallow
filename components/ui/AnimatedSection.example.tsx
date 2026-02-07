/**
 * AnimatedSection - Euveka-level Scroll Reveal Examples
 *
 * This file demonstrates all animation types and features.
 */

import { AnimatedSection } from './AnimatedSection';
import { Card } from './Card';

export function AnimatedSectionExamples() {
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>AnimatedSection Examples</h1>

      {/* ============================================
          Basic Animation Types
          ============================================ */}

      <section style={{ marginTop: '100vh' }}>
        <h2>1. Fade In Up (Default)</h2>
        <AnimatedSection animation="fadeInUp">
          <Card>
            <h3>Fade In Up</h3>
            <p>Fades in while sliding up from bottom. Most common pattern.</p>
          </Card>
        </AnimatedSection>
      </section>

      <section style={{ marginTop: '50vh' }}>
        <h2>2. Fade In Down</h2>
        <AnimatedSection animation="fadeInDown">
          <Card>
            <h3>Fade In Down</h3>
            <p>Fades in while sliding down from top.</p>
          </Card>
        </AnimatedSection>
      </section>

      <section style={{ marginTop: '50vh' }}>
        <h2>3. Fade In Left</h2>
        <AnimatedSection animation="fadeInLeft">
          <Card>
            <h3>Fade In Left</h3>
            <p>Fades in while sliding from right to left.</p>
          </Card>
        </AnimatedSection>
      </section>

      <section style={{ marginTop: '50vh' }}>
        <h2>4. Fade In Right</h2>
        <AnimatedSection animation="fadeInRight">
          <Card>
            <h3>Fade In Right</h3>
            <p>Fades in while sliding from left to right.</p>
          </Card>
        </AnimatedSection>
      </section>

      <section style={{ marginTop: '50vh' }}>
        <h2>5. Fade In Scale</h2>
        <AnimatedSection animation="fadeInScale">
          <Card>
            <h3>Fade In Scale</h3>
            <p>Fades in while scaling up from 0.95 to 1. Great for cards.</p>
          </Card>
        </AnimatedSection>
      </section>

      <section style={{ marginTop: '50vh' }}>
        <h2>6. Slide Up (No Fade)</h2>
        <AnimatedSection animation="slideUp">
          <Card>
            <h3>Slide Up</h3>
            <p>Pure slide animation without fade. Stays opaque.</p>
          </Card>
        </AnimatedSection>
      </section>

      <section style={{ marginTop: '50vh' }}>
        <h2>7. Blur Effect</h2>
        <AnimatedSection animation="blur">
          <Card>
            <h3>Blur</h3>
            <p>Fades in from blurred to clear. Premium effect.</p>
          </Card>
        </AnimatedSection>
      </section>

      {/* ============================================
          Staggered Children
          ============================================ */}

      <section style={{ marginTop: '100vh' }}>
        <h2>8. Staggered Children (Default 100ms delay)</h2>
        <AnimatedSection
          animation="fadeInUp"
          staggerChildren
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <Card><h3>Item 1</h3><p>Appears first</p></Card>
            <Card><h3>Item 2</h3><p>100ms delay</p></Card>
            <Card><h3>Item 3</h3><p>200ms delay</p></Card>
            <Card><h3>Item 4</h3><p>300ms delay</p></Card>
            <Card><h3>Item 5</h3><p>400ms delay</p></Card>
            <Card><h3>Item 6</h3><p>500ms delay</p></Card>
          </div>
        </AnimatedSection>
      </section>

      <section style={{ marginTop: '100vh' }}>
        <h2>9. Fast Stagger (50ms delay)</h2>
        <AnimatedSection
          animation="fadeInScale"
          staggerChildren
          staggerDelay={50}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <h3>Item {i + 1}</h3>
              </Card>
            ))}
          </div>
        </AnimatedSection>
      </section>

      <section style={{ marginTop: '100vh' }}>
        <h2>10. Slow Stagger (200ms delay)</h2>
        <AnimatedSection
          animation="fadeInLeft"
          staggerChildren
          staggerDelay={200}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Card><h3>First Item</h3><p>Appears immediately</p></Card>
            <Card><h3>Second Item</h3><p>200ms delay</p></Card>
            <Card><h3>Third Item</h3><p>400ms delay</p></Card>
            <Card><h3>Fourth Item</h3><p>600ms delay</p></Card>
          </div>
        </AnimatedSection>
      </section>

      {/* ============================================
          Custom Timing
          ============================================ */}

      <section style={{ marginTop: '100vh' }}>
        <h2>11. Custom Duration (Slow - 1.2s)</h2>
        <AnimatedSection
          animation="fadeInUp"
          duration={1.2}
        >
          <Card>
            <h3>Slow Animation</h3>
            <p>Takes 1.2 seconds to complete</p>
          </Card>
        </AnimatedSection>
      </section>

      <section style={{ marginTop: '50vh' }}>
        <h2>12. Custom Duration (Fast - 0.3s)</h2>
        <AnimatedSection
          animation="fadeInScale"
          duration={0.3}
        >
          <Card>
            <h3>Fast Animation</h3>
            <p>Takes only 0.3 seconds</p>
          </Card>
        </AnimatedSection>
      </section>

      <section style={{ marginTop: '50vh' }}>
        <h2>13. Custom Easing (Linear)</h2>
        <AnimatedSection
          animation="fadeInUp"
          easing="linear"
        >
          <Card>
            <h3>Linear Easing</h3>
            <p>Constant speed animation</p>
          </Card>
        </AnimatedSection>
      </section>

      <section style={{ marginTop: '50vh' }}>
        <h2>14. Custom Easing (Bounce)</h2>
        <AnimatedSection
          animation="fadeInScale"
          easing="cubic-bezier(0.68, -0.55, 0.265, 1.55)"
        >
          <Card>
            <h3>Bounce Easing</h3>
            <p>Playful bounce effect</p>
          </Card>
        </AnimatedSection>
      </section>

      <section style={{ marginTop: '50vh' }}>
        <h2>15. Initial Delay (500ms)</h2>
        <AnimatedSection
          animation="fadeInUp"
          delay={500}
        >
          <Card>
            <h3>Delayed Start</h3>
            <p>Waits 500ms before animating</p>
          </Card>
        </AnimatedSection>
      </section>

      {/* ============================================
          IntersectionObserver Options
          ============================================ */}

      <section style={{ marginTop: '100vh' }}>
        <h2>16. High Threshold (0.8)</h2>
        <AnimatedSection
          animation="fadeInUp"
          threshold={0.8}
        >
          <Card>
            <h3>High Threshold</h3>
            <p>Animates only when 80% visible</p>
          </Card>
        </AnimatedSection>
      </section>

      <section style={{ marginTop: '50vh' }}>
        <h2>17. Custom Root Margin</h2>
        <AnimatedSection
          animation="fadeInUp"
          rootMargin="0px 0px -200px 0px"
        >
          <Card>
            <h3>Custom Root Margin</h3>
            <p>Triggers 200px before entering viewport</p>
          </Card>
        </AnimatedSection>
      </section>

      <section style={{ marginTop: '50vh' }}>
        <h2>18. Trigger Every Time (triggerOnce=false)</h2>
        <AnimatedSection
          animation="fadeInScale"
          triggerOnce={false}
        >
          <Card>
            <h3>Repeating Animation</h3>
            <p>Animates every time you scroll past. Scroll up and down to see.</p>
          </Card>
        </AnimatedSection>
      </section>

      {/* ============================================
          Advanced Combinations
          ============================================ */}

      <section style={{ marginTop: '100vh' }}>
        <h2>19. Complex Feature Grid</h2>
        <AnimatedSection
          animation="fadeInUp"
          staggerChildren
          staggerDelay={150}
          duration={0.8}
          threshold={0.2}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            <Card>
              <h3>🚀 Fast Transfer</h3>
              <p>Peer-to-peer connection for maximum speed</p>
            </Card>
            <Card>
              <h3>🔒 Secure</h3>
              <p>End-to-end encryption protects your data</p>
            </Card>
            <Card>
              <h3>🌐 Cross-Platform</h3>
              <p>Works on desktop, mobile, and web</p>
            </Card>
            <Card>
              <h3>📁 Any File Type</h3>
              <p>Transfer documents, images, videos, and more</p>
            </Card>
            <Card>
              <h3>💪 No Limits</h3>
              <p>Send files of any size without restrictions</p>
            </Card>
            <Card>
              <h3>🎯 Simple</h3>
              <p>Just drag, drop, and share</p>
            </Card>
          </div>
        </AnimatedSection>
      </section>

      <section style={{ marginTop: '100vh' }}>
        <h2>20. Hero Section with Stagger</h2>
        <AnimatedSection
          animation="fadeInUp"
          staggerChildren
          staggerDelay={200}
          as="section"
        >
          <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
            Welcome to Tallow
          </h1>
          <p style={{ fontSize: '1.5rem', marginBottom: '2rem', color: '#666' }}>
            Secure, fast, peer-to-peer file sharing
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button style={{ padding: '1rem 2rem', fontSize: '1rem' }}>Get Started</button>
            <button style={{ padding: '1rem 2rem', fontSize: '1rem' }}>Learn More</button>
          </div>
        </AnimatedSection>
      </section>

      {/* ============================================
          Render As Different Elements
          ============================================ */}

      <section style={{ marginTop: '100vh' }}>
        <h2>21. Render as Section</h2>
        <AnimatedSection animation="fadeInUp" as="section">
          <Card>
            <h3>Semantic HTML</h3>
            <p>Rendered as a section element</p>
          </Card>
        </AnimatedSection>
      </section>

      <section style={{ marginTop: '50vh' }}>
        <h2>22. Render as Article</h2>
        <AnimatedSection animation="fadeInLeft" as="article">
          <Card>
            <h3>Article Element</h3>
            <p>Better for SEO and accessibility</p>
          </Card>
        </AnimatedSection>
      </section>

      {/* ============================================
          No Animation
          ============================================ */}

      <section style={{ marginTop: '100vh' }}>
        <h2>23. No Animation (Instant)</h2>
        <AnimatedSection animation="none">
          <Card>
            <h3>Instant Appearance</h3>
            <p>No animation, appears immediately. Useful for critical content.</p>
          </Card>
        </AnimatedSection>
      </section>

      <div style={{ height: '100vh' }} />
    </div>
  );
}

/* ============================================
   Usage Patterns
   ============================================ */

// Pattern 1: Simple fade in
export function SimpleExample() {
  return (
    <AnimatedSection>
      <h1>Content appears with default fade up</h1>
    </AnimatedSection>
  );
}

// Pattern 2: Feature grid with stagger
export function FeatureGrid() {
  return (
    <AnimatedSection animation="fadeInScale" staggerChildren staggerDelay={100}>
      <div className="grid">
        <Card>Feature 1</Card>
        <Card>Feature 2</Card>
        <Card>Feature 3</Card>
      </div>
    </AnimatedSection>
  );
}

// Pattern 3: Hero section
export function HeroSection() {
  return (
    <AnimatedSection
      animation="fadeInUp"
      staggerChildren
      staggerDelay={200}
      duration={0.8}
    >
      <h1>Hero Title</h1>
      <p>Hero description</p>
      <button>CTA Button</button>
    </AnimatedSection>
  );
}

// Pattern 4: Alternating content
export function AlternatingContent() {
  return (
    <>
      <AnimatedSection animation="fadeInLeft">
        <div>Content from left</div>
      </AnimatedSection>

      <AnimatedSection animation="fadeInRight">
        <div>Content from right</div>
      </AnimatedSection>

      <AnimatedSection animation="fadeInLeft">
        <div>Content from left again</div>
      </AnimatedSection>
    </>
  );
}

// Pattern 5: Premium blur effect
export function PremiumSection() {
  return (
    <AnimatedSection
      animation="blur"
      duration={1}
      threshold={0.3}
    >
      <div className="premium-content">
        <h2>Premium Feature</h2>
        <p>Blurs in smoothly</p>
      </div>
    </AnimatedSection>
  );
}

// Pattern 6: Fast micro-interactions
export function FastCards() {
  return (
    <AnimatedSection
      animation="fadeInScale"
      staggerChildren
      staggerDelay={50}
      duration={0.3}
    >
      <div className="card-grid">
        {['Item 1', 'Item 2', 'Item 3', 'Item 4'].map(item => (
          <Card key={item}>{item}</Card>
        ))}
      </div>
    </AnimatedSection>
  );
}

// Pattern 7: Scroll-triggered sections
export function LongFormContent() {
  return (
    <>
      <AnimatedSection animation="fadeInUp">
        <section>Section 1</section>
      </AnimatedSection>

      <AnimatedSection animation="fadeInUp" delay={100}>
        <section>Section 2</section>
      </AnimatedSection>

      <AnimatedSection animation="fadeInUp" delay={200}>
        <section>Section 3</section>
      </AnimatedSection>
    </>
  );
}

export default AnimatedSectionExamples;
