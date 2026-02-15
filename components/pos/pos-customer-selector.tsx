"use client";

import { useState } from "react";
import { Search, User, Dog, Cat, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCustomerStore, usePOSStore, useBookingStore } from "@/lib/store";
import { cn, formatPhoneDisplay } from "@/lib/utils";

export function POSCustomerSelector() {
  const [searchQuery, setSearchQuery] = useState("");
  const { customers, searchCustomers } = useCustomerStore();
  const {
    selectedCustomerId,
    selectedPetIds,
    selectedBookingId,
    setSelectedCustomer,
    togglePetSelection,
  } = usePOSStore();
  const { getBookingById } = useBookingStore();

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const selectedPets =
    selectedCustomer?.pets.filter((p) => selectedPetIds.includes(p.id)) || [];
  const booking = selectedBookingId ? getBookingById(selectedBookingId) : null;

  const filteredCustomers = searchQuery
    ? searchCustomers(searchQuery)
    : customers.slice(0, 5);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleSelectCustomer = (customerId: number) => {
    const customer = customers.find((c) => c.id === customerId);
    setSelectedCustomer(customerId);
    setSearchQuery("");
  };

  const handleClearCustomer = () => {
    setSelectedCustomer(null);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5" />
          ข้อมูลลูกค้า
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {booking && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-sm font-medium text-primary">
              จากนัดหมาย: {booking.customerName}
            </p>
            <div className="flex items-center gap-2 mt-1">
              {booking.depositStatus === "HELD" && (
                <Badge className="text-xs bg-success/10 text-success">
                  มัดจำ {formatCurrency(booking.depositAmount)}
                </Badge>
              )}
            </div>
          </div>
        )}

        {selectedCustomer ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
              <div>
                <p className="font-medium">{selectedCustomer.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatPhoneDisplay(selectedCustomer.phone)}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClearCustomer}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {selectedCustomer.pets.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  เลือกสัตว์เลี้ยง (เลือกได้หลายตัว)
                </label>
                <div className="grid gap-2">
                  {selectedCustomer.pets.map((pet) => {
                    const isSelected = selectedPetIds.includes(pet.id);
                    return (
                      <button
                        key={pet.id}
                        type="button"
                        onClick={() => togglePetSelection(pet.id)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border transition-all text-left cursor-pointer",
                          isSelected
                            ? pet.type === "DOG"
                              ? "bg-dog/10 border-dog/50"
                              : "bg-cat/10 border-cat/50"
                            : "hover:bg-accent/50",
                        )}
                      >
                        {pet.type === "DOG" ? (
                          <Dog
                            className={cn(
                              "h-6 w-6",
                              isSelected ? "text-dog" : "text-muted-foreground",
                            )}
                          />
                        ) : (
                          <Cat
                            className={cn(
                              "h-6 w-6",
                              isSelected ? "text-cat" : "text-muted-foreground",
                            )}
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{pet.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {pet.breed} -{" "}
                            {pet.weight ? `${pet.weight} kg` : "ไม่ระบุน้ำหนัก"}
                          </p>
                        </div>
                        {isSelected && (
                          <Badge className="bg-primary">เลือกแล้ว</Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="ค้นหาลูกค้า (ชื่อ, เบอร์โทร, ชื่อสัตว์)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {filteredCustomers.map((customer) => (
                <button
                  type="button"
                  key={customer.id}
                  onClick={() => handleSelectCustomer(customer.id)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors text-left cursor-pointer"
                >
                  <div>
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatPhoneDisplay(customer.phone)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {customer.pets.map((pet) => (
                      <div
                        key={pet.id}
                        className={cn(
                          "h-6 w-6 rounded-full flex items-center justify-center",
                          pet.type === "DOG"
                            ? "bg-dog/10 text-dog"
                            : "bg-cat/10 text-cat",
                        )}
                      >
                        {pet.type === "DOG" ? (
                          <Dog className="h-3 w-3" />
                        ) : (
                          <Cat className="h-3 w-3" />
                        )}
                      </div>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
