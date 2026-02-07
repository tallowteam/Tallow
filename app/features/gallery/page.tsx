'use client';

import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Search, Filter } from '@/components/icons';
import { FeatureCard } from '@/components/docs/FeatureCard';
import { FeatureDetailModal } from '@/components/docs/FeatureDetailModal';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { FEATURES, CATEGORIES, STATUSES, type Feature } from '@/lib/docs/feature-catalog';
import styles from './page.module.css';

export default function FeatureGalleryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter features based on search and filters
  const filteredFeatures = useMemo(() => {
    return FEATURES.filter((feature) => {
      // Search filter
      const matchesSearch =
        searchQuery === '' ||
        feature.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        feature.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        feature.details?.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const matchesCategory =
        selectedCategory === 'all' || feature.category === selectedCategory;

      // Status filter
      const matchesStatus = selectedStatus === 'all' || feature.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [searchQuery, selectedCategory, selectedStatus]);

  const handleFeatureClick = (feature: Feature) => {
    setSelectedFeature(feature);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Small delay before clearing to allow modal animation
    setTimeout(() => setSelectedFeature(null), 200);
  };

  return (
    <>
      <Header />
      <main className={styles.main}>
        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroBackground}>
            <div className={styles.heroGradient} />
          </div>
          <div className="container">
            <AnimatedSection animation="fadeInUp">
              <Badge variant="secondary">Feature Gallery</Badge>
              <h1 className={styles.heroTitle}>
                Explore <span className={styles.heroTitleGradient}>200+ Features</span>
              </h1>
              <p className={styles.heroDescription}>
                Discover all the powerful features that make Tallow the most secure and
                feature-rich file transfer platform.
              </p>
            </AnimatedSection>
          </div>
        </section>

        {/* Filters */}
        <section className={styles.filters}>
          <div className="container">
            <AnimatedSection animation="fadeInUp" delay={100}>
              <div className={styles.filtersWrapper}>
                {/* Search */}
                <div className={styles.searchWrapper}>
                  <Input
                    type="search"
                    placeholder="Search features..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    leadingIcon={<Search />}
                    fullWidth
                    aria-label="Search features"
                  />
                </div>

                {/* Category Tabs */}
                <div className={styles.tabs}>
                  <div className={styles.tabsLabel}>
                    <Filter />
                    <span>Category:</span>
                  </div>
                  <div className={styles.tabsList} role="tablist">
                    {CATEGORIES.map((category) => (
                      <button
                        key={category.id}
                        className={`${styles.tab} ${
                          selectedCategory === category.id ? styles.tabActive : ''
                        }`}
                        onClick={() => setSelectedCategory(category.id)}
                        role="tab"
                        aria-selected={selectedCategory === category.id}
                        aria-label={`Filter by ${category.label}`}
                      >
                        {category.label}
                        <span className={styles.tabCount}>{category.count}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Tabs */}
                <div className={styles.tabs}>
                  <div className={styles.tabsLabel}>
                    <span>Status:</span>
                  </div>
                  <div className={styles.tabsList} role="tablist">
                    {STATUSES.map((status) => (
                      <button
                        key={status.id}
                        className={`${styles.tab} ${
                          selectedStatus === status.id ? styles.tabActive : ''
                        }`}
                        onClick={() => setSelectedStatus(status.id)}
                        role="tab"
                        aria-selected={selectedStatus === status.id}
                        aria-label={`Filter by ${status.label}`}
                      >
                        {status.label}
                        <span className={styles.tabCount}>{status.count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* Results Summary */}
        <section className={styles.summary}>
          <div className="container">
            <AnimatedSection animation="fadeInUp" delay={150}>
              <p className={styles.summaryText}>
                Showing <strong>{filteredFeatures.length}</strong> of{' '}
                <strong>{FEATURES.length}</strong> features
              </p>
            </AnimatedSection>
          </div>
        </section>

        {/* Features Grid */}
        <section className={styles.gallery}>
          <div className="container">
            {filteredFeatures.length === 0 ? (
              <AnimatedSection animation="fadeInUp" delay={200}>
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>🔍</div>
                  <h2 className={styles.emptyTitle}>No features found</h2>
                  <p className={styles.emptyDescription}>
                    Try adjusting your search or filters to find what you&apos;re looking for.
                  </p>
                </div>
              </AnimatedSection>
            ) : (
              <div className={styles.grid}>
                {filteredFeatures.map((feature, index) => (
                  <AnimatedSection
                    key={feature.id}
                    animation="fadeInUp"
                    delay={Math.min(index * 30, 500)}
                  >
                    <FeatureCard feature={feature} onClick={handleFeatureClick} />
                  </AnimatedSection>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />

      {/* Feature Detail Modal */}
      <FeatureDetailModal
        feature={selectedFeature}
        open={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}
