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
    selectedPetId,
    selectedBookingId,
    setSelectedCustomer,
    setSelectedPet,
  } = usePOSStore();
  const { getBookingById } = useBookingStore();

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const selectedPet = selectedCustomer?.pets.find((p) => p.id === selectedPetId);
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
    // Auto-select first pet if available
    if (customer?.pets.length === 1) {
      setSelectedPet(customer.pets[0].id);
    } else {
      setSelectedPet(null);
    }
    setSearchQuery("");
  };

  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setSelectedPet(null);
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
              <Badge variant="outline" className="text-xs">
                {booking.serviceType}
              </Badge>
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
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearCustomer}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {selectedCustomer.pets.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">เลือกสัตว์เลี้ยง</label>
                <Select
                  value={selectedPetId?.toString() || ""}
                  onValueChange={(value) => setSelectedPet(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกสัตว์เลี้ยง" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCustomer.pets.map((pet) => (
                      <SelectItem key={pet.id} value={pet.id.toString()}>
                        <div className="flex items-center gap-2">
                          {pet.type === "DOG" ? (
                            <Dog className="h-4 w-4 text-dog" />
                          ) : (
                            <Cat className="h-4 w-4 text-cat" />
                          )}
                          <span>{pet.name}</span>
                          <span className="text-muted-foreground">
                            ({pet.breed}, {pet.weight} kg)
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedPet && (
                  <div
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border",
                      selectedPet.type === "DOG"
                        ? "bg-dog/5 border-dog/20"
                        : "bg-cat/5 border-cat/20"
                    )}
                  >
                    {selectedPet.type === "DOG" ? (
                      <Dog className="h-8 w-8 text-dog" />
                    ) : (
                      <Cat className="h-8 w-8 text-cat" />
                    )}
                    <div>
                      <p className="font-medium">{selectedPet.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedPet.breed} - {selectedPet.weight} kg
                      </p>
                    </div>
                  </div>
                )}
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
                  className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors text-left"
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
                            : "bg-cat/10 text-cat"
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
