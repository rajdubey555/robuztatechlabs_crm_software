"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Device, DeviceType } from "@/types/device";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Button,
} from "@/components/ui";
import { BRANCHES } from "@/types/branch";
import {
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Laptop,
  Monitor,
  Smartphone,
  Tablet,
  Plane,
  HelpCircle,
  Eye,
  Plus,
} from "lucide-react";

export interface DeviceTableProps {
  devices: Device[];
}

function getDeviceTypeIcon(type: DeviceType) {
  switch (type) {
    case "Laptop":
    case "MacBook":
      return <Laptop className="w-3.5 h-3.5" />;
    case "Desktop":
      return <Monitor className="w-3.5 h-3.5" />;
    case "iPhone":
    case "Android Phone":
      return <Smartphone className="w-3.5 h-3.5" />;
    case "Tablet":
      return <Tablet className="w-3.5 h-3.5" />;
    case "Drone":
      return <Plane className="w-3.5 h-3.5" />;
    default:
      return <HelpCircle className="w-3.5 h-3.5" />;
  }
}

export function DeviceTable({ devices }: DeviceTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20; // 20 records per page

  // Reset pagination when devices list changes
  useEffect(() => {
    setCurrentPage(1);
  }, [devices.length]);

  const totalPages = Math.ceil(devices.length / pageSize) || 1;
  const paginatedDevices = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return devices.slice(start, start + pageSize);
  }, [devices, currentPage, pageSize]);

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-3 w-full">
      {/* Desktop & Tablet Table */}
      <div className="hidden sm:block overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/75 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 py-3.5 pl-4 whitespace-nowrap">
                Device ID
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 py-3.5 whitespace-nowrap">
                Type
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 py-3.5">
                Brand & Model
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 py-3.5">
                Customer / Owner
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 py-3.5">
                Serial / IMEI
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 py-3.5 whitespace-nowrap">
                Branch
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 py-3.5 whitespace-nowrap">
                Registered Date
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 py-3.5 text-right pr-4 whitespace-nowrap">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedDevices.map((device) => {
              const isCopied = copiedId === device.device_code;
              const branchInfo = device.branch ? BRANCHES[device.branch] : null;

              return (
                <TableRow
                  key={device.id}
                  className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors border-b border-slate-100 dark:border-slate-800/60"
                >
                  {/* Single-Line Device ID with Copy */}
                  <TableCell className="py-3.5 pl-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={(e) => handleCopyCode(device.device_code, e)}
                      title="Click to copy Device ID"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors text-sm font-mono font-semibold"
                    >
                      <span className="whitespace-nowrap">{device.device_code}</span>
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                    </button>
                  </TableCell>

                  {/* Device Type with Lucide Icon */}
                  <TableCell className="py-3.5 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {getDeviceTypeIcon(device.device_type)}
                      <span>{device.device_type}</span>
                    </span>
                  </TableCell>

                  {/* Brand & Model (Bold text-sm) */}
                  <TableCell className="py-3.5 font-semibold text-sm text-slate-900 dark:text-slate-100">
                    <Link
                      href={`/devices/${device.id}`}
                      className="hover:text-[#009688] dark:hover:text-[#009688] transition-colors"
                    >
                      {device.brand} {device.model}
                    </Link>
                  </TableCell>

                  {/* Customer / Owner */}
                  <TableCell className="py-3.5">
                    {device.customer ? (
                      <div>
                        <Link
                          href={`/customers/${device.customer.id}`}
                          className="font-medium text-sm text-slate-900 hover:text-[#009688] dark:text-slate-100 dark:hover:text-[#009688] transition-colors block"
                        >
                          {device.customer.full_name}
                        </Link>
                        <span className="block text-xs text-slate-500 font-mono mt-0.5">
                          {device.customer.customer_code}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm">—</span>
                    )}
                  </TableCell>

                  {/* Serial / IMEI (Monospace text-sm) */}
                  <TableCell className="py-3.5 font-mono text-sm text-slate-600 dark:text-slate-300">
                    {device.serial_number || device.imei || "—"}
                  </TableCell>

                  {/* Branch */}
                  <TableCell className="py-3.5 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-slate-200">
                    {branchInfo ? branchInfo.shortName : "South Bopal Lab"}
                  </TableCell>

                  {/* Registered Date */}
                  <TableCell className="py-3.5 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                    {formatDate(device.created_at)}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="py-3.5 text-right pr-4 whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link href={`/jobs/new?customerId=${device.customer_id}&deviceId=${device.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 px-2.5 text-xs font-medium text-[#009688] hover:text-[#00796b]">
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Job
                        </Button>
                      </Link>

                      <Link href={`/devices/${device.id}`}>
                        <Button variant="outline" size="sm" className="h-8 px-3 text-xs font-medium">
                          <Eye className="w-3.5 h-3.5 mr-1 text-slate-500" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* Clean Enterprise Pagination Footer (20 per page) */}
        <div className="flex items-center justify-between px-4 py-3.5 border-t border-slate-200 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            Showing <strong className="text-slate-900 dark:text-slate-100 font-semibold">{(currentPage - 1) * pageSize + 1}</strong> to{" "}
            <strong className="text-slate-900 dark:text-slate-100 font-semibold">
              {Math.min(currentPage * pageSize, devices.length)}
            </strong>{" "}
            of <strong className="text-slate-900 dark:text-slate-100 font-semibold">{devices.length}</strong> devices
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-8 px-3 text-xs font-medium"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              Previous
            </Button>
            <span className="px-2 font-medium text-xs text-slate-700 dark:text-slate-300">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 px-3 text-xs font-medium"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Card List View */}
      <div className="sm:hidden space-y-3">
        {paginatedDevices.map((device) => (
          <div
            key={device.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                {device.device_code}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {getDeviceTypeIcon(device.device_type)}
                {device.device_type}
              </span>
            </div>

            <div>
              <Link
                href={`/devices/${device.id}`}
                className="font-bold text-sm text-slate-900 dark:text-white hover:text-[#009688] block"
              >
                {device.brand} {device.model}
              </Link>
              {device.customer && (
                <p className="text-xs text-slate-500 mt-1">
                  Owner:{" "}
                  <Link
                    href={`/customers/${device.customer.id}`}
                    className="font-medium text-slate-700 dark:text-slate-300 hover:text-[#009688]"
                  >
                    {device.customer.full_name}
                  </Link>
                </p>
              )}
              {(device.serial_number || device.imei) && (
                <p className="text-xs font-mono text-slate-400 mt-0.5">
                  S/N: {device.serial_number || device.imei}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Link href={`/jobs/new?customerId=${device.customer_id}&deviceId=${device.id}`} className="flex-1">
                <Button variant="primary" size="sm" fullWidth className="h-8 text-xs font-medium">
                  + Job
                </Button>
              </Link>
              <Link href={`/devices/${device.id}`} className="flex-1">
                <Button variant="outline" size="sm" fullWidth className="h-8 text-xs font-medium">
                  View
                </Button>
              </Link>
            </div>
          </div>
        ))}

        {/* Mobile Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="h-8 px-2.5"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 px-2.5"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
