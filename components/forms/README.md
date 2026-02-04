# Tallow Form Components

Production-ready form components built with React 19.2.3, TypeScript, and CSS Modules. These components provide advanced form patterns with full accessibility, dark theme styling, and smooth interactions.

## Components

### 1. Select

Custom dropdown select with advanced features.

**Features:**
- ✅ Searchable options
- ✅ Multi-select support
- ✅ Custom option rendering
- ✅ Keyboard navigation (Arrow keys, Enter, Escape, Tab)
- ✅ Click outside to close
- ✅ Icon support
- ✅ Disabled options
- ✅ Full accessibility (ARIA)

**Usage:**

```tsx
import { Select, SelectOption } from '@/components/forms';

const options: SelectOption[] = [
  { value: 'option1', label: 'Option 1', icon: '🎯' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3', disabled: true },
];

<Select
  label="Choose an option"
  options={options}
  placeholder="Select..."
  searchable
  onChange={(value) => console.log(value)}
  error="This field is required"
/>

// Multi-select
<Select
  options={options}
  multiple
  onChange={(values) => console.log(values)}
/>
```

**Props:**
- `label?: string` - Field label
- `options: SelectOption[]` - Array of options
- `placeholder?: string` - Placeholder text
- `searchable?: boolean` - Enable search
- `multiple?: boolean` - Allow multiple selections
- `customRender?: (option) => ReactNode` - Custom option renderer
- `onChange?: (value) => void` - Change handler
- `error?: string` - Error message
- `helperText?: string` - Helper text
- `fullWidth?: boolean` - Full width mode
- `disabled?: boolean` - Disabled state

---

### 2. Checkbox

Custom checkbox with three states.

**Features:**
- ✅ Checked/unchecked/indeterminate states
- ✅ Label integration
- ✅ Error states
- ✅ Helper text
- ✅ Smooth animations
- ✅ Full accessibility

**Usage:**

```tsx
import { Checkbox } from '@/components/forms';

<Checkbox
  label="Accept terms and conditions"
  checked={accepted}
  onChange={(e) => setAccepted(e.target.checked)}
  error="You must accept the terms"
/>

// Indeterminate state
<Checkbox
  label="Select all"
  indeterminate={someSelected && !allSelected}
  checked={allSelected}
  onChange={handleSelectAll}
/>
```

**Props:**
- `label?: string` - Checkbox label
- `checked?: boolean` - Checked state
- `indeterminate?: boolean` - Indeterminate state
- `error?: string` - Error message
- `helperText?: string` - Helper text
- `disabled?: boolean` - Disabled state

---

### 3. Radio

Radio button group with descriptions.

**Features:**
- ✅ Vertical/horizontal layout
- ✅ Option descriptions
- ✅ Disabled options
- ✅ Custom styling
- ✅ Smooth animations
- ✅ Full accessibility (radiogroup)

**Usage:**

```tsx
import { Radio, RadioOption } from '@/components/forms';

const options: RadioOption[] = [
  {
    value: 'option1',
    label: 'Option 1',
    description: 'Description for option 1',
  },
  {
    value: 'option2',
    label: 'Option 2',
    description: 'Description for option 2',
    disabled: true,
  },
];

<Radio
  label="Choose one"
  options={options}
  value={selectedValue}
  onChange={(value) => setSelectedValue(value)}
  orientation="vertical"
  error="This field is required"
/>
```

**Props:**
- `label?: string` - Group label
- `options: RadioOption[]` - Array of radio options
- `value?: string` - Selected value
- `onChange?: (value) => void` - Change handler
- `orientation?: 'horizontal' | 'vertical'` - Layout direction
- `error?: string` - Error message
- `helperText?: string` - Helper text
- `disabled?: boolean` - Disabled state

---

### 4. Toggle

Toggle switch with multiple sizes.

**Features:**
- ✅ On/off states
- ✅ Size variants (sm, md, lg)
- ✅ Label support with descriptions
- ✅ Label positioning (left/right)
- ✅ Smooth animations
- ✅ Full accessibility (switch role)

**Usage:**

```tsx
import { Toggle } from '@/components/forms';

<Toggle
  label="Enable notifications"
  description="Receive email updates"
  size="md"
  checked={notificationsEnabled}
  onChange={(e) => setNotificationsEnabled(e.target.checked)}
  labelPosition="right"
/>
```

**Props:**
- `label?: string` - Toggle label
- `description?: string` - Description text
- `size?: 'sm' | 'md' | 'lg'` - Toggle size
- `labelPosition?: 'left' | 'right'` - Label position
- `checked?: boolean` - Checked state
- `error?: string` - Error message
- `disabled?: boolean` - Disabled state

---

### 5. TextArea

Multi-line text input with advanced features.

**Features:**
- ✅ Auto-resize option
- ✅ Character count
- ✅ Max length enforcement
- ✅ Warning states (near limit, at limit)
- ✅ Error states
- ✅ Custom scrollbar
- ✅ Full accessibility

**Usage:**

```tsx
import { TextArea } from '@/components/forms';

<TextArea
  label="Bio"
  placeholder="Tell us about yourself..."
  rows={4}
  maxLength={500}
  showCharacterCount
  autoResize
  value={bio}
  onChange={(e) => setBio(e.target.value)}
  error="Bio must be at least 20 characters"
  helperText="Minimum 20 characters required"
/>
```

**Props:**
- `label?: string` - Field label
- `placeholder?: string` - Placeholder text
- `rows?: number` - Initial rows (default: 4)
- `maxLength?: number` - Maximum characters
- `showCharacterCount?: boolean` - Show character counter
- `autoResize?: boolean` - Auto-resize to fit content
- `value?: string` - Current value
- `onChange?: (e) => void` - Change handler
- `error?: string` - Error message
- `helperText?: string` - Helper text
- `fullWidth?: boolean` - Full width mode
- `disabled?: boolean` - Disabled state

---

### 6. FileInput

File upload input with drag-and-drop.

**Features:**
- ✅ Drag and drop zone
- ✅ File type restrictions
- ✅ Multiple files support
- ✅ File size validation
- ✅ Preview thumbnails (for images)
- ✅ Remove files individually
- ✅ Custom file icons
- ✅ Full accessibility

**Usage:**

```tsx
import { FileInput } from '@/components/forms';

<FileInput
  label="Upload documents"
  accept=".pdf,.doc,.docx,image/*"
  multiple
  maxSize={5 * 1024 * 1024} // 5MB
  maxFiles={3}
  showPreview
  onChange={(files) => setFiles(files)}
  error="File size exceeds 5MB"
  helperText="Accepted: PDF, DOC, DOCX, or images (max 5MB)"
/>
```

**Props:**
- `label?: string` - Field label
- `accept?: string` - Accepted file types
- `multiple?: boolean` - Allow multiple files
- `maxSize?: number` - Maximum file size in bytes
- `maxFiles?: number` - Maximum number of files
- `showPreview?: boolean` - Show file previews
- `onChange?: (files) => void` - Change handler with File array
- `error?: string` - Error message
- `helperText?: string` - Helper text
- `fullWidth?: boolean` - Full width mode
- `disabled?: boolean` - Disabled state

---

### 7. Form

Form wrapper with validation and loading states.

**Features:**
- ✅ Loading overlay
- ✅ Error display
- ✅ Success display
- ✅ Async submit handling
- ✅ Validation integration
- ✅ Loading spinner
- ✅ Full accessibility

**Usage:**

```tsx
import { Form } from '@/components/forms';

<Form
  onSubmit={handleSubmit}
  loading={isSubmitting}
  error={formError}
  success={formSuccess}
  fullWidth
>
  {/* Form fields */}
</Form>
```

**Props:**
- `onSubmit?: (e) => void | Promise<void>` - Submit handler
- `loading?: boolean` - Loading state
- `error?: string` - Form-level error
- `success?: string` - Success message
- `showValidation?: boolean` - Enable HTML5 validation
- `fullWidth?: boolean` - Full width mode
- `children: ReactNode` - Form content

---

### 8. FormField

Form field wrapper for consistent spacing and layout.

**Features:**
- ✅ Label + input + error layout
- ✅ Required indicator
- ✅ Optional indicator
- ✅ Error state styling
- ✅ Helper text
- ✅ Consistent spacing
- ✅ Full accessibility

**Usage:**

```tsx
import { FormField } from '@/components/forms';
import { Input } from '@/components/ui/Input';

<FormField
  label="Email"
  error={errors.email}
  helperText="We'll never share your email"
  required
  fullWidth
>
  <Input
    type="email"
    placeholder="your@email.com"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
  />
</FormField>
```

**Props:**
- `label?: string` - Field label
- `htmlFor?: string` - Input ID
- `error?: string` - Error message
- `helperText?: string` - Helper text
- `required?: boolean` - Show required indicator
- `optional?: boolean` - Show optional indicator
- `fullWidth?: boolean` - Full width mode
- `disabled?: boolean` - Disabled state
- `children: ReactNode` - Input component

---

## Complete Example

```tsx
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
} from '@/components/forms';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export const MyForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    country: '',
    skills: [],
    experience: '',
    bio: '',
    subscribe: false,
    files: [],
  });
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e: FormEvent) => {
    // Validate and submit
    console.log('Submitting:', formData);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <FormField label="Name" error={errors.name} required>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </FormField>

      <FormField label="Country" error={errors.country} required>
        <Select
          options={countryOptions}
          searchable
          onChange={(value) => setFormData({ ...formData, country: value })}
        />
      </FormField>

      <FormField label="Skills" optional>
        <Select
          options={skillOptions}
          multiple
          onChange={(values) => setFormData({ ...formData, skills: values })}
        />
      </FormField>

      <FormField label="Experience" error={errors.experience} required>
        <Radio
          options={experienceOptions}
          value={formData.experience}
          onChange={(value) => setFormData({ ...formData, experience: value })}
        />
      </FormField>

      <FormField label="Bio" error={errors.bio} required>
        <TextArea
          maxLength={500}
          showCharacterCount
          autoResize
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
        />
      </FormField>

      <Toggle
        label="Enable notifications"
        checked={formData.subscribe}
        onChange={(e) => setFormData({ ...formData, subscribe: e.target.checked })}
      />

      <FormField label="Upload files" optional>
        <FileInput
          multiple
          maxSize={5 * 1024 * 1024}
          onChange={(files) => setFormData({ ...formData, files })}
        />
      </FormField>

      <Button type="submit">Submit</Button>
    </Form>
  );
};
```

---

## Accessibility

All components are built with accessibility in mind:

- ✅ Proper ARIA attributes
- ✅ Keyboard navigation support
- ✅ Screen reader friendly
- ✅ Focus management
- ✅ Error announcements (role="alert")
- ✅ Semantic HTML
- ✅ Focus-visible styling
- ✅ Reduced motion support

---

## Styling

Components use CSS Modules with design tokens from `app/globals.css`:

- Dark theme optimized
- Consistent spacing scale
- Smooth transitions
- Focus states with accent colors
- Error states in red
- Success states in green
- Hover effects
- Custom scrollbars

---

## TypeScript Support

All components are fully typed with TypeScript strict mode:

```tsx
import type {
  SelectProps,
  SelectOption,
  CheckboxProps,
  RadioProps,
  RadioOption,
  ToggleProps,
  TextAreaProps,
  FileInputProps,
  FormProps,
  FormFieldProps,
} from '@/components/forms';
```

---

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

---

## Performance

- Optimized re-renders with proper state management
- Debounced search in Select component
- Lazy-loaded file previews
- Minimal bundle size
- CSS Modules for scoped styles

---

## Demo

Run the FormDemo component to see all features in action:

```tsx
import { FormDemo } from '@/components/forms/FormDemo';

<FormDemo />
```

---

## File Structure

```
components/forms/
├── Select.tsx
├── Select.module.css
├── Checkbox.tsx
├── Checkbox.module.css
├── Radio.tsx
├── Radio.module.css
├── Toggle.tsx
├── Toggle.module.css
├── TextArea.tsx
├── TextArea.module.css
├── FileInput.tsx
├── FileInput.module.css
├── Form.tsx
├── Form.module.css
├── FormField.tsx
├── FormField.module.css
├── FormDemo.tsx
├── FormDemo.module.css
├── index.ts
└── README.md
```

---

## License

Part of the Tallow project. See main project license.
