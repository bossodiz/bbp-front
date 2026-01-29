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
  const bangkokDate = getBangkokDate();
  return bangkokDate.toISOString();
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
