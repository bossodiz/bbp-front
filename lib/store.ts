import { create } from "zustand";
import type {
  Customer,
  Pet,
  Service,
  Promotion,
  Booking,
  PetTypeConfig,
  SizeConfig,
} from "./types";

// Customer Store
interface CustomerStore {
  customers: Customer[];
  addCustomer: (
    customer: Omit<Customer, "id" | "createdAt" | "updatedAt" | "pets">,
  ) => Customer;
  updateCustomer: (id: number, data: Partial<Customer>) => void;
  deleteCustomer: (id: number) => void;
  addPet: (
    customerId: number,
    pet: Omit<Pet, "id" | "customerId" | "createdAt" | "updatedAt">,
  ) => Pet;
  updatePet: (customerId: number, petId: number, data: Partial<Pet>) => void;
  deletePet: (customerId: number, petId: number) => void;
  searchCustomers: (query: string) => Customer[];
}

let customerIdCounter = 1;
let petIdCounter = 1;

export const useCustomerStore = create<CustomerStore>((set, get) => ({
  customers: [],

  addCustomer: (customerData) => {
    const newCustomer: Customer = {
      ...customerData,
      id: customerIdCounter++,
      createdAt: new Date(),
      updatedAt: new Date(),
      pets: [],
    };
    set((state) => ({ customers: [...state.customers, newCustomer] }));
    return newCustomer;
  },

  updateCustomer: (id, data) => {
    set((state) => ({
      customers: state.customers.map((c) =>
        c.id === id ? { ...c, ...data, updatedAt: new Date() } : c,
      ),
    }));
  },

  deleteCustomer: (id) => {
    set((state) => ({
      customers: state.customers.filter((c) => c.id !== id),
    }));
  },

  addPet: (customerId, petData) => {
    const newPet: Pet = {
      ...petData,
      id: petIdCounter++,
      customerId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set((state) => ({
      customers: state.customers.map((c) =>
        c.id === customerId
          ? { ...c, pets: [...c.pets, newPet], updatedAt: new Date() }
          : c,
      ),
    }));
    return newPet;
  },

  updatePet: (customerId, petId, data) => {
    set((state) => ({
      customers: state.customers.map((c) =>
        c.id === customerId
          ? {
              ...c,
              pets: c.pets.map((p) =>
                p.id === petId ? { ...p, ...data, updatedAt: new Date() } : p,
              ),
              updatedAt: new Date(),
            }
          : c,
      ),
    }));
  },

  deletePet: (customerId, petId) => {
    set((state) => ({
      customers: state.customers.map((c) =>
        c.id === customerId
          ? {
              ...c,
              pets: c.pets.filter((p) => p.id !== petId),
              updatedAt: new Date(),
            }
          : c,
      ),
    }));
  },

  searchCustomers: (query) => {
    const { customers } = get();
    if (!query.trim()) return customers;

    const lowerQuery = query.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(lowerQuery) ||
        c.phone.includes(query) ||
        c.pets.some((p) => p.name.toLowerCase().includes(lowerQuery)),
    );
  },
}));

// Service Configuration Store (Pet Types & Sizes)
interface ServiceConfigStore {
  petTypes: PetTypeConfig[];
  sizes: SizeConfig[];
  loading: boolean;
  error: string | null;
  fetchPetTypes: () => Promise<void>;
  fetchSizes: (petTypeId?: string) => Promise<void>;
  addPetType: (petType: Omit<PetTypeConfig, "order" | "active">) => void;
  updatePetType: (id: string, data: Partial<PetTypeConfig>) => void;
  deletePetType: (id: string) => void;
  togglePetTypeStatus: (id: string) => void;
  reorderPetTypes: (petTypes: PetTypeConfig[]) => void;
  getSizesForPetType: (petTypeId: string) => SizeConfig[];
  addSize: (size: Omit<SizeConfig, "order" | "active">) => void;
  updateSize: (id: string, data: Partial<SizeConfig>) => void;
  deleteSize: (id: string) => void;
  toggleSizeStatus: (id: string) => void;
  reorderSizes: (sizes: SizeConfig[]) => void;
}

export const useServiceConfigStore = create<ServiceConfigStore>((set, get) => ({
  petTypes: [],
  sizes: [],
  loading: false,
  error: null,

  fetchPetTypes: async () => {
    try {
      set({ loading: true, error: null });

      const response = await fetch("/api/config/pet-types");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch pet types");
      }

      const data = await response.json();
      const formattedData = (data.data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        icon: item.icon,
        active: item.active,
        order: item.order_index,
      }));

      set({ petTypes: formattedData, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      // Fallback to default values on error
    }
  },

  fetchSizes: async (petTypeId?: string) => {
    try {
      set({ loading: true, error: null });

      const url = petTypeId
        ? `/api/config/pet-sizes?petTypeId=${petTypeId}`
        : "/api/config/pet-sizes";

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch pet sizes");
      }

      const data = await response.json();
      const formattedData = (data.data || []).map((item: any) => ({
        id: item.id,
        petTypeId: item.pet_type_id,
        name: item.name,
        minWeight: item.min_weight,
        maxWeight: item.max_weight,
        description: item.description,
        active: item.active,
        order: item.order_index,
      }));

      set({ sizes: formattedData, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      // Fallback to default values on error
    }
  },

  addPetType: (petTypeData) => {
    const maxOrder = Math.max(...get().petTypes.map((p) => p.order), 0);
    set((state) => ({
      petTypes: [
        ...state.petTypes,
        { ...petTypeData, order: maxOrder + 1, active: true },
      ],
    }));
  },

  updatePetType: (id, data) => {
    set((state) => ({
      petTypes: state.petTypes.map((p) =>
        p.id === id ? { ...p, ...data } : p,
      ),
    }));
  },

  deletePetType: (id) => {
    set((state) => ({
      petTypes: state.petTypes.filter((p) => p.id !== id),
      sizes: state.sizes.filter((s) => s.petTypeId !== id), // ลบ sizes ของประเภทนี้ด้วย
    }));
  },

  togglePetTypeStatus: (id) => {
    set((state) => ({
      petTypes: state.petTypes.map((p) =>
        p.id === id ? { ...p, active: !p.active } : p,
      ),
    }));
  },

  reorderPetTypes: (petTypes) => {
    set({ petTypes });
  },

  getSizesForPetType: (petTypeId) => {
    return get()
      .sizes.filter((s) => s.petTypeId === petTypeId)
      .sort((a, b) => a.order - b.order);
  },

  addSize: (sizeData) => {
    const sizesForType = get().sizes.filter(
      (s) => s.petTypeId === sizeData.petTypeId,
    );
    const maxOrder =
      sizesForType.length > 0
        ? Math.max(...sizesForType.map((s) => s.order))
        : 0;
    set((state) => ({
      sizes: [
        ...state.sizes,
        { ...sizeData, order: maxOrder + 1, active: true },
      ],
    }));
  },

  updateSize: (id, data) => {
    set((state) => ({
      sizes: state.sizes.map((s) => (s.id === id ? { ...s, ...data } : s)),
    }));
  },

  deleteSize: (id) => {
    set((state) => ({
      sizes: state.sizes.filter((s) => s.id !== id),
    }));
  },

  toggleSizeStatus: (id) => {
    set((state) => ({
      sizes: state.sizes.map((s) =>
        s.id === id ? { ...s, active: !s.active } : s,
      ),
    }));
  },

  reorderSizes: (sizes) => {
    set({ sizes });
  },
}));

// Service Store
interface ServiceStore {
  services: Service[];
  addService: (
    service: Omit<Service, "id" | "createdAt" | "updatedAt" | "active">,
  ) => Service;
  updateService: (id: number, data: Partial<Service>) => void;
  deleteService: (id: number) => void;
  toggleServiceStatus: (id: number) => void;
}

let serviceIdCounter = 1;

export const useServiceStore = create<ServiceStore>((set) => ({
  services: [],

  addService: (serviceData) => {
    const newService: Service = {
      ...serviceData,
      id: serviceIdCounter++,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set((state) => ({ services: [...state.services, newService] }));
    return newService;
  },

  updateService: (id, data) => {
    set((state) => ({
      services: state.services.map((s) =>
        s.id === id ? { ...s, ...data, updatedAt: new Date() } : s,
      ),
    }));
  },

  deleteService: (id) => {
    set((state) => ({
      services: state.services.filter((s) => s.id !== id),
    }));
  },

  toggleServiceStatus: (id) => {
    set((state) => ({
      services: state.services.map((s) =>
        s.id === id ? { ...s, active: !s.active, updatedAt: new Date() } : s,
      ),
    }));
  },
}));

// Promotion Store
interface PromotionStore {
  promotions: Promotion[];
  addPromotion: (promotion: Omit<Promotion, "id" | "createdAt">) => Promotion;
  updatePromotion: (id: number, data: Partial<Promotion>) => void;
  deletePromotion: (id: number) => void;
  togglePromotion: (id: number) => void;
}

let promotionIdCounter = 1;

export const usePromotionStore = create<PromotionStore>((set) => ({
  promotions: [],

  addPromotion: (promotionData) => {
    const newPromotion: Promotion = {
      ...promotionData,
      id: promotionIdCounter++,
      createdAt: new Date(),
    };
    set((state) => ({ promotions: [...state.promotions, newPromotion] }));
    return newPromotion;
  },

  updatePromotion: (id, data) => {
    set((state) => ({
      promotions: state.promotions.map((p) =>
        p.id === id ? { ...p, ...data } : p,
      ),
    }));
  },

  deletePromotion: (id) => {
    set((state) => ({
      promotions: state.promotions.filter((p) => p.id !== id),
    }));
  },

  togglePromotion: (id) => {
    set((state) => ({
      promotions: state.promotions.map((p) =>
        p.id === id ? { ...p, active: !p.active } : p,
      ),
    }));
  },
}));

// Booking Store
interface BookingStore {
  bookings: Booking[];
  addBooking: (booking: Omit<Booking, "id" | "createdAt">) => Booking;
  updateBooking: (id: number, data: Partial<Booking>) => void;
  deleteBooking: (id: number) => void;
  forfeitDeposit: (id: number) => void;
  refundDeposit: (id: number) => void;
  useDeposit: (id: number) => void;
  getBookingById: (id: number) => Booking | undefined;
}

let bookingIdCounter = 1;

export const useBookingStore = create<BookingStore>((set, get) => ({
  bookings: [],

  addBooking: (bookingData) => {
    const newBooking: Booking = {
      ...bookingData,
      id: bookingIdCounter++,
      createdAt: new Date(),
    };
    set((state) => ({ bookings: [...state.bookings, newBooking] }));
    return newBooking;
  },

  updateBooking: (id, data) => {
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === id ? { ...b, ...data } : b,
      ),
    }));
  },

  deleteBooking: (id) => {
    set((state) => ({
      bookings: state.bookings.filter((b) => b.id !== id),
    }));
  },

  forfeitDeposit: (id) => {
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === id
          ? {
              ...b,
              depositStatus: "FORFEITED" as const,
              depositForfeitedDate: new Date(),
            }
          : b,
      ),
    }));
  },

  refundDeposit: (id) => {
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === id
          ? { ...b, depositStatus: "NONE" as const, depositAmount: 0 }
          : b,
      ),
    }));
  },

  useDeposit: (id) => {
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === id ? { ...b, depositStatus: "USED" as const } : b,
      ),
    }));
  },

  getBookingById: (id) => {
    return get().bookings.find((b) => b.id === id);
  },
}));

// POS Store
export interface CartItem {
  id: string;
  serviceId: number;
  serviceName: string;
  originalPrice: number;
  finalPrice: number;
  isPriceModified: boolean;
  itemType?: "SERVICE" | "PRODUCT";
  productId?: number | null;
  quantity?: number;
  maxQuantity?: number | null;
  petId: number | null;
  petName?: string;
  petType?: "DOG" | "CAT";
}

interface POSStore {
  cart: CartItem[];
  selectedCustomerId: number | null;
  selectedPetIds: number[];
  selectedBookingId: number | null;
  selectedHotelBookingId: number | null;
  appliedPromotionId: number | null;
  _cartCounter: number;
  addToCart: (item: Omit<CartItem, "id">) => void;
  removeFromCart: (id: string) => void;
  updateCartItemPrice: (id: string, price: number) => void;
  incrementCartItemQuantity: (id: string) => void;
  decrementCartItemQuantity: (id: string) => void;
  clearCart: () => void;
  setSelectedCustomer: (customerId: number | null) => void;
  togglePetSelection: (petId: number) => void;
  setSelectedBooking: (bookingId: number | null) => void;
  setAppliedPromotion: (promotionId: number | null) => void;
  setHotelBooking: (
    customerId: number | null,
    hotelBookingId: number | null,
  ) => void;
  resetPOS: () => void;
}

export const usePOSStore = create<POSStore>((set, get) => ({
  cart: [],
  selectedCustomerId: null,
  selectedPetIds: [],
  selectedBookingId: null,
  selectedHotelBookingId: null,
  appliedPromotionId: null,
  _cartCounter: 0,

  addToCart: (item) => {
    set((state) => {
      const itemType = item.itemType || "SERVICE";
      const qty = item.quantity ?? 1;

      if (itemType === "PRODUCT" && item.productId) {
        const existingIndex = state.cart.findIndex(
          (c) =>
            (c.itemType || "SERVICE") === "PRODUCT" &&
            c.productId === item.productId,
        );

        if (existingIndex >= 0) {
          const existing = state.cart[existingIndex];
          const existingQty = existing.quantity ?? 1;
          const maxQty = existing.maxQuantity ?? item.maxQuantity ?? null;
          const nextQty = maxQty
            ? Math.min(existingQty + qty, maxQty)
            : existingQty + qty;

          return {
            cart: state.cart.map((c, idx) =>
              idx === existingIndex
                ? {
                    ...c,
                    quantity: nextQty,
                    maxQuantity: maxQty,
                  }
                : c,
            ),
          };
        }
      }

      return {
        cart: [
          ...state.cart,
          {
            ...item,
            itemType,
            productId: item.productId ?? null,
            quantity: qty,
            maxQuantity: item.maxQuantity ?? null,
            id: `cart-${state._cartCounter}-${item.serviceId}`,
          },
        ],
        _cartCounter: state._cartCounter + 1,
      };
    });
  },

  removeFromCart: (id) => {
    set((state) => ({
      cart: state.cart.filter((item) => item.id !== id),
    }));
  },

  updateCartItemPrice: (id, price) => {
    set((state) => ({
      cart: state.cart.map((item) =>
        item.id === id
          ? {
              ...item,
              finalPrice: price,
              isPriceModified: price !== item.originalPrice,
            }
          : item,
      ),
    }));
  },

  incrementCartItemQuantity: (id) => {
    set((state) => ({
      cart: state.cart.map((item) => {
        if (item.id !== id) return item;
        const qty = item.quantity ?? 1;
        const maxQty = item.maxQuantity ?? null;
        if (maxQty && qty >= maxQty) return item;
        return { ...item, quantity: qty + 1 };
      }),
    }));
  },

  decrementCartItemQuantity: (id) => {
    set((state) => {
      const target = state.cart.find((c) => c.id === id);
      if (!target) return { cart: state.cart };
      const qty = target.quantity ?? 1;

      if (qty <= 1) {
        return { cart: state.cart.filter((c) => c.id !== id) };
      }

      return {
        cart: state.cart.map((item) =>
          item.id === id
            ? { ...item, quantity: (item.quantity ?? 1) - 1 }
            : item,
        ),
      };
    });
  },

  clearCart: () => {
    set({ cart: [] });
  },

  setSelectedCustomer: (customerId) => {
    set({ selectedCustomerId: customerId, selectedPetIds: [] });
  },

  togglePetSelection: (petId) => {
    set((state) => {
      const isSelected = state.selectedPetIds.includes(petId);
      return {
        selectedPetIds: isSelected
          ? state.selectedPetIds.filter((id) => id !== petId)
          : [...state.selectedPetIds, petId],
      };
    });
  },

  setSelectedBooking: (bookingId) => {
    set({ selectedBookingId: bookingId });
  },

  setAppliedPromotion: (promotionId) => {
    set({ appliedPromotionId: promotionId });
  },

  setHotelBooking: (customerId, hotelBookingId) => {
    const s = get();
    if (
      s.cart.length === 0 &&
      s.selectedCustomerId === customerId &&
      s.selectedPetIds.length === 0 &&
      s.selectedBookingId === null &&
      s.selectedHotelBookingId === hotelBookingId &&
      s.appliedPromotionId === null
    )
      return;
    set({
      cart: [],
      selectedCustomerId: customerId,
      selectedPetIds: [],
      selectedBookingId: null,
      selectedHotelBookingId: hotelBookingId,
      appliedPromotionId: null,
    });
  },

  resetPOS: () => {
    const s = get();
    if (
      s.cart.length === 0 &&
      s.selectedCustomerId === null &&
      s.selectedPetIds.length === 0 &&
      s.selectedBookingId === null &&
      s.selectedHotelBookingId === null &&
      s.appliedPromotionId === null
    )
      return;
    set({
      cart: [],
      selectedCustomerId: null,
      selectedPetIds: [],
      selectedBookingId: null,
      selectedHotelBookingId: null,
      appliedPromotionId: null,
    });
  },
}));
