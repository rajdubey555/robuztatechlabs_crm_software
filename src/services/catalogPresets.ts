export interface PresetItem {
  device_type: string;
  brand: string;
  model: string;
  category_type: "laptop_general" | "drone";
}

export const LAPTOP_PRESETS: PresetItem[] = [
  // Apple MacBooks
  { device_type: "MacBook", brand: "Apple", model: "MacBook Air 13\" M1 (2020)", category_type: "laptop_general" },
  { device_type: "MacBook", brand: "Apple", model: "MacBook Air 13\" M2 (2022)", category_type: "laptop_general" },
  { device_type: "MacBook", brand: "Apple", model: "MacBook Air 15\" M2 (2023)", category_type: "laptop_general" },
  { device_type: "MacBook", brand: "Apple", model: "MacBook Air 13\" M3 (2024)", category_type: "laptop_general" },
  { device_type: "MacBook", brand: "Apple", model: "MacBook Air 15\" M3 (2024)", category_type: "laptop_general" },
  { device_type: "MacBook", brand: "Apple", model: "MacBook Pro 13\" M1 (2020)", category_type: "laptop_general" },
  { device_type: "MacBook", brand: "Apple", model: "MacBook Pro 13\" M2 (2022)", category_type: "laptop_general" },
  { device_type: "MacBook", brand: "Apple", model: "MacBook Pro 14\" M1 Pro", category_type: "laptop_general" },
  { device_type: "MacBook", brand: "Apple", model: "MacBook Pro 16\" M1 Max", category_type: "laptop_general" },
  { device_type: "MacBook", brand: "Apple", model: "MacBook Pro 14\" M2 Pro", category_type: "laptop_general" },
  { device_type: "MacBook", brand: "Apple", model: "MacBook Pro 16\" M2 Max", category_type: "laptop_general" },
  { device_type: "MacBook", brand: "Apple", model: "MacBook Pro 14\" M3 / M3 Pro", category_type: "laptop_general" },
  { device_type: "MacBook", brand: "Apple", model: "MacBook Pro 16\" M3 Max", category_type: "laptop_general" },
  { device_type: "MacBook", brand: "Apple", model: "MacBook Pro 14\" M4 Pro (2024)", category_type: "laptop_general" },
  { device_type: "MacBook", brand: "Apple", model: "MacBook Pro 16\" M4 Max (2024)", category_type: "laptop_general" },

  // Dell
  { device_type: "Laptop", brand: "Dell", model: "Inspiron 15 3511 / 3520", category_type: "laptop_general" },
  { device_type: "Laptop", brand: "Dell", model: "Inspiron 14 5420 / 5430", category_type: "laptop_general" },
  { device_type: "Laptop", brand: "Dell", model: "Vostro 3420 / 3510 / 3520", category_type: "laptop_general" },
  { device_type: "Laptop", brand: "Dell", model: "XPS 13 9315 / 9320 Plus", category_type: "laptop_general" },
  { device_type: "Laptop", brand: "Dell", model: "XPS 14 9440 (2024)", category_type: "laptop_general" },
  { device_type: "Laptop", brand: "Dell", model: "XPS 15 9520 / 9530", category_type: "laptop_general" },
  { device_type: "Laptop", brand: "Dell", model: "XPS 16 9640 (2024)", category_type: "laptop_general" },
  { device_type: "Laptop", brand: "Dell", model: "Latitude 3420 / 3520", category_type: "laptop_general" },
  { device_type: "Laptop", brand: "Dell", model: "Latitude 5420 / 5430 / 5440", category_type: "laptop_general" },
  { device_type: "Laptop", brand: "Dell", model: "Latitude 7420 / 7430", category_type: "laptop_general" },
  { device_type: "Laptop", brand: "Dell", model: "G15 5520 / 5530 Gaming", category_type: "laptop_general" },
  { device_type: "Laptop", brand: "Dell", model: "Alienware m16 R2 / x16", category_type: "laptop_general" },

  // HP
  { device_type: "Laptop", brand: "HP", model: "Pavilion 15-eg / 15-eh", category_type: "laptop_general" },
  { device_type: "Laptop", brand: "HP", model: "Pavilion Gaming 15", category_type: "laptop_general" },
  { device_type: "Laptop", brand: "HP", model: "HP 14s / 15s (Core i3/i5)", category_type: "laptop_general" },
  { device_type: "Laptop", brand: "HP", model: "Victus 15-fb / 15-fa Gaming", category_type: "laptop_general" },
  { device_type: "Laptop", brand: "HP", model: "Victus 16-d / 16-r Gaming", category_type: "laptop_general" },
  { device_type: "Laptop", brand: "HP", model: "Omen 16 / 17 Gaming", category_type: "laptop_general" },
  { device_type: "Laptop", brand: "HP", model: "Envy x360 14 / 15 OLED", category_type: "laptop_general" },
  { device_type: "Laptop", brand: "HP", model: "Spectre x360 14 / 16", category_type: "laptop_general" },
  { device_type: "Laptop", brand: "HP", model: "ProBook 440 G8 / G9 / G10", category_type: "laptop_general" },
  { device_type: "Laptop", brand: "HP", model: "EliteBook 840 G8 / G9 / G10", category_type: "laptop_general" },

  // Lenovo
  { device_type: "Laptop", brand: "Lenovo", model: "ThinkPad E14 Gen 4 / Gen 5", category_type: "laptop_general" },
  { device_type: "Laptop", brand: "Lenovo", model: "ThinkPad E15 Gen 4", category_type: "laptop_general" },
  { device_type: "Laptop", brand: "Lenovo", model: "ThinkPad T14 / T14s Gen 3 / Gen 4", category_type: "laptop_general" },
  { device_type: "Laptop", brand: "Lenovo", model: "ThinkPad X1 Carbon Gen 10 / Gen 11", category_type: "laptop_general" },
  { device_type: "Laptop", brand: "Lenovo", model: "IdeaPad Slim 3 / Slim 5", category_type: "laptop_general" },
  { device_type: "Laptop", brand: "Lenovo", model: "IdeaPad Gaming 3", category_type: "laptop_general" },
  { device_type: "Laptop", brand: "Lenovo", model: "Legion 5 / 5 Pro / 5i", category_type: "laptop_general" },
  { device_type: "Laptop", brand: "Lenovo", model: "Legion 7 / Slim 7", category_type: "laptop_general" },
  { device_type: "Laptop", brand: "Lenovo", model: "Yoga 7i / 9i 2-in-1", category_type: "laptop_general" },

  // ASUS
  { device_type: "Laptop", brand: "Asus", model: "TUF Gaming F15 / A15", category_type: "laptop_general" },
  { device_type: "Laptop", brand: "Asus", model: "ROG Strix G15 / G16", category_type: "laptop_general" },
  { device_type: "Laptop", brand: "Asus", model: "ROG Zephyrus G14 / G16 OLED", category_type: "laptop_general" },
  { device_type: "Laptop", brand: "Asus", model: "Vivobook 15 / 16 / Go 15", category_type: "laptop_general" },
  { device_type: "Laptop", brand: "Asus", model: "Vivobook Pro 15 OLED", category_type: "laptop_general" },
  { device_type: "Laptop", brand: "Asus", model: "ZenBook 14 OLED / Duo 14", category_type: "laptop_general" },

  // Acer
  { device_type: "Laptop", brand: "Acer", model: "Aspire 3 / Aspire 5", category_type: "laptop_general" },
  { device_type: "Laptop", brand: "Acer", model: "Nitro 5 / Nitro 16 Gaming", category_type: "laptop_general" },
  { device_type: "Laptop", brand: "Acer", model: "Predator Helios 16 / Neo 16", category_type: "laptop_general" },
  { device_type: "Laptop", brand: "Acer", model: "Swift Go 14 OLED", category_type: "laptop_general" },
];

export const DRONE_PRESETS: PresetItem[] = [
  // DJI Consumer & Pro
  { device_type: "Drone", brand: "DJI", model: "Mini 2 / Mini 2 SE", category_type: "drone" },
  { device_type: "Drone", brand: "DJI", model: "Mini 3 / Mini 3 Pro", category_type: "drone" },
  { device_type: "Drone", brand: "DJI", model: "Mini 4 Pro", category_type: "drone" },
  { device_type: "Drone", brand: "DJI", model: "Air 2S", category_type: "drone" },
  { device_type: "Drone", brand: "DJI", model: "Air 3 / Air 3S", category_type: "drone" },
  { device_type: "Drone", brand: "DJI", model: "Mavic 2 Pro / Zoom", category_type: "drone" },
  { device_type: "Drone", brand: "DJI", model: "Mavic 3 / Mavic 3 Classic", category_type: "drone" },
  { device_type: "Drone", brand: "DJI", model: "Mavic 3 Pro / Cine", category_type: "drone" },
  { device_type: "Drone", brand: "DJI", model: "Mavic 3 Enterprise (3E / 3T Thermal)", category_type: "drone" },
  { device_type: "Drone", brand: "DJI", model: "Avata / Avata 2 FPV", category_type: "drone" },
  { device_type: "Drone", brand: "DJI", model: "DJI FPV Drone", category_type: "drone" },
  { device_type: "Drone", brand: "DJI", model: "Phantom 4 Pro V2.0 / RTK", category_type: "drone" },
  { device_type: "Drone", brand: "DJI", model: "Inspire 2 / Inspire 3 Cinema", category_type: "drone" },
  { device_type: "Drone", brand: "DJI", model: "Matrice 30 / 30T Enterprise", category_type: "drone" },
  { device_type: "Drone", brand: "DJI", model: "Matrice 300 RTK / 350 RTK", category_type: "drone" },
  { device_type: "Drone", brand: "DJI", model: "Agras T30 / T40 / T50 (Agri)", category_type: "drone" },

  // Autel Robotics
  { device_type: "Drone", brand: "Autel Robotics", model: "EVO Nano / Nano+", category_type: "drone" },
  { device_type: "Drone", brand: "Autel Robotics", model: "EVO Lite / Lite+", category_type: "drone" },
  { device_type: "Drone", brand: "Autel Robotics", model: "EVO II Pro V3 (6K)", category_type: "drone" },
  { device_type: "Drone", brand: "Autel Robotics", model: "EVO II Dual 640T V3 (Thermal)", category_type: "drone" },
  { device_type: "Drone", brand: "Autel Robotics", model: "EVO Max 4T / 4N Enterprise", category_type: "drone" },

  // Skydio
  { device_type: "Drone", brand: "Skydio", model: "Skydio 2+ Autonomous", category_type: "drone" },
  { device_type: "Drone", brand: "Skydio", model: "Skydio X2 Color / Thermal", category_type: "drone" },
  { device_type: "Drone", brand: "Skydio", model: "Skydio X10 Enterprise", category_type: "drone" },

  // Parrot
  { device_type: "Drone", brand: "Parrot", model: "Anafi Thermal / Anafi USA", category_type: "drone" },
];
