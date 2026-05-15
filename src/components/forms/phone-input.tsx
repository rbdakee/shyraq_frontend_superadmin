import { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { maskKZPhone, applyBackspaceCorrection } from './phone-format';

export interface PhoneInputProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  id?: string;
  'aria-invalid'?: boolean;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, ...rest }, ref) => {
    const displayValue = maskKZPhone(value);
    return (
      <Input
        ref={ref}
        type="tel"
        inputMode="tel"
        value={displayValue}
        onChange={(e) => onChange(applyBackspaceCorrection(value, e.target.value, displayValue))}
        {...rest}
      />
    );
  },
);
PhoneInput.displayName = 'PhoneInput';
