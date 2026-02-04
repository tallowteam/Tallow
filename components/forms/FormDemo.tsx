'use client';

import { useState, FormEvent } from 'react';
import {
  Form,
  FormField,
  Select,
  Checkbox,
  Radio,
  Toggle,
  TextArea,
  FileInput,
  SelectOption,
  RadioOption,
} from './index';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import styles from './FormDemo.module.css';

/**
 * FormDemo - Comprehensive demonstration of all form components
 *
 * This component showcases:
 * - Select with searchable options and multi-select
 * - Checkbox with indeterminate state
 * - Radio buttons with descriptions
 * - Toggle switches with sizes
 * - TextArea with auto-resize and character count
 * - FileInput with drag-and-drop and previews
 * - Form validation and submission
 * - FormField wrapper for consistent spacing
 */

interface FormData {
  name: string;
  email: string;
  country: string;
  skills: string[];
  experience: string;
  subscribe: boolean;
  notifications: boolean;
  darkMode: boolean;
  bio: string;
  files: File[];
  terms: boolean;
}

const countryOptions: SelectOption[] = [
  { value: 'us', label: 'United States', icon: '🇺🇸' },
  { value: 'uk', label: 'United Kingdom', icon: '🇬🇧' },
  { value: 'ca', label: 'Canada', icon: '🇨🇦' },
  { value: 'au', label: 'Australia', icon: '🇦🇺' },
  { value: 'de', label: 'Germany', icon: '🇩🇪' },
  { value: 'fr', label: 'France', icon: '🇫🇷' },
  { value: 'jp', label: 'Japan', icon: '🇯🇵' },
  { value: 'in', label: 'India', icon: '🇮🇳' },
];

const skillOptions: SelectOption[] = [
  { value: 'react', label: 'React' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'nodejs', label: 'Node.js' },
  { value: 'python', label: 'Python' },
  { value: 'rust', label: 'Rust' },
  { value: 'go', label: 'Go' },
];

const experienceOptions: RadioOption[] = [
  {
    value: 'beginner',
    label: 'Beginner',
    description: 'Less than 1 year of experience',
  },
  {
    value: 'intermediate',
    label: 'Intermediate',
    description: '1-3 years of experience',
  },
  {
    value: 'advanced',
    label: 'Advanced',
    description: '3-5 years of experience',
  },
  {
    value: 'expert',
    label: 'Expert',
    description: '5+ years of experience',
  },
];

export const FormDemo = () => {
  const [formData, setFormData] = useState<Partial<FormData>>({
    skills: [],
    files: [],
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {}
  );
  const [formError, setFormError] = useState<string>('');
  const [formSuccess, setFormSuccess] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.country) {
      newErrors.country = 'Please select a country';
    }

    if (!formData.experience) {
      newErrors.experience = 'Please select your experience level';
    }

    if (!formData.bio || formData.bio.trim().length < 20) {
      newErrors.bio = 'Bio must be at least 20 characters';
    }

    if (!formData.terms) {
      newErrors.terms = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    setFormError('');
    setFormSuccess('');

    if (!validateForm()) {
      setFormError('Please fix the errors above');
      return;
    }

    try {
      setIsSubmitting(true);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log('Form submitted:', formData);
      setFormSuccess('Form submitted successfully!');

      // Reset form
      setTimeout(() => {
        setFormData({ skills: [], files: [] });
        setFormSuccess('');
      }, 3000);
    } catch (err) {
      setFormError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.demo}>
      <div className={styles.header}>
        <h1>Form Components Demo</h1>
        <p>Comprehensive showcase of all form components</p>
      </div>

      <Form
        onSubmit={handleSubmit}
        loading={isSubmitting}
        error={formError}
        success={formSuccess}
        fullWidth
      >
        {/* Personal Information Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Personal Information</h2>

          <FormField
            label="Full Name"
            error={errors.name}
            required
            fullWidth
          >
            <Input
              placeholder="Enter your full name"
              value={formData.name || ''}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              error={errors.name}
            />
          </FormField>

          <FormField
            label="Email Address"
            error={errors.email}
            required
            fullWidth
          >
            <Input
              type="email"
              placeholder="your.email@example.com"
              value={formData.email || ''}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              error={errors.email}
            />
          </FormField>

          <FormField
            label="Country"
            error={errors.country}
            helperText="Select your country of residence"
            required
            fullWidth
          >
            <Select
              options={countryOptions}
              placeholder="Select a country"
              searchable
              value={formData.country}
              onChange={(value) =>
                setFormData({ ...formData, country: value as string })
              }
              error={errors.country}
            />
          </FormField>
        </div>

        {/* Professional Information Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Professional Information</h2>

          <FormField
            label="Skills"
            helperText="Select all that apply"
            optional
            fullWidth
          >
            <Select
              options={skillOptions}
              placeholder="Select your skills"
              multiple
              value={formData.skills}
              onChange={(value) =>
                setFormData({ ...formData, skills: value as string[] })
              }
            />
          </FormField>

          <FormField
            label="Experience Level"
            error={errors.experience}
            required
            fullWidth
          >
            <Radio
              options={experienceOptions}
              value={formData.experience}
              onChange={(value) =>
                setFormData({ ...formData, experience: value })
              }
              error={errors.experience}
            />
          </FormField>

          <FormField
            label="Bio"
            error={errors.bio}
            helperText="Tell us about yourself (minimum 20 characters)"
            required
            fullWidth
          >
            <TextArea
              placeholder="Write a brief bio..."
              rows={6}
              maxLength={500}
              showCharacterCount
              autoResize
              value={formData.bio || ''}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              error={errors.bio}
            />
          </FormField>
        </div>

        {/* Preferences Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Preferences</h2>

          <Checkbox
            label="Subscribe to newsletter"
            checked={formData.subscribe || false}
            onChange={(e) =>
              setFormData({ ...formData, subscribe: e.target.checked })
            }
          />

          <Toggle
            label="Enable notifications"
            description="Receive updates about your account"
            size="md"
            checked={formData.notifications || false}
            onChange={(e) =>
              setFormData({ ...formData, notifications: e.target.checked })
            }
          />

          <Toggle
            label="Dark mode"
            description="Switch between light and dark themes"
            size="md"
            checked={formData.darkMode || false}
            onChange={(e) =>
              setFormData({ ...formData, darkMode: e.target.checked })
            }
          />
        </div>

        {/* File Upload Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Documents</h2>

          <FormField
            label="Upload Files"
            helperText="Upload your resume and portfolio (PDF, DOC, or images)"
            optional
            fullWidth
          >
            <FileInput
              accept=".pdf,.doc,.docx,image/*"
              multiple
              maxSize={5 * 1024 * 1024} // 5MB
              maxFiles={3}
              showPreview
              onChange={(files) => setFormData({ ...formData, files })}
            />
          </FormField>
        </div>

        {/* Terms Section */}
        <div className={styles.section}>
          <Checkbox
            label="I accept the terms and conditions"
            checked={formData.terms || false}
            onChange={(e) =>
              setFormData({ ...formData, terms: e.target.checked })
            }
            error={errors.terms}
          />
        </div>

        {/* Submit Button */}
        <div className={styles.actions}>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setFormData({ skills: [], files: [] });
              setErrors({});
              setFormError('');
              setFormSuccess('');
            }}
          >
            Reset
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            Submit Application
          </Button>
        </div>
      </Form>
    </div>
  );
};
