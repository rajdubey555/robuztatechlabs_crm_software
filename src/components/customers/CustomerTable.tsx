"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Customer } from "@/types/customer";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Button,
} from "@/components/ui";
import {
  Eye,
  Pencil,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { BRANCHES } from "@/types/branch";

export interface CustomerTableProps {
  customers: Customer[];
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function CustomerTable({ customers }: CustomerTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20; // 20 records per page

  const totalPages = Math.ceil(customers.length / pageSize) || 1;
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return customers.slice(start, start + pageSize);
  }, [customers, currentPage, pageSize]);

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
    <div className="space-y-3">
      {/* Desktop & Tablet Table */}
      <div className="hidden sm:block overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/75 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 py-3.5 pl-4">
                Customer Name
              </TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 py-3.5 whitespace-nowrap">
                Customer ID
              </TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 py-3.5 whitespace-nowrap">
                Phone
              </TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 py-3.5">
                Email
              </TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 py-3.5">
                City
              </TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 py-3.5 whitespace-nowrap">
                Branch
              </TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 py-3.5 whitespace-nowrap">
                Created Date
              </TableHead>
              <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 py-3.5 text-right pr-4">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCustomers.map((customer) => {
              const initials = getInitials(customer.full_name);
              const cleanPhone = customer.phone.replace(/[^0-9]/g, "");
              const waNumber = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
              const isCopied = copiedId === customer.customer_code;

              return (
                <TableRow
                  key={customer.id}
                  className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors border-b border-slate-100 dark:border-slate-800/60"
                >
                  {/* Name + Initials */}
                  <TableCell className="py-3.5 pl-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200 dark:border-slate-700">
                        {initials}
                      </div>
                      <Link
                        href={`/customers/${customer.id}`}
                        className="font-semibold text-sm text-slate-900 dark:text-slate-100 hover:text-[#009688] dark:hover:text-[#009688] transition-colors"
                      >
                        {customer.full_name}
                      </Link>
                    </div>
                  </TableCell>

                  {/* Customer ID (Slightly Bigger, Clear Single Line) */}
                  <TableCell className="py-3.5 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={(e) => handleCopyCode(customer.customer_code, e)}
                      title="Click to copy ID"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors text-sm font-mono font-semibold"
                    >
                      <span className="whitespace-nowrap">{customer.customer_code}</span>
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 shrink-0" />
                      )}
                    </button>
                  </TableCell>

                  {/* Phone (Bigger Font text-sm) */}
                  <TableCell className="py-3.5 whitespace-nowrap">
                    <a
                      href={`tel:${customer.phone}`}
                      className="text-sm font-medium text-slate-900 dark:text-slate-100 hover:text-[#009688]"
                    >
                      {customer.phone}
                    </a>
                  </TableCell>

                  {/* Email (Bigger Font text-sm) */}
                  <TableCell className="py-3.5 text-sm text-slate-700 dark:text-slate-300">
                    {customer.email ? (
                      <a href={`mailto:${customer.email}`} className="hover:underline">
                        {customer.email}
                      </a>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </TableCell>

                  {/* City (Bigger Font text-sm) */}
                  <TableCell className="py-3.5 text-sm font-medium text-slate-800 dark:text-slate-200">
                    {customer.city || "—"}
                  </TableCell>

                  {/* Branch (Bigger Font text-sm, No Dot) */}
                  <TableCell className="py-3.5 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-slate-200">
                    {customer.branch === "south_bopal"
                      ? "South Bopal"
                      : customer.branch === "tragad"
                      ? "Tragad Lab"
                      : "Both Labs"}
                  </TableCell>

                  {/* Created Date (Bigger Font text-sm) */}
                  <TableCell className="py-3.5 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                    {formatDate(customer.created_at)}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="py-3.5 text-right pr-4 whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link href={`/customers/${customer.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-xs font-medium"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1 text-slate-500" />
                          View
                        </Button>
                      </Link>

                      <Link href={`/customers/${customer.id}/edit`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* Professional Pagination Footer (20 per page) */}
        <div className="flex items-center justify-between px-4 py-3.5 border-t border-slate-200 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            Showing <strong className="text-slate-900 dark:text-slate-100 font-semibold">{(currentPage - 1) * pageSize + 1}</strong> to{" "}
            <strong className="text-slate-900 dark:text-slate-100 font-semibold">
              {Math.min(currentPage * pageSize, customers.length)}
            </strong>{" "}
            of <strong className="text-slate-900 dark:text-slate-100 font-semibold">{customers.length}</strong> customers
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
      <div className="sm:hidden space-y-2.5">
        {paginatedCustomers.map((customer) => {
          const initials = getInitials(customer.full_name);
          const cleanPhone = customer.phone.replace(/[^0-9]/g, "");
          const waNumber = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

          return (
            <div
              key={customer.id}
              className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs border border-slate-200 dark:border-slate-700">
                    {initials}
                  </div>
                  <div>
                    <Link
                      href={`/customers/${customer.id}`}
                      className="font-semibold text-sm text-slate-900 dark:text-white"
                    >
                      {customer.full_name}
                    </Link>
                    <span className="font-mono text-xs text-slate-500 block">
                      {customer.customer_code}
                    </span>
                  </div>
                </div>

                {customer.branch && (
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    {BRANCHES[customer.branch === "both" ? "south_bopal" : customer.branch]?.shortName || customer.branch}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-sm pt-1 border-t border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                <a href={`tel:${customer.phone}`} className="font-medium text-slate-900 dark:text-slate-100">
                  {customer.phone}
                </a>
                <span>{customer.city || "—"}</span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Link href={`/customers/${customer.id}`} className="flex-1">
                  <Button variant="outline" size="sm" fullWidth className="h-8 text-xs font-medium">
                    View Profile
                  </Button>
                </Link>
                <Link href={`/customers/${customer.id}/edit`}>
                  <Button variant="ghost" size="sm" className="h-8 px-2.5">
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          );
        })}

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
