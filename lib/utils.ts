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

// Estimate pet size category from weight for pricing purposes
export function estimatePetSize(
  weight: number,
  petType: "DOG" | "CAT"
): "SMALL" | "MEDIUM" | "LARGE" {
  if (petType === "DOG") {
    if (weight <= 5) return "SMALL";
    if (weight <= 15) return "MEDIUM";
    return "LARGE";
  }
  // CAT
  if (weight <= 4) return "SMALL";
  if (weight <= 6) return "MEDIUM";
  return "LARGE";
}
