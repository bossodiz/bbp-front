import type { Pet } from "@/lib/types";

/**
 * Format breed display for mixed breeds
 * Returns "{breed1} - {breed2}" for mixed breeds, or just breed name for pure breeds
 */
export function formatBreedDisplay(pet: Pet): string {
  if (pet.isMixedBreed && pet.breed2) {
    return `${pet.breed} & ${pet.breed2}`;
  }
  return pet.breed;
}
