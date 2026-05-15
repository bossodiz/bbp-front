"use client";

import { useState, useEffect, useRef } from "react";
import { Search, User, Dog, Cat, UserPlus, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn, formatPhoneDisplay } from "@/lib/utils";
import { useFastPOS } from "./fast-pos-context";

interface CustomerSearchResult {
  id: number;
  name: string;
  phone: string;
  pets: Array<{
    id: number;
    name: string;
    type: "DOG" | "CAT";
    breed: string;
    weight: number | null;
  }>;
  lastTransactionDate?: string;
}

export function FastPOSStep1Customer() {
  const { state, setCustomer, setPets, nextStep } = useFastPOS();

  const [nameQuery, setNameQuery] = useState(state.customer?.name ?? "");
  const [phone, setPhone] = useState(
    state.customer?.phone === "0000000000" ? "" : (state.customer?.phone ?? ""),
  );
  const [searchResults, setSearchResults] = useState<CustomerSearchResult[]>(
    [],
  );
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [detectedCustomer, setDetectedCustomer] =
    useState<CustomerSearchResult | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [creatingNew, setCreatingNew] = useState(!state.customer?.isExisting);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const skipNextFocusRef = useRef(false);

  // Auto-format phone display
  const formatPhoneInput = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 10);
    return digits;
  };

  // Search customers by name (debounced)
  useEffect(() => {
    if (!nameQuery.trim() || nameQuery.length < 1) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/customers?search=${encodeURIComponent(nameQuery)}&limit=5`,
        );
        if (res.ok) {
          const json = await res.json();
          const results: CustomerSearchResult[] = (json.data ?? []).map(
            (c: any) => ({
              id: c.id,
              name: c.name,
              phone: c.phone ?? "",
              pets: (c.pets ?? []).map((p: any) => ({
                id: p.id,
                name: p.name,
                type: p.type,
                breed: p.breed,
                weight: p.weight ?? null,
              })),
            }),
          );
          setSearchResults(results);
          setShowDropdown(results.length > 0 || true); // always show to allow "create new"
        }
      } catch {
        // ignore search errors
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [nameQuery]);

  // Phone detection: trigger when 10 digits & not "0000000000"
  useEffect(() => {
    if (phone.length !== 10 || phone === "0000000000") {
      setDetectedCustomer(null);
      return;
    }

    const detect = async () => {
      setIsDetecting(true);
      try {
        const res = await fetch(`/api/customers?phone=${phone}`);
        if (res.ok) {
          const json = await res.json();
          const found = json.data?.[0] ?? null;
          if (found) {
            setDetectedCustomer({
              id: found.id,
              name: found.name,
              phone: found.phone ?? phone,
              pets: (found.pets ?? []).map((p: any) => ({
                id: p.id,
                name: p.name,
                type: p.type,
                breed: p.breed,
                weight: p.weight ?? null,
              })),
            });
          } else {
            setDetectedCustomer(null);
          }
        }
      } catch {
        setDetectedCustomer(null);
      } finally {
        setIsDetecting(false);
      }
    };

    detect();
  }, [phone]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelectExistingCustomer = (customer: CustomerSearchResult) => {
    setNameQuery(customer.name);
    setPhone(customer.phone === "0000000000" ? "" : customer.phone);
    setShowDropdown(false);
    setCreatingNew(false);
    setDetectedCustomer(null);

    setCustomer({
      id: customer.id,
      name: customer.name,
      phone: customer.phone || "0000000000",
      isExisting: true,
    });

    // Pre-fill pets from existing customer (all selected by default)
    setPets(
      customer.pets.map((p) => ({
        id: p.id,
        name: p.name,
        type: p.type,
        breed: p.breed,
        weight: p.weight ?? undefined,
        selected: true,
        isExisting: true,
      })),
    );

    // Jump straight to Step 2
    nextStep();
  };

  const handleUseDetectedCustomer = () => {
    if (!detectedCustomer) return;
    handleSelectExistingCustomer(detectedCustomer);
  };

  const handleCreateNew = () => {
    setCreatingNew(true);
    setShowDropdown(false);
    setDetectedCustomer(null);
    setCustomer({
      name: nameQuery,
      phone: phone || "0000000000",
      isExisting: false,
    });
    setPets([]);
  };

  const handleNext = () => {
    const finalPhone = phone.trim() || "0000000000";
    setCustomer({
      id: state.customer?.isExisting ? state.customer.id : undefined,
      name: nameQuery.trim(),
      phone: finalPhone,
      isExisting: state.customer?.isExisting ?? false,
    });
    nextStep();
  };

  const canNext = nameQuery.trim().length > 0;
  return (
    <div className="space-y-5">
      {/* Customer Name Autocomplete */}
      {!isDetecting && !detectedCustomer && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            ชื่อลูกค้า <span className="text-destructive">*</span>
          </label>

          <div className="relative" ref={dropdownRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="ค้นหา หรือพิมพ์ชื่อลูกค้าใหม่"
                value={nameQuery}
                onChange={(e) => {
                  setNameQuery(e.target.value);
                  setCreatingNew(false);
                  setShowDropdown(true);
                  // Clear existing customer if they start re-typing
                  if (state.customer?.isExisting) {
                    setCustomer({
                      name: e.target.value,
                      phone: phone || "0000000000",
                      isExisting: false,
                    });
                    setPets([]);
                  }
                }}
                onFocus={() => {
                  if (skipNextFocusRef.current) {
                    skipNextFocusRef.current = false;
                    return;
                  }
                  if (nameQuery) setShowDropdown(true);
                }}
                className="pl-10"
              />
            </div>

            {/* Dropdown */}
            {showDropdown && nameQuery.length > 0 && (
              <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
                {isSearching && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    กำลังค้นหา...
                  </div>
                )}

                {!isSearching && searchResults.length > 0 && (
                  <div className="max-h-52 overflow-y-auto">
                    {searchResults.map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        onClick={() => handleSelectExistingCustomer(customer)}
                        className="flex w-full items-start gap-3 px-3 py-2.5 text-left hover:bg-accent transition-colors"
                      >
                        <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {customer.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {customer.phone
                                ? formatPhoneDisplay(customer.phone)
                                : "-"}
                            </span>
                          </div>
                          {customer.pets.length > 0 && (
                            <div className="flex items-center gap-1 mt-0.5">
                              {customer.pets.map((p) =>
                                p.type === "DOG" ? (
                                  <Dog
                                    key={p.id}
                                    className="h-3 w-3 text-dog"
                                  />
                                ) : (
                                  <Cat
                                    key={p.id}
                                    className="h-3 w-3 text-cat"
                                  />
                                ),
                              )}
                              <span className="text-xs text-muted-foreground">
                                {customer.pets.map((p) => p.name).join(", ")}
                              </span>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Create new option */}
                <button
                  type="button"
                  onClick={handleCreateNew}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-primary hover:bg-primary/5 transition-colors border-t"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>+ สร้างลูกค้าใหม่ &ldquo;{nameQuery}&rdquo;</span>
                </button>
              </div>
            )}
          </div>

          {/* Phone Field */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              เบอร์โทรศัพท์{" "}
              <span className="text-xs text-muted-foreground font-normal">
                (ไม่บังคับ)
              </span>
            </label>
            <Input
              type="tel"
              placeholder="000-000-0000"
              value={phone}
              onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
              maxLength={10}
              disabled={state.customer?.isExisting}
            />
          </div>
        </div>
      )}
      {/* Phone Detection Alert */}
      {isDetecting && (
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
          กำลังตรวจสอบข้อมูล...
        </div>
      )}

      {!isDetecting && detectedCustomer && (
        <div className="rounded-lg border border-success/30 bg-success/5 p-3 space-y-2">
          <div className="flex items-center gap-2 text-success text-sm font-medium">
            <CheckCircle className="h-4 w-4" />
            พบข้อมูลลูกค้า
          </div>
          <div className="text-sm space-y-0.5">
            <p className="font-medium">{detectedCustomer.name}</p>
            <p className="text-muted-foreground">
              {formatPhoneDisplay(detectedCustomer.phone)}
            </p>
            {detectedCustomer.pets.length > 0 && (
              <div className="flex items-center gap-1 mt-1">
                {detectedCustomer.pets.map((p) =>
                  p.type === "DOG" ? (
                    <Dog key={p.id} className="h-3.5 w-3.5 text-dog" />
                  ) : (
                    <Cat key={p.id} className="h-3.5 w-3.5 text-cat" />
                  ),
                )}
                <span className="text-xs text-muted-foreground">
                  {detectedCustomer.pets.map((p) => p.name).join(", ")}
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              onClick={handleUseDetectedCustomer}
              className="flex-1"
            >
              ใช้ลูกค้านี้
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                skipNextFocusRef.current = true;
                setDetectedCustomer(null);
                setCreatingNew(true);
                setPhone("");
                setCustomer({
                  name: nameQuery,
                  phone: phone || "",
                  isExisting: false,
                });
                setPets([]);
              }}
              className="flex-1"
            >
              สร้างใหม่
            </Button>
          </div>
        </div>
      )}

      {/* Footer buttons */}
      <div className="flex justify-end pt-2">
        <Button onClick={handleNext} disabled={!canNext}>
          ถัดไป →
        </Button>
      </div>
    </div>
  );
}
