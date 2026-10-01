"use client";

import React from "react";
import { VendorModal } from "./VendorModal";
import { Vendor } from "@/types/vendor";

export interface CreateVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVendorCreated: (newVendor?: Vendor) => void;
}

export function CreateVendorModal({
  isOpen,
  onClose,
  onVendorCreated,
}: CreateVendorModalProps) {
  return (
    <VendorModal
      isOpen={isOpen}
      onClose={onClose}
      onSuccess={onVendorCreated}
    />
  );
}
