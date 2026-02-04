# Form Components - Quick Reference Card

## Import

```tsx
import {
  Select, Checkbox, Radio, Toggle, TextArea, FileInput,
  Form, FormField,
  // Types
  SelectOption, RadioOption,
  SelectProps, CheckboxProps, RadioProps, ToggleProps,
  TextAreaProps, FileInputProps, FormProps, FormFieldProps
} from '@/components/forms';
```

---

## Select

```tsx
// Single select with search
<Select
  label="Country"
  options={[{ value: 'us', label: 'USA', icon: '🇺🇸' }]}
  searchable
  onChange={(value) => setValue(value)}
  error="Required"
/>

// Multi-select
<Select options={options} multiple onChange={(values) => {}} />
```

**Key Props:** `options`, `searchable`, `multiple`, `onChange`, `error`

---

## Checkbox

```tsx
// Standard checkbox
<Checkbox
  label="Accept terms"
  checked={accepted}
  onChange={(e) => setAccepted(e.target.checked)}
  error="Required"
/>

// Indeterminate state
<Checkbox indeterminate={someChecked} checked={allChecked} />
```

**Key Props:** `label`, `checked`, `indeterminate`, `error`, `onChange`

---

## Radio

```tsx
<Radio
  label="Experience"
  options={[
    { value: 'junior', label: 'Junior', description: '0-2 years' },
    { value: 'senior', label: 'Senior', description: '5+ years' }
  ]}
  value={selected}
  onChange={(value) => setSelected(value)}
  orientation="vertical" // or "horizontal"
  error="Required"
/>
```

**Key Props:** `options`, `value`, `onChange`, `orientation`, `error`

---

## Toggle

```tsx
<Toggle
  label="Enable notifications"
  description="Receive email updates"
  size="md" // "sm" | "md" | "lg"
  checked={enabled}
  onChange={(e) => setEnabled(e.target.checked)}
  labelPosition="right" // or "left"
/>
```

**Key Props:** `label`, `description`, `size`, `checked`, `labelPosition`

---

## TextArea

```tsx
<TextArea
  label="Bio"
  placeholder="Tell us about yourself..."
  rows={4}
  maxLength={500}
  showCharacterCount
  autoResize
  value={bio}
  onChange={(e) => setBio(e.target.value)}
  error="Min 20 characters"
  helperText="Be descriptive"
/>
```

**Key Props:** `maxLength`, `showCharacterCount`, `autoResize`, `rows`

---

## FileInput

```tsx
<FileInput
  label="Upload resume"
  accept=".pdf,.doc,.docx,image/*"
  multiple
  maxSize={5 * 1024 * 1024} // 5MB
  maxFiles={3}
  showPreview
  onChange={(files) => setFiles(files)}
  error="File too large"
  helperText="Max 5MB per file"
/>
```

**Key Props:** `accept`, `multiple`, `maxSize`, `maxFiles`, `showPreview`

---

## Form

```tsx
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

**Key Props:** `onSubmit`, `loading`, `error`, `success`

---

## FormField

```tsx
<FormField
  label="Email"
  error={errors.email}
  helperText="We'll never share your email"
  required
  fullWidth
>
  <Input type="email" value={email} onChange={...} />
</FormField>
```

**Key Props:** `label`, `error`, `helperText`, `required`, `optional`

---

## Complete Form Example

```tsx
const MyForm = () => {
  const [data, setData] = useState({ name: '', country: '', files: [] });
  const [errors, setErrors] = useState({});

  return (
    <Form onSubmit={handleSubmit} error={formError}>
      <FormField label="Name" error={errors.name} required>
        <Input
          value={data.name}
          onChange={(e) => setData({ ...data, name: e.target.value })}
        />
      </FormField>

      <FormField label="Country" required>
        <Select
          options={countries}
          searchable
          onChange={(v) => setData({ ...data, country: v })}
        />
      </FormField>

      <Toggle
        label="Subscribe"
        checked={data.subscribe}
        onChange={(e) => setData({ ...data, subscribe: e.target.checked })}
      />

      <FormField label="Documents" optional>
        <FileInput
          multiple
          maxSize={5 * 1024 * 1024}
          onChange={(files) => setData({ ...data, files })}
        />
      </FormField>

      <Button type="submit">Submit</Button>
    </Form>
  );
};
```

---

## Validation Pattern

```tsx
const validate = () => {
  const errors = {};

  if (!data.name?.trim()) errors.name = 'Name is required';
  if (!data.email?.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    errors.email = 'Invalid email';
  }
  if (!data.country) errors.country = 'Select a country';

  setErrors(errors);
  return Object.keys(errors).length === 0;
};

const handleSubmit = async () => {
  if (!validate()) {
    setFormError('Please fix errors');
    return;
  }

  try {
    await api.submit(data);
    setFormSuccess('Submitted!');
  } catch (err) {
    setFormError(err.message);
  }
};
```

---

## Styling Tips

All components use CSS Modules and design tokens:

```css
/* Custom styling example */
.myForm :global(.Select_trigger) {
  /* Override select styles */
}

.myCheckbox {
  /* Custom checkbox styling */
}
```

Design tokens available:
- `--color-accent-primary` - Accent color
- `--color-error` - Error states
- `--spacing-*` - Spacing scale
- `--radius-*` - Border radius
- `--transition-*` - Transitions

---

## Accessibility Shortcuts

- **Tab** - Navigate between fields
- **Arrow Keys** - Navigate options (Select, Radio)
- **Space/Enter** - Activate/select
- **Escape** - Close dropdown (Select)

All components support:
- Screen readers
- Keyboard navigation
- ARIA attributes
- Focus management
- Error announcements

---

## File Locations

```
components/forms/
├── Select.tsx + Select.module.css
├── Checkbox.tsx + Checkbox.module.css
├── Radio.tsx + Radio.module.css
├── Toggle.tsx + Toggle.module.css
├── TextArea.tsx + TextArea.module.css
├── FileInput.tsx + FileInput.module.css
├── Form.tsx + Form.module.css
├── FormField.tsx + FormField.module.css
├── FormDemo.tsx (example)
├── index.ts (exports)
└── README.md (full docs)
```

---

## Common Patterns

### Required Fields
```tsx
<FormField label="Name" required>
  <Input />
</FormField>
```

### Optional Fields
```tsx
<FormField label="Phone" optional>
  <Input />
</FormField>
```

### Searchable Multi-Select
```tsx
<Select options={opts} searchable multiple onChange={...} />
```

### Auto-Resize TextArea with Count
```tsx
<TextArea autoResize maxLength={500} showCharacterCount />
```

### Drag-Drop File Upload
```tsx
<FileInput multiple maxSize={5*1024*1024} showPreview />
```

### Toggle with Description
```tsx
<Toggle
  label="Feature"
  description="Enable advanced features"
  size="md"
/>
```

---

## TypeScript Types

```typescript
import type {
  SelectOption,      // { value, label, icon?, disabled? }
  RadioOption,       // { value, label, description?, disabled? }
  SelectProps,
  CheckboxProps,
  RadioProps,
  ToggleProps,
  TextAreaProps,
  FileInputProps,
  FormProps,
  FormFieldProps
} from '@/components/forms';
```

---

## Performance Tips

1. **Memoize handlers:** Use `useCallback` for onChange handlers
2. **Lazy validation:** Validate on blur or submit, not on every keystroke
3. **Debounce search:** Already implemented in Select component
4. **Optimize file previews:** Only generate for images
5. **Controlled vs uncontrolled:** Use controlled for validation

---

## Browser Support

✅ Chrome/Edge 90+
✅ Firefox 88+
✅ Safari 14+
✅ Mobile browsers

---

**Quick Start:**

1. Import components: `import { Form, FormField, Select, ... } from '@/components/forms';`
2. Add to your form: `<Form onSubmit={...}><FormField>...</FormField></Form>`
3. See `FormDemo.tsx` for complete example
4. Read `README.md` for detailed docs

**All components are production-ready with TypeScript, accessibility, and dark theme support.**
