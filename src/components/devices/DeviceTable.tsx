import Link from "next/link";
import { Device } from "@/types/device";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge, Button } from "@/components/ui";

export interface DeviceTableProps {
  devices: Device[];
}

export function DeviceTable({ devices }: DeviceTableProps) {
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
              <TableHead>Device ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Brand & Model</TableHead>
              <TableHead>Serial / IMEI</TableHead>
              <TableHead>Created Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devices.map((device) => (
              <TableRow key={device.id}>
                <TableCell className="font-mono text-xs font-semibold">
                  <Badge variant="primary">{device.device_code}</Badge>
                </TableCell>
                <TableCell>
                  {device.customer ? (
                    <div>
                      <Link
                        href={`/customers/${device.customer.id}`}
                        className="font-medium text-slate-900 hover:text-[#009688] dark:text-white dark:hover:text-[#009688]"
                      >
                        {device.customer.full_name}
                      </Link>
                      <span className="block text-xs font-mono text-slate-400">
                        {device.customer.customer_code}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="default">{device.device_type}</Badge>
                </TableCell>
                <TableCell className="font-medium text-slate-900 dark:text-white">
                  {device.brand} {device.model}
                </TableCell>
                <TableCell className="font-mono text-xs text-slate-500">
                  {device.serial_number || device.imei || "—"}
                </TableCell>
                <TableCell className="text-xs text-slate-500">
                  {formatDate(device.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/devices/${device.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                    <Link href={`/devices/${device.id}/edit`}>
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
        {devices.map((device) => (
          <div
            key={device.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3"
          >
            <div className="flex items-center justify-between">
              <Badge variant="primary">{device.device_code}</Badge>
              <Badge variant="default">{device.device_type}</Badge>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">
                {device.brand} {device.model}
              </h4>
              {device.customer && (
                <p className="text-xs text-slate-500 mt-0.5">
                  Owner:{" "}
                  <Link
                    href={`/customers/${device.customer.id}`}
                    className="font-medium text-[#009688]"
                  >
                    {device.customer.full_name} ({device.customer.customer_code})
                  </Link>
                </p>
              )}
              {(device.serial_number || device.imei) && (
                <p className="text-xs font-mono text-slate-400 mt-1">
                  S/N: {device.serial_number || device.imei}
                </p>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Link href={`/devices/${device.id}`} className="flex-1">
                <Button variant="outline" size="sm" fullWidth>
                  View
                </Button>
              </Link>
              <Link href={`/devices/${device.id}/edit`} className="flex-1">
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
