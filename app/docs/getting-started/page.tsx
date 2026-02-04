'use client';

import { Container, Section } from '@/components/layout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import CodeBlock from '@/components/docs/CodeBlock';
import DocsSidebar from '@/components/docs/DocsSidebar';
import styles from './page.module.css';

export default function GettingStartedPage() {
  return (
    <div className={styles.page}>
      <DocsSidebar />

      <main className={styles.content}>
        <Container>
          <Section>
            <h1 className={styles.title}>Getting Started</h1>
            <p className={styles.intro}>
              Learn how to set up and start using Tallow components in your project.
            </p>

            {/* Installation */}
            <h2 className={styles.sectionTitle}>Installation</h2>
            <p className={styles.text}>
              Tallow components are available as part of the main application. Simply import the components you need in your files.
            </p>

            <CodeBlock
              language="bash"
              code={`npm install
# or
yarn install
# or
pnpm install`}
              title="Install dependencies"
            />

            {/* Basic Setup */}
            <h2 className={styles.sectionTitle}>Basic Setup</h2>
            <p className={styles.text}>
              Make sure your application includes the global styles. These are already configured in the main layout.
            </p>

            <CodeBlock
              language="tsx"
              code={`import '@/app/globals.css';

export default function Layout({ children }) {
  return (
    <html>
      <body>
        {children}
      </body>
    </html>
  );
}`}
              title="app/layout.tsx"
            />

            {/* Importing Components */}
            <h2 className={styles.sectionTitle}>Importing Components</h2>
            <p className={styles.text}>
              Import components from the appropriate directories:
            </p>

            <CodeBlock
              language="tsx"
              code={`// UI Components
import { Button, Card, Input, Badge } from '@/components/ui';

// Layout Components
import { Container, Section, Grid, Stack } from '@/components/layout';

// Feedback Components
import { Toast, Spinner } from '@/components/feedback';

// Navigation
import { Tabs, Breadcrumb } from '@/components/navigation';`}
              title="Component imports"
            />

            {/* First Component */}
            <h2 className={styles.sectionTitle}>Using Your First Component</h2>
            <p className={styles.text}>
              Here's a simple example using the Button component:
            </p>

            <CodeBlock
              language="tsx"
              code={`'use client';

import { Button } from '@/components/ui';

export default function HomePage() {
  return (
    <div>
      <h1>Welcome to Tallow</h1>
      <Button
        variant="primary"
        size="lg"
        onClick={() => console.log('Clicked!')}
      >
        Click Me
      </Button>
    </div>
  );
}`}
              title="Basic Button Usage"
            />

            {/* Component Variants */}
            <h2 className={styles.sectionTitle}>Component Variants</h2>
            <p className={styles.text}>
              Most components support multiple variants and sizes:
            </p>

            <CodeBlock
              language="tsx"
              code={`<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="danger">Danger</Button>

<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

<Button fullWidth>Full Width</Button>
<Button loading>Loading...</Button>
<Button disabled>Disabled</Button>`}
              title="Button Variants"
            />

            {/* Layout Example */}
            <h2 className={styles.sectionTitle}>Layout Pattern</h2>
            <p className={styles.text}>
              Use layout components to structure your pages:
            </p>

            <CodeBlock
              language="tsx"
              code={`import { Container, Section, Grid } from '@/components/layout';
import { Button, Card } from '@/components/ui';

export default function Page() {
  return (
    <Section>
      <Container>
        <h1>My Page</h1>

        <Grid columns={2} gap={4}>
          <Card>
            <h2>Card 1</h2>
            <p>Content goes here</p>
          </Card>

          <Card>
            <h2>Card 2</h2>
            <p>Content goes here</p>
          </Card>
        </Grid>
      </Container>
    </Section>
  );
}`}
              title="Layout Pattern"
            />

            {/* Form Example */}
            <h2 className={styles.sectionTitle}>Form Example</h2>
            <p className={styles.text}>
              Building forms with Tallow components:
            </p>

            <CodeBlock
              language="tsx"
              code={`'use client';

import { useState } from 'react';
import { Input, Button } from '@/components/ui';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card';

export default function FormPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Handle form submission

    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <h2>Sign Up</h2>
      </CardHeader>

      <CardBody>
        <form onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
          />
        </form>
      </CardBody>

      <CardFooter>
        <Button
          type="submit"
          loading={loading}
          fullWidth
        >
          Submit
        </Button>
      </CardFooter>
    </Card>
  );
}`}
              title="Form Example"
            />

            {/* Best Practices */}
            <h2 className={styles.sectionTitle}>Best Practices</h2>
            <div className={styles.bestPractices}>
              <Card>
                <CardHeader>
                  <h3 className={styles.practiceTitle}>Use Client Components for Interactivity</h3>
                </CardHeader>
                <CardBody>
                  <p>Add 'use client' at the top of components using hooks or event handlers.</p>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className={styles.practiceTitle}>Leverage TypeScript</h3>
                </CardHeader>
                <CardBody>
                  <p>All components have full TypeScript support with proper type definitions.</p>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className={styles.practiceTitle}>Follow Semantic HTML</h3>
                </CardHeader>
                <CardBody>
                  <p>Components use semantic HTML for better accessibility and SEO.</p>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className={styles.practiceTitle}>Use Design Tokens</h3>
                </CardHeader>
                <CardBody>
                  <p>Utilize CSS custom properties from the design system instead of hardcoding values.</p>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className={styles.practiceTitle}>Responsive Design</h3>
                </CardHeader>
                <CardBody>
                  <p>All components are mobile-first and fully responsive by default.</p>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className={styles.practiceTitle}>Accessibility</h3>
                </CardHeader>
                <CardBody>
                  <p>Components include ARIA labels and keyboard navigation support.</p>
                </CardBody>
              </Card>
            </div>

            {/* Next Steps */}
            <h2 className={styles.sectionTitle}>Next Steps</h2>
            <div className={styles.nextSteps}>
              <ol className={styles.stepsList}>
                <li>
                  <strong>Explore Components:</strong> Visit the{' '}
                  <a href="/docs/components">component library</a> to see all available components.
                </li>
                <li>
                  <strong>Learn Design System:</strong> Review{' '}
                  <a href="/docs/design-system">design tokens</a> for colors, spacing, and typography.
                </li>
                <li>
                  <strong>Check Examples:</strong> Look at real-world examples in each component page.
                </li>
                <li>
                  <strong>Build:</strong> Start building your application using Tallow components.
                </li>
              </ol>
            </div>

            {/* Resources */}
            <h2 className={styles.sectionTitle}>Resources</h2>
            <div className={styles.resources}>
              <div className={styles.resource}>
                <h4>Documentation</h4>
                <p>Complete API documentation and examples</p>
              </div>
              <div className={styles.resource}>
                <h4>GitHub</h4>
                <p>Source code and contribution guidelines</p>
              </div>
              <div className={styles.resource}>
                <h4>Component Library</h4>
                <p>Browse and preview all components</p>
              </div>
              <div className={styles.resource}>
                <h4>Design System</h4>
                <p>Colors, typography, and design tokens</p>
              </div>
            </div>
          </Section>
        </Container>
      </main>
    </div>
  );
}
