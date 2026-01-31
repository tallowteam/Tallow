'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Lock, Eye, EyeOff, Shield, Info } from 'lucide-react';
import { calculatePasswordStrength } from '@/lib/crypto/argon2-browser';
import { Progress } from '@/components/ui/progress';

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

interface PasswordProtectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName?: string;
  onConfirm: (password: string, hint?: string) => void;
  onCancel?: () => void;
}

export function PasswordProtectionDialog({
  open,
  onOpenChange,
  fileName,
  onConfirm,
  onCancel,
}: PasswordProtectionDialogProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hint, setHint] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Ref for accessible focus management - focus after dialog announces to screen readers
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Focus management: delay focus to allow screen readers to announce dialog first
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [open]);

  const passwordStrength = useMemo(() => {
    if (!password) {return { score: 0, feedback: [] };}
    return calculatePasswordStrength(password);
  }, [password]);

  const passwordsMatch = password === confirmPassword;
  const isValid = password.length >= MIN_PASSWORD_LENGTH && password.length <= MAX_PASSWORD_LENGTH && passwordsMatch;

  const strengthText = useMemo(() => {
    const texts = ['Very Weak', 'Weak', 'Medium', 'Strong', 'Very Strong'];
    return texts[passwordStrength.score] || 'None';
  }, [passwordStrength.score]);

  const handleConfirm = useCallback(() => {
    if (!isValid) {return;}
    onConfirm(password, hint.trim() || undefined);
    setPassword('');
    setConfirmPassword('');
    setHint('');
    onOpenChange(false);
  }, [password, hint, isValid, onConfirm, onOpenChange]);

  const handleCancel = useCallback(() => {
    setPassword('');
    setConfirmPassword('');
    setHint('');
    onCancel?.();
    onOpenChange(false);
  }, [onCancel, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-[#191610] dark:text-[#fefefc]">
            <div className="p-2 rounded-xl bg-[#b2987d]/10 dark:bg-[#b2987d]/20">
              <Shield className="w-5 h-5 text-[#b2987d]" />
            </div>
            <span>Password Protect File</span>
          </DialogTitle>
          <DialogDescription>
            {fileName
              ? `Lock "${fileName}" so only people with the password can open it`
              : 'Add a password so only the right people can access your files'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Password Input */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                ref={passwordInputRef}
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={MAX_PASSWORD_LENGTH}
                className="pr-10"
                autoComplete="new-password"
                aria-required="true"
                aria-invalid={password.length > MAX_PASSWORD_LENGTH}
                aria-describedby={password ? "password-strength" : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
              </button>
            </div>

            {/* Password Strength Meter */}
            {password && (
              <div id="password-strength" className="space-y-1" role="status" aria-live="polite">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Strength:</span>
                  <span className={`font-medium ${passwordStrength.score >= 3 ? 'text-green-600' : 'text-orange-600'}`}>
                    {strengthText}
                  </span>
                </div>
                <Progress value={(passwordStrength.score / 4) * 100} className="h-2" aria-label={`Password strength: ${strengthText}`} />
                {passwordStrength.feedback.length > 1 && (
                  <ul className="text-xs text-muted-foreground space-y-0.5 mt-1">
                    {passwordStrength.feedback.slice(1, 3).map((fb, i) => (
                      <li key={i}>• {fb}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pr-10"
                aria-required="true"
                aria-invalid={!!confirmPassword && !passwordsMatch}
                aria-describedby={confirmPassword && !passwordsMatch ? "password-mismatch-error" : undefined}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
              </button>
            </div>
            {confirmPassword && !passwordsMatch && (
              <p id="password-mismatch-error" className="text-xs text-destructive" role="alert">
                Passwords don't match yet
              </p>
            )}
          </div>

          {/* Password Hint (Optional) */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="hint">Password Hint (Optional)</Label>
              <Info className="w-3 h-3 text-muted-foreground" />
            </div>
            <Textarea
              id="hint"
              placeholder="E.g., 'My first pet's name'"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              rows={2}
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">
              A hint to help you remember. Don't include the actual password!
            </p>
          </div>

          {/* Security Notice */}
          <div className="flex gap-3 p-4 rounded-xl
            bg-gradient-to-br from-[#b2987d]/5 to-[#b2987d]/10
            dark:from-[#b2987d]/10 dark:to-[#b2987d]/5
            border border-[#e5dac7] dark:border-[#544a36]">
            <Lock className="w-4 h-4 text-[#b2987d] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[#b2987d]">
              The file will be encrypted. Send the password separately so only the right person can open it.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!isValid}>
            <Shield className="w-4 h-4 mr-2" />
            Protect File
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PasswordProtectionDialog;
