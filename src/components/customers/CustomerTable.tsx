import Link from "next/link";
import { Customer } from "@/types/customer";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge, Button } from "@/components/ui";

export interface CustomerTableProps {
  customers: Customer[];
}

export function CustomerTable({ customers }: CustomerTableProps) {
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      {/* Desktop & Tablet Table */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Created Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-mono text-xs font-semibold">
                  <Badge variant="primary">{customer.customer_code}</Badge>
                </TableCell>
                <TableCell className="font-medium text-slate-900 dark:text-white">
                  {customer.full_name}
                </TableCell>
                <TableCell>{customer.phone}</TableCell>
                <TableCell className="text-slate-500">
                  {customer.email || "—"}
                </TableCell>
                <TableCell className="text-slate-500">
                  {customer.city || "—"}
                </TableCell>
                <TableCell className="text-xs text-slate-500">
                  {formatDate(customer.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/customers/${customer.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                    <Link href={`/customers/${customer.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card List View */}
      <div className="sm:hidden space-y-3">
        {customers.map((customer) => (
          <div
            key={customer.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3"
          >
            <div className="flex items-center justify-between">
              <Badge variant="primary">{customer.customer_code}</Badge>
              <span className="text-xs text-slate-400">
                {formatDate(customer.created_at)}
              </span>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">
                {customer.full_name}
              </h4>
              <p className="text-xs text-slate-500">{customer.phone}</p>
              {customer.email && (
                <p className="text-xs text-slate-500 truncate">{customer.email}</p>
              )}
              {customer.city && (
                <p className="text-xs text-slate-400 mt-1">📍 {customer.city}</p>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Link href={`/customers/${customer.id}`} className="flex-1">
                <Button variant="outline" size="sm" fullWidth>
                  View
                </Button>
              </Link>
              <Link href={`/customers/${customer.id}/edit`} className="flex-1">
                <Button variant="ghost" size="sm" fullWidth>
                  Edit
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
