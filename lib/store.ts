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

// Default Pet Types for service pricing
const defaultPetTypes: PetTypeConfig[] = [
  { id: "DOG", name: "หมา", icon: "dog", order: 1, active: true },
  { id: "CAT", name: "แมว", icon: "cat", order: 2, active: true },
];

// Default Sizes for service pricing - แยกตามประเภทสัตว์
const defaultSizes: SizeConfig[] = [
  // หมา
  {
    id: "DOG_XS",
    petTypeId: "DOG",
    name: "XS",
    minWeight: 0,
    maxWeight: 2,
    description: "ไม่เกิน 2kg",
    order: 1,
    active: true,
  },
  {
    id: "DOG_S",
    petTypeId: "DOG",
    name: "S",
    minWeight: 2,
    maxWeight: 5,
    description: "2-5kg",
    order: 2,
    active: true,
  },
  {
    id: "DOG_M",
    petTypeId: "DOG",
    name: "M",
    minWeight: 5,
    maxWeight: 10,
    description: "5-10kg",
    order: 3,
    active: true,
  },
  {
    id: "DOG_L",
    petTypeId: "DOG",
    name: "L",
    minWeight: 10,
    maxWeight: 20,
    description: "10-20kg",
    order: 4,
    active: true,
  },
  {
    id: "DOG_XL",
    petTypeId: "DOG",
    name: "XL",
    minWeight: 20,
    maxWeight: undefined,
    description: "20kg ขึ้นไป",
    order: 5,
    active: true,
  },
  // แมว
  {
    id: "CAT_XS",
    petTypeId: "CAT",
    name: "XS",
    minWeight: 0,
    maxWeight: 1.5,
    description: "ไม่เกิน 1.5kg",
    order: 1,
    active: true,
  },
  {
    id: "CAT_S",
    petTypeId: "CAT",
    name: "S",
    minWeight: 1.5,
    maxWeight: 3,
    description: "1.5-3kg",
    order: 2,
    active: true,
  },
  {
    id: "CAT_M",
    petTypeId: "CAT",
    name: "M",
    minWeight: 3,
    maxWeight: 5,
    description: "3-5kg",
    order: 3,
    active: true,
  },
  {
    id: "CAT_L",
    petTypeId: "CAT",
    name: "L",
    minWeight: 5,
    maxWeight: 8,
    description: "5-8kg",
    order: 4,
    active: true,
  },
  {
    id: "CAT_XL",
    petTypeId: "CAT",
    name: "XL",
    minWeight: 8,
    maxWeight: undefined,
    description: "8kg ขึ้นไป",
    order: 5,
    active: true,
  },
];

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
  petTypes: defaultPetTypes,
  sizes: defaultSizes,

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
  petId: number | null;
  petName?: string;
  petType?: "DOG" | "CAT";
}

interface POSStore {
  cart: CartItem[];
  selectedCustomerId: number | null;
  selectedPetIds: number[];
  selectedBookingId: number | null;
  appliedPromotionId: number | null;
  addToCart: (item: Omit<CartItem, "id">) => void;
  removeFromCart: (id: string) => void;
  updateCartItemPrice: (id: string, price: number) => void;
  clearCart: () => void;
  setSelectedCustomer: (customerId: number | null) => void;
  togglePetSelection: (petId: number) => void;
  setSelectedBooking: (bookingId: number | null) => void;
  setAppliedPromotion: (promotionId: number | null) => void;
  resetPOS: () => void;
}

export const usePOSStore = create<POSStore>((set) => ({
  cart: [],
  selectedCustomerId: null,
  selectedPetIds: [],
  selectedBookingId: null,
  appliedPromotionId: null,

  addToCart: (item) => {
    set((state) => ({
      cart: [...state.cart, { ...item, id: `${Date.now()}-${Math.random()}` }],
    }));
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

  resetPOS: () => {
    set({
      cart: [],
      selectedCustomerId: null,
      selectedPetIds: [],
      selectedBookingId: null,
      appliedPromotionId: null,
    });
  },
}));
