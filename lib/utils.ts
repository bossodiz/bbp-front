import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Phone number utilities
export function formatPhoneDisplay(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, "");
  // Format as xxx-xxx-xxxx
  if (digits.length >= 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
  if (digits.length >= 6) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length >= 3) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }
  return digits;
}

export function formatPhoneInput(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, "");
  // Limit to 10 digits
  const limited = digits.slice(0, 10);
  // Format with dashes for display in input
  if (limited.length >= 6) {
    return `${limited.slice(0, 3)}-${limited.slice(3, 6)}-${limited.slice(6)}`;
  }
  if (limited.length >= 3) {
    return `${limited.slice(0, 3)}-${limited.slice(3)}`;
  }
  return limited;
}

export function handlePhoneInput(
  e: React.ChangeEvent<HTMLInputElement>,
  currentValue: string,
): string {
  const input = e.target;
  const newValue = input.value;
  const cursorPos = input.selectionStart || 0;

  // Get only digits
  const currentDigits = currentValue.replace(/\D/g, "");
  const newDigits = newValue.replace(/\D/g, "");

  // Format the new value
  const formatted = formatPhoneInput(newDigits);

  // Calculate new cursor position
  // Count how many digits are before cursor in the new value
  const digitsBeforeCursor = newValue
    .slice(0, cursorPos)
    .replace(/\D/g, "").length;

  // Find position in formatted string where we have that many digits
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

  // If we're deleting and cursor is right after a dash, move it back
  if (
    newDigits.length < currentDigits.length &&
    formatted[newCursorPos - 1] === "-"
  ) {
    newCursorPos--;
  }

  // Set cursor position after render
  setTimeout(() => {
    input.setSelectionRange(newCursorPos, newCursorPos);
  }, 0);

  return formatted;
}

export function getPhoneDigits(phone: string): string {
  return phone.replace(/\D/g, "").slice(0, 10);
}

// Bangkok timezone utilities (UTC+7)
export function getBangkokDate(): Date {
  const now = new Date();
  const bangkokTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }),
  );
  return bangkokTime;
}

export function getBangkokDateString(): string {
  const bangkokDate = getBangkokDate();
  const year = bangkokDate.getFullYear();
  const month = String(bangkokDate.getMonth() + 1).padStart(2, "0");
  const day = String(bangkokDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getBangkokDateTime(): string {
  // Return current time as ISO UTC string (for DB storage)
  return new Date().toISOString();
}

export function formatDateToBangkok(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const bangkokTime = new Date(
    d.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }),
  );
  const year = bangkokTime.getFullYear();
  const month = String(bangkokTime.getMonth() + 1).padStart(2, "0");
  const day = String(bangkokTime.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Format date for API submission (YYYY-MM-DD string in Bangkok timezone)
export function formatDateForAPI(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Convert UTC date to Bangkok timezone (UTC+7)
export function convertUTCToBangkok(utcDate: Date | string): Date {
  const date =
    typeof utcDate === "string" ? new Date(utcDate) : new Date(utcDate);
  // Convert to Bangkok timezone (UTC+7)
  const bangkokTime = new Date(
    date.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }),
  );
  return bangkokTime;
}

export function toUtcIsoFromBangkokLocal(
  y: number,
  m: number,
  d: number,
  hh = 0,
  mm = 0,
  ss = 0,
) {
  // m: 1-12
  // Bangkok is UTC+7, so UTC time = local - 7 hours
  const utcMs = Date.UTC(y, m - 1, d, hh - 7, mm, ss, 0);
  return new Date(utcMs).toISOString();
}

// Currency formatting
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
