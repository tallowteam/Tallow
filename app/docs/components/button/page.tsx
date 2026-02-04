'use client';

import { Container, Section } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import CodeBlock from '@/components/docs/CodeBlock';
import ComponentPreview from '@/components/docs/ComponentPreview';
import PropsTable from '@/components/docs/PropsTable';
import DocsSidebar from '@/components/docs/DocsSidebar';
import styles from './page.module.css';

export default function ButtonComponentPage() {
  const buttonProps = [
    {
      name: 'variant',
      type: '"primary" | "secondary" | "ghost" | "danger" | "icon"',
      required: false,
      default: '"primary"',
      description: 'Visual style variant of the button',
    },
    {
      name: 'size',
      type: '"sm" | "md" | "lg"',
      required: false,
      default: '"md"',
      description: 'Button size',
    },
    {
      name: 'loading',
      type: 'boolean',
      required: false,
      default: 'false',
      description: 'Show loading spinner inside button',
    },
    {
      name: 'disabled',
      type: 'boolean',
      required: false,
      default: 'false',
      description: 'Disable button interactions',
    },
    {
      name: 'fullWidth',
      type: 'boolean',
      required: false,
      default: 'false',
      description: 'Make button full width of container',
    },
    {
      name: 'children',
      type: 'ReactNode',
      required: true,
      description: 'Button content/label',
    },
    {
      name: 'onClick',
      type: '(event: React.MouseEvent) => void',
      required: false,
      description: 'Click event handler',
    },
  ];

  return (
    <div className={styles.page}>
      <DocsSidebar />

      <main className={styles.content}>
        <Container>
          <Section>
            <div className={styles.header}>
              <h1 className={styles.title}>Button Component</h1>
              <p className={styles.subtitle}>
                Interactive button component with multiple variants and states
              </p>
            </div>

            {/* Overview */}
            <h2 className={styles.sectionTitle}>Overview</h2>
            <p className={styles.text}>
              The Button component is the primary interaction element in Tallow. It supports multiple variants,
              sizes, and states to accommodate different use cases and visual hierarchies.
            </p>

            {/* Basic Usage */}
            <h2 className={styles.sectionTitle}>Basic Usage</h2>
            <ComponentPreview
              title="Basic Button"
              description="Simple button with default styling"
            >
              <Button>Click Me</Button>
            </ComponentPreview>

            <CodeBlock
              language="tsx"
              code={`import { Button } from '@/components/ui';

export default function Page() {
  return <Button>Click Me</Button>;
}`}
            />

            {/* Variants */}
            <h2 className={styles.sectionTitle}>Variants</h2>
            <p className={styles.text}>
              Buttons come in multiple visual variants to support different contexts and emphasis levels.
            </p>

            <ComponentPreview
              title="Button Variants"
              description="All available button variants"
            >
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
            </ComponentPreview>

            <CodeBlock
              language="tsx"
              code={`<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="danger">Danger</Button>`}
            />

            {/* Sizes */}
            <h2 className={styles.sectionTitle}>Sizes</h2>
            <p className={styles.text}>
              Choose button size based on layout and importance.
            </p>

            <ComponentPreview
              title="Button Sizes"
              description="Available button sizes"
            >
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </ComponentPreview>

            <CodeBlock
              language="tsx"
              code={`<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>`}
            />

            {/* States */}
            <h2 className={styles.sectionTitle}>States</h2>
            <p className={styles.text}>
              Buttons support loading and disabled states for user feedback.
            </p>

            <ComponentPreview
              title="Button States"
              description="Loading and disabled states"
            >
              <Button loading>Loading</Button>
              <Button disabled>Disabled</Button>
            </ComponentPreview>

            <CodeBlock
              language="tsx"
              code={`<Button loading>Loading...</Button>
<Button disabled>Disabled</Button>`}
            />

            {/* Full Width */}
            <h2 className={styles.sectionTitle}>Full Width</h2>
            <p className={styles.text}>
              Use fullWidth prop to make button span container width.
            </p>

            <ComponentPreview
              title="Full Width Button"
              description="Button spanning full container width"
            >
              <div style={{ width: '100%', maxWidth: '300px' }}>
                <Button fullWidth>Submit Form</Button>
              </div>
            </ComponentPreview>

            <CodeBlock
              language="tsx"
              code={`<Button fullWidth>Submit Form</Button>`}
            />

            {/* Props */}
            <h2 className={styles.sectionTitle}>Props</h2>
            <PropsTable props={buttonProps} />

            {/* Examples */}
            <h2 className={styles.sectionTitle}>Usage Examples</h2>

            <Card>
              <CardHeader>
                <h3 className={styles.exampleTitle}>Form Submission</h3>
              </CardHeader>
              <CardBody>
                <CodeBlock
                  language="tsx"
                  code={`'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';

export default function Form() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Handle form submission
    await new Promise(resolve => setTimeout(resolve, 1000));

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <Button type="submit" loading={loading} fullWidth>
        {loading ? 'Submitting...' : 'Submit'}
      </Button>
    </form>
  );
}`}
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3 className={styles.exampleTitle}>Action Buttons</h3>
              </CardHeader>
              <CardBody>
                <CodeBlock
                  language="tsx"
                  code={`import { Button } from '@/components/ui';

export default function ActionButtons() {
  return (
    <div style={{ display: 'flex', gap: '1rem' }}>
      <Button variant="primary" onClick={() => save()}>
        Save
      </Button>
      <Button variant="secondary" onClick={() => cancel()}>
        Cancel
      </Button>
      <Button variant="danger" onClick={() => delete()}>
        Delete
      </Button>
    </div>
  );
}`}
                />
              </CardBody>
            </Card>

            {/* Best Practices */}
            <h2 className={styles.sectionTitle}>Best Practices</h2>
            <div className={styles.bestPractices}>
              <Card>
                <CardHeader>
                  <h3 className={styles.practiceTitle}>Use Appropriate Variants</h3>
                </CardHeader>
                <CardBody>
                  <p>
                    Use primary for main actions, secondary for secondary actions, and ghost for tertiary actions.
                  </p>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className={styles.practiceTitle}>Provide Loading Feedback</h3>
                </CardHeader>
                <CardBody>
                  <p>
                    Always show loading state during async operations to prevent multiple submissions.
                  </p>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className={styles.practiceTitle}>Clear Action Text</h3>
                </CardHeader>
                <CardBody>
                  <p>
                    Use descriptive action text like "Save Changes" or "Delete User" instead of just "OK".
                  </p>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className={styles.practiceTitle}>Size Appropriately</h3>
                </CardHeader>
                <CardBody>
                  <p>
                    Use larger buttons for important actions and smaller buttons for secondary or tertiary actions.
                  </p>
                </CardBody>
              </Card>
            </div>

            {/* Related Components */}
            <h2 className={styles.sectionTitle}>Related Components</h2>
            <div className={styles.relatedGrid}>
              <Card>
                <CardHeader>
                  <h3>IconButton</h3>
                </CardHeader>
                <CardBody>
                  <p>Button displaying only an icon</p>
                </CardBody>
              </Card>
              <Card>
                <CardHeader>
                  <h3>ButtonGroup</h3>
                </CardHeader>
                <CardBody>
                  <p>Group related buttons together</p>
                </CardBody>
              </Card>
              <Card>
                <CardHeader>
                  <h3>Link</h3>
                </CardHeader>
                <CardBody>
                  <p>Link styled as a button</p>
                </CardBody>
              </Card>
            </div>
          </Section>
        </Container>
      </main>
    </div>
  );
}
