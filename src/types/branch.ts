export type BranchId = "all" | "south_bopal" | "tragad";
export type CategoryType = "all" | "laptop_general" | "drone";

export interface BranchInfo {
  id: "south_bopal" | "tragad";
  name: string;
  shortName: string;
  subtitle: string;
  address: string;
  phone: string;
  badgeColor: string;
  badgeBg: string;
  textColor: string;
}

export interface CategoryInfo {
  id: "laptop_general" | "drone";
  name: string;
  shortName: string;
  icon: string;
  badgeColor: string;
  badgeBg: string;
  textColor: string;
}

export const BRANCHES: Record<"south_bopal" | "tragad", BranchInfo> = {
  south_bopal: {
    id: "south_bopal",
    name: "South Bopal Flagship Repair Lab",
    shortName: "South Bopal Lab",
    subtitle: "Main Flagship Lab • South Bopal",
    address: "103, 1st Floor, Sun South Winds, Safal Parisar Rd, South Bopal, Ahmedabad",
    phone: "+91 999 245 2459",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
    badgeBg: "bg-emerald-500",
    textColor: "text-emerald-700 dark:text-emerald-300",
  },
  tragad: {
    id: "tragad",
    name: "Tragad Service Centre",
    shortName: "Tragad Centre",
    subtitle: "Branch Repair Lab • Tragad",
    address: "Shop 12, Ground Floor, Commercial Hub, Tragad Road, Chandkheda, Ahmedabad",
    phone: "+91 999 245 2459",
    badgeColor: "bg-sky-50 text-sky-800 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800",
    badgeBg: "bg-sky-500",
    textColor: "text-sky-700 dark:text-sky-300",
  },
};

export const CATEGORIES: Record<"laptop_general" | "drone", CategoryInfo> = {
  laptop_general: {
    id: "laptop_general",
    name: "Laptop & General Devices",
    shortName: "Laptop & General",
    icon: "💻",
    badgeColor: "bg-indigo-50 text-indigo-800 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800",
    badgeBg: "bg-indigo-500",
    textColor: "text-indigo-700 dark:text-indigo-300",
  },
  drone: {
    id: "drone",
    name: "Drone Repair Hub",
    shortName: "Drone Lab",
    icon: "🛸",
    badgeColor: "bg-purple-50 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800",
    badgeBg: "bg-purple-500",
    textColor: "text-purple-700 dark:text-purple-300",
  },
};
