'use client';

import { useState } from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Input,
  Badge,
  Modal,
  ModalFooter,
  Tooltip,
  Spinner,
} from '@/components/ui';
import styles from './page.module.css';

export default function DesignSystemPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    if (!inputValue) {
      setInputError('This field is required');
      return;
    }
    setInputError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setIsModalOpen(false);
    }, 2000);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Tallow Design System</h1>
        <p className={styles.subtitle}>
          Production-ready React components built with Next.js 16 and React 19
        </p>
      </header>

      <main className={styles.main}>
        {/* Buttons Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Buttons</h2>
          <div className={styles.showcase}>
            <div className={styles.row}>
              <Button variant="primary">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="danger">Danger Button</Button>
            </div>
            <div className={styles.row}>
              <Button variant="primary" size="sm">
                Small
              </Button>
              <Button variant="primary" size="md">
                Medium
              </Button>
              <Button variant="primary" size="lg">
                Large
              </Button>
            </div>
            <div className={styles.row}>
              <Button variant="primary" loading>
                Loading...
              </Button>
              <Button variant="primary" disabled>
                Disabled
              </Button>
              <Button variant="icon" aria-label="Settings">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                >
                  <circle cx="10" cy="10" r="3" strokeWidth="2" />
                  <path
                    d="M10 1v2m0 14v2M18.66 5l-1.73 1M3.07 14l-1.73 1M19 10h-2M3 10H1m15.66 5l-1.73-1M3.07 6l-1.73-1"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </Button>
            </div>
          </div>
        </section>

        {/* Cards Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Cards</h2>
          <div className={styles.cardGrid}>
            <Card variant="default">
              <CardHeader>
                <h3 className={styles.cardTitle}>Default Card</h3>
              </CardHeader>
              <CardBody>
                <p className={styles.cardText}>
                  This is a default card variant with standard styling for most
                  use cases.
                </p>
              </CardBody>
              <CardFooter>
                <Button variant="ghost" size="sm">
                  Cancel
                </Button>
                <Button variant="primary" size="sm">
                  Continue
                </Button>
              </CardFooter>
            </Card>

            <Card variant="highlighted">
              <CardHeader>
                <h3 className={styles.cardTitle}>Highlighted Card</h3>
              </CardHeader>
              <CardBody>
                <p className={styles.cardText}>
                  This card has a highlighted border to draw attention to
                  important content.
                </p>
              </CardBody>
            </Card>

            <Card variant="interactive">
              <CardBody>
                <h3 className={styles.cardTitle}>Interactive Card</h3>
                <p className={styles.cardText}>
                  Click or hover over this card to see interactive effects.
                </p>
              </CardBody>
            </Card>
          </div>
        </section>

        {/* Inputs Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Inputs</h2>
          <div className={styles.inputGrid}>
            <Input label="Email address" type="email" placeholder="you@example.com" />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              helperText="Must be at least 8 characters"
            />
            <Input
              label="Search"
              placeholder="Search files..."
              leadingIcon={
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                >
                  <circle cx="7" cy="7" r="4" strokeWidth="2" />
                  <path d="M10 10l3 3" strokeWidth="2" strokeLinecap="round" />
                </svg>
              }
            />
            <Input
              label="Amount"
              placeholder="0.00"
              trailingIcon={<span style={{ fontSize: '0.875rem' }}>USD</span>}
            />
            <Input
              label="Invalid field"
              placeholder="Enter value"
              error="This field contains an error"
            />
            <Input label="Disabled" placeholder="Cannot edit" disabled />
          </div>
        </section>

        {/* Badges Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Badges</h2>
          <div className={styles.row}>
            <Badge variant="primary">Primary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="danger">Danger</Badge>
            <Badge variant="neutral">Neutral</Badge>
          </div>
          <div className={styles.row}>
            <Badge variant="primary" showDot>
              Online
            </Badge>
            <Badge variant="success" showDot>
              Active
            </Badge>
            <Badge variant="warning" showDot>
              Pending
            </Badge>
            <Badge variant="danger" showDot>
              Offline
            </Badge>
          </div>
        </section>

        {/* Tooltips Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Tooltips</h2>
          <div className={styles.row}>
            <Tooltip content="This tooltip appears on top" position="top">
              <Button variant="secondary">Top</Button>
            </Tooltip>
            <Tooltip content="This tooltip appears on bottom" position="bottom">
              <Button variant="secondary">Bottom</Button>
            </Tooltip>
            <Tooltip content="This tooltip appears on left" position="left">
              <Button variant="secondary">Left</Button>
            </Tooltip>
            <Tooltip content="This tooltip appears on right" position="right">
              <Button variant="secondary">Right</Button>
            </Tooltip>
            <Tooltip
              content="Tooltips can have longer text that wraps to multiple lines when needed"
              position="top"
            >
              <Button variant="secondary">Long Content</Button>
            </Tooltip>
          </div>
        </section>

        {/* Spinners Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Spinners</h2>
          <div className={styles.row}>
            <Spinner size="sm" />
            <Spinner size="md" />
            <Spinner size="lg" />
          </div>
          <div className={styles.row}>
            <Spinner variant="primary" />
            <Spinner variant="white" />
            <Spinner variant="neutral" />
          </div>
        </section>

        {/* Modal Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Modal</h2>
          <div className={styles.row}>
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
              Open Modal
            </Button>
          </div>
        </section>

        {/* Color Palette */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Color Palette</h2>
          <div className={styles.colorGrid}>
            <div className={styles.colorSwatch}>
              <div
                className={styles.color}
                style={{ background: 'linear-gradient(135deg, #0070f3 0%, #7c3aed 100%)' }}
              />
              <span className={styles.colorLabel}>Brand Gradient</span>
            </div>
            <div className={styles.colorSwatch}>
              <div className={styles.color} style={{ background: '#0a0a0a' }} />
              <span className={styles.colorLabel}>Neutral 950</span>
            </div>
            <div className={styles.colorSwatch}>
              <div className={styles.color} style={{ background: '#171717' }} />
              <span className={styles.colorLabel}>Neutral 900</span>
            </div>
            <div className={styles.colorSwatch}>
              <div className={styles.color} style={{ background: '#262626' }} />
              <span className={styles.colorLabel}>Neutral 800</span>
            </div>
            <div className={styles.colorSwatch}>
              <div className={styles.color} style={{ background: '#404040' }} />
              <span className={styles.colorLabel}>Neutral 700</span>
            </div>
            <div className={styles.colorSwatch}>
              <div className={styles.color} style={{ background: '#737373' }} />
              <span className={styles.colorLabel}>Neutral 500</span>
            </div>
          </div>
        </section>
      </main>

      {/* Modal Component */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Modal Example"
        size="md"
      >
        <div className={styles.modalContent}>
          <p className={styles.modalText}>
            This is a fully accessible modal with focus trapping, escape key support,
            and backdrop click to close.
          </p>
          <Input
            label="Your name"
            placeholder="Enter your name"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            error={inputError}
            fullWidth
          />
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            Submit
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
