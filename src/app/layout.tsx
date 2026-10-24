import type { Metadata } from "next";
import "./globals.css";
import { BranchProvider } from "@/context/BranchContext";
import { PermissionProvider } from "@/context/PermissionContext";

export const metadata: Metadata = {
  title: "Robuzta CRM | Multi-Branch & Drone/Laptop Repair Operations",
  description: "Robuzta CRM - Multi-Branch (South Bopal & Tragad) Laptop, Mobile & Drone Repair Management Portal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col font-sans bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <BranchProvider>
          <PermissionProvider>
            {children}
          </PermissionProvider>
        </BranchProvider>
      </body>
    </html>
  );
}
