# Tallow Design System - Component Examples

Comprehensive examples for all components in the Tallow Design System.

## Table of Contents

1. [Button](#button)
2. [Card](#card)
3. [Input](#input)
4. [Badge](#badge)
5. [Modal](#modal)
6. [Tooltip](#tooltip)
7. [Spinner](#spinner)
8. [Common Patterns](#common-patterns)

---

## Button

### Basic Usage

```tsx
import { Button } from '@/components/ui';

<Button variant="primary">Submit</Button>
```

### All Variants

```tsx
<Button variant="primary">Primary Action</Button>
<Button variant="secondary">Secondary Action</Button>
<Button variant="ghost">Ghost Button</Button>
<Button variant="danger">Delete Item</Button>
<Button variant="icon" aria-label="Settings">
  <SettingsIcon />
</Button>
```

### Sizes

```tsx
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>
```

### Loading State

```tsx
function SubmitButton() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await submitForm();
    setLoading(false);
  };

  return (
    <Button variant="primary" loading={loading} onClick={handleSubmit}>
      {loading ? 'Submitting...' : 'Submit'}
    </Button>
  );
}
```

### Full Width

```tsx
<Button variant="primary" fullWidth>
  Sign Up Now
</Button>
```

### With Icons

```tsx
<Button variant="primary">
  <DownloadIcon />
  Download File
</Button>
```

---

## Card

### Basic Card

```tsx
import { Card, CardBody } from '@/components/ui';

<Card>
  <CardBody>
    <p>Simple card content</p>
  </CardBody>
</Card>
```

### Complete Card with All Sections

```tsx
import { Card, CardHeader, CardBody, CardFooter, Button } from '@/components/ui';

<Card variant="default">
  <CardHeader>
    <h3>User Profile</h3>
  </CardHeader>
  <CardBody>
    <p>Name: John Doe</p>
    <p>Email: john@example.com</p>
  </CardBody>
  <CardFooter>
    <Button variant="ghost">Cancel</Button>
    <Button variant="primary">Save Changes</Button>
  </CardFooter>
</Card>
```

### Interactive Card

```tsx
<Card
  variant="interactive"
  onClick={() => navigate('/details')}
  role="button"
  tabIndex={0}
>
  <CardBody>
    <h3>Clickable Card</h3>
    <p>Click anywhere on this card to navigate</p>
  </CardBody>
</Card>
```

### Highlighted Card for Important Content

```tsx
<Card variant="highlighted">
  <CardBody>
    <h3>Premium Feature</h3>
    <p>Upgrade to unlock this feature</p>
  </CardBody>
</Card>
```

### Card Grid Layout

```tsx
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
  <Card>
    <CardBody>Card 1</CardBody>
  </Card>
  <Card>
    <CardBody>Card 2</CardBody>
  </Card>
  <Card>
    <CardBody>Card 3</CardBody>
  </Card>
</div>
```

---

## Input

### Basic Input

```tsx
import { Input } from '@/components/ui';

<Input label="Email" type="email" placeholder="you@example.com" />
```

### With Validation

```tsx
function EmailInput() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const validateEmail = (value: string) => {
    if (!value) {
      setError('Email is required');
    } else if (!/\S+@\S+\.\S+/.test(value)) {
      setError('Email is invalid');
    } else {
      setError('');
    }
  };

  return (
    <Input
      label="Email"
      type="email"
      value={email}
      onChange={(e) => {
        setEmail(e.target.value);
        validateEmail(e.target.value);
      }}
      error={error}
    />
  );
}
```

### With Helper Text

```tsx
<Input
  label="Password"
  type="password"
  helperText="Must be at least 8 characters with uppercase and numbers"
/>
```

### With Leading Icon

```tsx
<Input
  label="Search"
  placeholder="Search files..."
  leadingIcon={<SearchIcon />}
/>
```

### With Trailing Icon/Action

```tsx
function PasswordInput() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Input
      label="Password"
      type={showPassword ? 'text' : 'password'}
      trailingIcon={
        <button onClick={() => setShowPassword(!showPassword)}>
          {showPassword ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      }
    />
  );
}
```

### Currency Input

```tsx
<Input
  label="Amount"
  type="number"
  placeholder="0.00"
  leadingIcon={<span>$</span>}
  trailingIcon={<span>USD</span>}
/>
```

### Full Width Form

```tsx
<form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
  <Input label="Full Name" fullWidth />
  <Input label="Email" type="email" fullWidth />
  <Input label="Password" type="password" fullWidth />
  <Button variant="primary" fullWidth>Submit</Button>
</form>
```

---

## Badge

### Status Badges

```tsx
import { Badge } from '@/components/ui';

<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="danger">Failed</Badge>
<Badge variant="neutral">Draft</Badge>
```

### With Dot Indicator

```tsx
<Badge variant="success" showDot>Online</Badge>
<Badge variant="danger" showDot>Offline</Badge>
```

### In Tables

```tsx
<table>
  <tbody>
    <tr>
      <td>User 1</td>
      <td><Badge variant="success">Active</Badge></td>
    </tr>
    <tr>
      <td>User 2</td>
      <td><Badge variant="warning">Pending</Badge></td>
    </tr>
  </tbody>
</table>
```

### Notification Counts

```tsx
<div style={{ position: 'relative' }}>
  <NotificationIcon />
  <Badge
    variant="danger"
    style={{ position: 'absolute', top: -8, right: -8 }}
  >
    5
  </Badge>
</div>
```

---

## Modal

### Confirmation Modal

```tsx
import { Modal, ModalFooter, Button } from '@/components/ui';

function DeleteConfirmation() {
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = () => {
    // Perform delete action
    setIsOpen(false);
  };

  return (
    <>
      <Button variant="danger" onClick={() => setIsOpen(true)}>
        Delete Item
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Confirm Deletion"
        size="sm"
      >
        <p>Are you sure you want to delete this item? This action cannot be undone.</p>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
```

### Form Modal

```tsx
function CreateUserModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await createUser();
    setLoading(false);
    setIsOpen(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="Create New User"
      size="md"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Input label="Full Name" fullWidth />
        <Input label="Email" type="email" fullWidth />
        <Input label="Role" fullWidth />
      </div>
      <ModalFooter>
        <Button variant="ghost" onClick={() => setIsOpen(false)}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit} loading={loading}>
          Create User
        </Button>
      </ModalFooter>
    </Modal>
  );
}
```

### Large Content Modal

```tsx
<Modal isOpen={isOpen} onClose={onClose} title="Terms of Service" size="xl">
  <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
    {/* Long content */}
  </div>
  <ModalFooter>
    <Button variant="primary" onClick={onClose}>
      I Agree
    </Button>
  </ModalFooter>
</Modal>
```

---

## Tooltip

### Basic Tooltip

```tsx
import { Tooltip, Button } from '@/components/ui';

<Tooltip content="Click to download">
  <Button variant="icon">
    <DownloadIcon />
  </Button>
</Tooltip>
```

### With Different Positions

```tsx
<Tooltip content="Top tooltip" position="top">
  <Button>Hover me</Button>
</Tooltip>

<Tooltip content="Right tooltip" position="right">
  <Button>Hover me</Button>
</Tooltip>
```

### Custom Delay

```tsx
<Tooltip content="Appears after 500ms" delay={500}>
  <Button>Hover me</Button>
</Tooltip>
```

### Multi-line Tooltips

```tsx
<Tooltip
  content="This is a longer tooltip that will wrap to multiple lines when needed"
  position="top"
>
  <Button>Hover for info</Button>
</Tooltip>
```

### Icon Tooltips

```tsx
<Tooltip content="Settings">
  <Button variant="icon" aria-label="Settings">
    <SettingsIcon />
  </Button>
</Tooltip>
```

---

## Spinner

### Basic Spinner

```tsx
import { Spinner } from '@/components/ui';

<Spinner />
```

### In Buttons

```tsx
<Button loading>
  Loading...
</Button>
```

### Standalone Loading States

```tsx
<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
  <Spinner size="sm" />
  <span>Loading data...</span>
</div>
```

### Full Page Loader

```tsx
function FullPageLoader() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0, 0, 0, 0.5)'
    }}>
      <Spinner size="lg" variant="white" />
    </div>
  );
}
```

---

## Common Patterns

### Form with Validation

```tsx
function SignUpForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Validate and submit
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <h2>Sign Up</h2>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input
            label="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
            fullWidth
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={errors.email}
            fullWidth
          />
          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            error={errors.password}
            helperText="Must be at least 8 characters"
            fullWidth
          />
        </form>
      </CardBody>
      <CardFooter>
        <Button variant="primary" onClick={handleSubmit} loading={loading} fullWidth>
          Create Account
        </Button>
      </CardFooter>
    </Card>
  );
}
```

### Dashboard Card Grid

```tsx
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
  <Card>
    <CardBody>
      <h3>Total Users</h3>
      <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>1,234</p>
      <Badge variant="success" showDot>+12% this month</Badge>
    </CardBody>
  </Card>

  <Card>
    <CardBody>
      <h3>Revenue</h3>
      <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>$45,678</p>
      <Badge variant="success" showDot>+8% this month</Badge>
    </CardBody>
  </Card>

  <Card>
    <CardBody>
      <h3>Active Sessions</h3>
      <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>89</p>
      <Badge variant="warning">-3% this month</Badge>
    </CardBody>
  </Card>
</div>
```

### Settings Panel

```tsx
<Card>
  <CardHeader>
    <h2>Account Settings</h2>
  </CardHeader>
  <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
    <div>
      <h3>Email Notifications</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input type="checkbox" id="notifications" />
        <label htmlFor="notifications">Receive email notifications</label>
      </div>
    </div>

    <div>
      <h3>Privacy</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input type="checkbox" id="public-profile" />
        <label htmlFor="public-profile">Make profile public</label>
      </div>
    </div>
  </CardBody>
  <CardFooter>
    <Button variant="ghost">Cancel</Button>
    <Button variant="primary">Save Settings</Button>
  </CardFooter>
</Card>
```
