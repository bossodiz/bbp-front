"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface PhoneInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value"
> {
  value?: string;
  onChange?: (value: string) => void;
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, value = "", onChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState("");
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Combine refs
    React.useImperativeHandle(ref, () => inputRef.current!);

    // Format phone number: xxx-xxx-xxxx
    const formatPhone = (digits: string): string => {
      const limited = digits.slice(0, 10);
      if (limited.length >= 6) {
        return `${limited.slice(0, 3)}-${limited.slice(3, 6)}-${limited.slice(6)}`;
      }
      if (limited.length >= 3) {
        return `${limited.slice(0, 3)}-${limited.slice(3)}`;
      }
      return limited;
    };

    // Update display value when prop value changes
    React.useEffect(() => {
      const digits = value.replace(/\D/g, "");
      setDisplayValue(formatPhone(digits));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target;
      const newValue = input.value;
      const cursorPos = input.selectionStart || 0;

      // Extract only digits
      const digits = newValue.replace(/\D/g, "");

      // Get current digits count
      const currentDigits = value.replace(/\D/g, "");

      // If already at max length (10 digits) and trying to add more, prevent it
      if (currentDigits.length >= 10 && digits.length > currentDigits.length) {
        // Keep cursor at current position
        requestAnimationFrame(() => {
          if (inputRef.current) {
            const currentFormatted = formatPhone(currentDigits);
            // Find cursor position in formatted string
            let formattedCursorPos = 0;
            let digitCount = 0;
            const digitsBeforeCursor = displayValue
              .slice(0, cursorPos)
              .replace(/\D/g, "").length;

            for (let i = 0; i < currentFormatted.length; i++) {
              if (currentFormatted[i] !== "-") {
                digitCount++;
                if (digitCount === digitsBeforeCursor) {
                  formattedCursorPos = i + 1;
                  break;
                }
              }
            }
            inputRef.current.setSelectionRange(
              formattedCursorPos,
              formattedCursorPos,
            );
          }
        });
        return; // Don't update anything
      }

      const formatted = formatPhone(digits);

      // Calculate cursor position
      const digitsBeforeCursor = newValue
        .slice(0, cursorPos)
        .replace(/\D/g, "").length;

      let newCursorPos = 0;
      let digitCount = 0;
      for (let i = 0; i < formatted.length; i++) {
        if (formatted[i] !== "-") {
          digitCount++;
          if (digitCount === digitsBeforeCursor) {
            newCursorPos = i + 1;
            break;
          }
        }
      }

      // Update state
      setDisplayValue(formatted);
      onChange?.(digits);

      // Set cursor position after render
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      const input = e.currentTarget;
      const cursorPos = input.selectionStart || 0;

      // Handle backspace on dash
      if (e.key === "Backspace" && displayValue[cursorPos - 1] === "-") {
        e.preventDefault();
        const digits = displayValue.replace(/\D/g, "");
        const newDigits = digits.slice(0, -1);
        const formatted = formatPhone(newDigits);

        setDisplayValue(formatted);
        onChange?.(newDigits);

        // Calculate new cursor position
        const digitsBeforeCursor = displayValue
          .slice(0, cursorPos - 1)
          .replace(/\D/g, "").length;
        let newCursorPos = 0;
        let digitCount = 0;
        for (let i = 0; i < formatted.length; i++) {
          if (formatted[i] !== "-") {
            digitCount++;
            if (digitCount === digitsBeforeCursor) {
              newCursorPos = i + 1;
              break;
            }
          }
        }

        requestAnimationFrame(() => {
          if (inputRef.current) {
            inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
          }
        });
      }
    };

    return (
      <Input
        ref={inputRef}
        type="tel"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={cn(className)}
        {...props}
      />
    );
  },
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
