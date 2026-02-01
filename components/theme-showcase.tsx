'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

/**
 * Theme Showcase Component
 *
 * Visual testing component to verify all theme modes display correctly.
 * Use this during development to ensure consistent theming across components.
 *
 * Usage:
 * ```tsx
 * import { ThemeShowcase } from '@/components/theme-showcase';
 *
 * export default function TestPage() {
 *   return <ThemeShowcase />;
 * }
 * ```
 */
export function ThemeShowcase() {
  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="space-y-2">
        <h1 className="display-md">Theme Showcase</h1>
        <p className="text-muted-foreground">
          Visual testing for all theme modes and color combinations
        </p>
      </div>

      {/* Color Swatches */}
      <section className="space-y-4">
        <h2 className="heading-lg">Color Palette</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ColorSwatch
            name="Background"
            className="bg-background text-foreground"
          />
          <ColorSwatch
            name="Card"
            className="bg-card text-card-foreground border border-border"
          />
          <ColorSwatch
            name="Primary"
            className="bg-primary text-primary-foreground"
          />
          <ColorSwatch
            name="Secondary"
            className="bg-secondary text-secondary-foreground"
          />
          <ColorSwatch
            name="Muted"
            className="bg-muted text-muted-foreground"
          />
          <ColorSwatch
            name="Accent"
            className="bg-accent text-accent-foreground"
          />
          <ColorSwatch
            name="Destructive"
            className="bg-destructive text-destructive-foreground"
          />
          <ColorSwatch
            name="Success"
            className="bg-success text-success-foreground"
          />
          <ColorSwatch
            name="Warning"
            className="bg-warning text-warning-foreground"
          />
          <ColorSwatch
            name="Info"
            className="bg-info text-info-foreground"
          />
        </div>
      </section>

      {/* Typography */}
      <section className="space-y-4">
        <h2 className="heading-lg">Typography</h2>
        <div className="space-y-4 bg-card text-card-foreground rounded-xl p-6 border border-border">
          <h1 className="display-xl">Display XL</h1>
          <h2 className="display-lg">Display Large</h2>
          <h3 className="display-md">Display Medium</h3>
          <h4 className="display-sm">Display Small</h4>
          <h2 className="heading-xl">Heading XL</h2>
          <h3 className="heading-lg">Heading Large</h3>
          <h4 className="heading-md">Heading Medium</h4>
          <h5 className="heading-sm">Heading Small</h5>
          <p className="body-xl">Body XL - Large body text for emphasis</p>
          <p className="body-lg">Body Large - Secondary body text</p>
          <p className="body-md">Body Medium - Standard body text</p>
          <p className="text-muted-foreground">Muted text - Secondary information</p>
          <p className="label">Label Text</p>
          <p className="label-lg">Label Large</p>
        </div>
      </section>

      {/* Buttons */}
      <section className="space-y-4">
        <h2 className="heading-lg">Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="default">Default Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="outline">Outline Button</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="destructive">Destructive Button</Button>
          <Button variant="default" disabled>Disabled Button</Button>
        </div>
        <div className="flex flex-wrap gap-4">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon">
            <span>⚙</span>
          </Button>
        </div>
      </section>

      {/* Form Elements */}
      <section className="space-y-4">
        <h2 className="heading-lg">Form Elements</h2>
        <div className="bg-card text-card-foreground rounded-xl p-6 border border-border space-y-4">
          <div className="space-y-2">
            <label htmlFor="text-input" className="label-lg">Text Input</label>
            <Input
              id="text-input"
              type="text"
              placeholder="Enter text here..."
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="email-input" className="label-lg">Email Input</label>
            <Input
              id="email-input"
              type="email"
              placeholder="email@example.com"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="disabled-input" className="label-lg">Disabled Input</label>
            <Input
              id="disabled-input"
              type="text"
              placeholder="Disabled"
              disabled
            />
          </div>
        </div>
      </section>

      {/* Cards */}
      <section className="space-y-4">
        <h2 className="heading-lg">Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="p-6 space-y-2 hover-lift">
            <h3 className="font-semibold">Standard Card</h3>
            <p className="text-sm text-muted-foreground">
              This is a standard card with hover effect
            </p>
            <Button size="sm">Action</Button>
          </Card>

          <div className="card-feature space-y-2">
            <h3 className="font-semibold">Feature Card</h3>
            <p className="text-sm text-muted-foreground">
              Feature card with custom styling
            </p>
            <Button size="sm" variant="outline">Learn More</Button>
          </div>

          <div className="card-dark space-y-2">
            <h3 className="font-semibold">Dark Card</h3>
            <p className="text-sm text-hero-muted">
              Inverted dark card (dark in light, light in dark)
            </p>
            <Button size="sm" variant="outline">Explore</Button>
          </div>
        </div>
      </section>

      {/* Badges */}
      <section className="space-y-4">
        <h2 className="heading-lg">Badges</h2>
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge className="bg-success text-success-foreground">Success</Badge>
          <Badge className="bg-warning text-warning-foreground">Warning</Badge>
          <Badge className="bg-info text-info-foreground">Info</Badge>
        </div>
      </section>

      {/* Interactive States */}
      <section className="space-y-4">
        <h2 className="heading-lg">Interactive States</h2>
        <div className="bg-card text-card-foreground rounded-xl p-6 border border-border space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Hover States</h3>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-85 transition">
                Hover Me
              </button>
              <div className="px-4 py-2 bg-card border border-border rounded hover-lift cursor-pointer">
                Lift Effect
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Focus States</h3>
            <Button className="focus-visible">Tab to Focus</Button>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Status Indicators</h3>
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <div className="status-online" />
                <span className="text-sm">Online</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="accent-dot" />
                <span className="text-sm">Accent</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contrast Testing Grid */}
      <section className="space-y-4">
        <h2 className="heading-lg">Contrast Testing</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ContrastTest
            title="Foreground on Background"
            className="bg-background text-foreground"
            text="Main text should have excellent contrast"
          />
          <ContrastTest
            title="Muted on Background"
            className="bg-background text-muted-foreground"
            text="Muted text should still be readable"
          />
          <ContrastTest
            title="Primary Foreground on Primary"
            className="bg-primary text-primary-foreground"
            text="Primary button text should be crisp"
          />
          <ContrastTest
            title="Accent Foreground on Accent"
            className="bg-accent text-accent-foreground"
            text="Accent text should pop"
          />
        </div>
      </section>

      {/* Gradients */}
      <section className="space-y-4">
        <h2 className="heading-lg">Gradients</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="peach-gradient p-8 rounded-xl">
            <h3 className="font-semibold text-foreground">Peach Gradient</h3>
            <p className="text-sm text-muted-foreground">Warm, inviting</p>
          </div>
          <div className="blue-gradient p-8 rounded-xl">
            <h3 className="font-semibold text-foreground">Blue Gradient</h3>
            <p className="text-sm text-muted-foreground">Cool, professional</p>
          </div>
          <div className="purple-gradient p-8 rounded-xl">
            <h3 className="font-semibold text-foreground">Purple Gradient</h3>
            <p className="text-sm text-muted-foreground">Creative, elegant</p>
          </div>
        </div>
      </section>

      {/* Borders and Dividers */}
      <section className="space-y-4">
        <h2 className="heading-lg">Borders & Dividers</h2>
        <div className="bg-card p-6 rounded-xl border border-border space-y-4">
          <p>Content above divider</p>
          <div className="divider" />
          <p>Content below divider</p>
          <div className="h-px bg-border" />
          <p className="text-muted-foreground">More content</p>
        </div>
      </section>

      {/* Shadows */}
      <section className="space-y-4">
        <h2 className="heading-lg">Shadows</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-card p-4 rounded-lg" style={{ boxShadow: 'var(--shadow-xs)' }}>
            <p className="text-sm font-medium">XS</p>
          </div>
          <div className="bg-card p-4 rounded-lg" style={{ boxShadow: 'var(--shadow-sm)' }}>
            <p className="text-sm font-medium">SM</p>
          </div>
          <div className="bg-card p-4 rounded-lg" style={{ boxShadow: 'var(--shadow-md)' }}>
            <p className="text-sm font-medium">MD</p>
          </div>
          <div className="bg-card p-4 rounded-lg" style={{ boxShadow: 'var(--shadow-lg)' }}>
            <p className="text-sm font-medium">LG</p>
          </div>
          <div className="bg-card p-4 rounded-lg" style={{ boxShadow: 'var(--shadow-xl)' }}>
            <p className="text-sm font-medium">XL</p>
          </div>
        </div>
      </section>

      {/* Testing Instructions */}
      <section className="bg-muted rounded-xl p-6 space-y-4">
        <h2 className="heading-lg">Testing Instructions</h2>
        <div className="space-y-2 text-sm">
          <p className="font-semibold">How to test all theme modes:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Click the theme switcher in the header</li>
            <li>Select each theme mode: Light, Dark, HC Light, HC Dark</li>
            <li>Verify all elements are visible and readable</li>
            <li>Check focus indicators by tabbing through</li>
            <li>Test hover states on interactive elements</li>
            <li>Verify contrast ratios meet requirements</li>
          </ol>
        </div>
      </section>
    </div>
  );
}

function ColorSwatch({ name, className }: { name: string; className: string }) {
  return (
    <div className={`${className} rounded-lg p-6 flex items-center justify-center`}>
      <span className="font-semibold text-sm">{name}</span>
    </div>
  );
}

function ContrastTest({ title, className, text }: { title: string; className: string; text: string }) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-muted-foreground">{title}</h4>
      <div className={`${className} p-6 rounded-lg border border-border`}>
        <p className="text-sm">{text}</p>
      </div>
    </div>
  );
}
