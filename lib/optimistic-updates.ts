"use client";

// ============================================================================
// OPTIMISTIC UPDATES - Update UI immediately, sync with server
// ============================================================================

/**
 * Optimistic Update Pattern:
 * 1. Update local state immediately (optimistic)
 * 2. Make API call in background
 * 3. If API fails, rollback to previous state
 * 4. Show toast notification
 *
 * Usage:
 * const { execute, isPending } = useOptimisticUpdate(
 *   async (data) => {
 *     const response = await fetch('/api/products', {
 *       method: 'POST',
 *       body: JSON.stringify(data),
 *     });
 *     return response.json();
 *   },
 *   () => {
 *     // Update store optimistically
 *     addProduct(formData);
 *   },
 *   () => {
 *     // Rollback on error
 *     removeLastProduct();
 *   },
 * );
 */

import { useState } from "react";
import { showToast } from "./toast-helper";

interface OptimisticUpdateOptions<T> {
  onOptimisticUpdate: () => void;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
}

export function useOptimisticUpdate<T = unknown>(
  apiCall: (data: unknown) => Promise<T>,
  options: OptimisticUpdateOptions<T>,
) {
  const [isPending, setIsPending] = useState(false);

  const execute = async (data: unknown) => {
    try {
      // Step 1: Update UI optimistically
      options.onOptimisticUpdate();
      setIsPending(true);

      // Step 2: Call API
      const result = await apiCall(data);

      // Step 3: Success
      setIsPending(false);
      if (options.onSuccess) {
        options.onSuccess(result);
      }
      if (options.successMessage) {
        showToast.success(options.successMessage);
      }

      return result;
    } catch (error) {
      // Step 4: Rollback on error
      setIsPending(false);
      const err = error instanceof Error ? error : new Error(String(error));

      if (options.onError) {
        options.onError(err);
      }
      if (options.errorMessage) {
        showToast.error(options.errorMessage, err.message);
      }

      throw error;
    }
  };

  return { execute, isPending };
}

// ============================================================================
// OPTIMISTIC UPDATE EXAMPLES
// ============================================================================

/**
 * Example: Add product optimistically
 *
 * const { execute: addProductOptimistic, isPending } = useOptimisticUpdate(
 *   (data) => fetch('/api/products', {
 *     method: 'POST',
 *     headers: { 'x-csrf-token': csrfToken },
 *     body: JSON.stringify(data),
 *   }).then(r => r.json()),
 *   {
 *     onOptimisticUpdate: () => {
 *       const newProduct = useProductStore.getState().addProduct(formData);
 *       setOptimisticId(newProduct.id);
 *     },
 *     onSuccess: (data) => {
 *       // Sync real ID from server
 *       useProductStore.getState().updateProduct(optimisticId, data);
 *     },
 *     onError: () => {
 *       // Remove optimistic product
 *       useProductStore.getState().deleteProduct(optimisticId);
 *     },
 *     successMessage: 'สินค้าสร้างสำเร็จ',
 *     errorMessage: 'ไม่สามารถสร้างสินค้า',
 *   },
 * );
 *
 * await addProductOptimistic(formData);
 */

/**
 * Example: Update product optimistically
 *
 * const { execute: updateOptimistic } = useOptimisticUpdate(
 *   (data) => fetch(`/api/products/${id}`, {
 *     method: 'PUT',
 *     headers: { 'x-csrf-token': csrfToken },
 *     body: JSON.stringify(data),
 *   }).then(r => r.json()),
 *   {
 *     onOptimisticUpdate: () => {
 *       useProductStore.getState().updateProduct(id, formData);
 *     },
 *     onError: () => {
 *       // Revert to previous state
 *       useProductStore.getState().refetchProduct(id);
 *     },
 *     successMessage: 'อัปเดตสินค้าสำเร็จ',
 *     errorMessage: 'ไม่สามารถอัปเดตสินค้า',
 *   },
 * );
 */
