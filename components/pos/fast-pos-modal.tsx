"use client";

import { useEffect } from "react";
import { Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FastPOSProvider, useFastPOS } from "./fast-pos-context";
import { FastPOSStep1Customer } from "./fast-pos-step-1-customer";
import { FastPOSStep2Pet } from "./fast-pos-step-2-pet";
import { FastPOSStep3Service } from "./fast-pos-step-3-service";
import { FastPOSStep4Review } from "./fast-pos-step-4-review";

interface FastPOSModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STEP_LABELS = [
  "ข้อมูลลูกค้า",
  "สัตว์เลี้ยง",
  "เลือกบริการ",
  "ตรวจสอบ",
];

function FastPOSInner({ onClose }: { onClose: () => void }) {
  const { state, reset } = useFastPOS();
  const step = state.currentStep;

  useEffect(() => {
    return () => {
      // no-op cleanup; reset is called on close
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* Progress steps */}
      <div className="flex items-center gap-0.5">
        {STEP_LABELS.map((label, i) => {
          const stepNum = i + 1;
          const done = step > stepNum;
          const active = step === stepNum;
          return (
            <div key={i} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-0.5 flex-1">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    done
                      ? "bg-primary text-primary-foreground"
                      : active
                        ? "bg-primary/20 text-primary border-2 border-primary"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {done ? "✓" : stepNum}
                </div>
                <span
                  className={`text-xs hidden sm:block truncate max-w-[60px] text-center ${
                    active
                      ? "text-primary font-medium"
                      : done
                        ? "text-primary/70"
                        : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-1 transition-colors ${
                    step > stepNum ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div className="text-sm text-muted-foreground font-medium">
        ขั้นตอน {step}/4 — {STEP_LABELS[step - 1]}
      </div>

      {step === 1 && <FastPOSStep1Customer />}
      {step === 2 && <FastPOSStep2Pet />}
      {step === 3 && <FastPOSStep3Service />}
      {step === 4 && <FastPOSStep4Review onClose={onClose} />}
    </div>
  );
}

export function FastPOSModal({ open, onOpenChange }: FastPOSModalProps) {
  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            สร้างรายการด่วน
          </DialogTitle>
        </DialogHeader>

        <FastPOSProvider>
          <FastPOSInner onClose={handleClose} />
        </FastPOSProvider>
      </DialogContent>
    </Dialog>
  );
}
