import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface BrandItem {
  brand_id: number;
  brand_name: string;
  brand_slug: string;
  device_count: number;
}

interface PhoneItem {
  brand: string;
  phone_name: string;
  slug: string;
  image?: string;
}

const PRIORITY_BRANDS = [
  "Apple",
  "Samsung",
  "Dell",
  "HP",
  "Lenovo",
  "Asus",
  "OnePlus",
  "Xiaomi",
  "Google",
  "Realme",
  "vivo",
  "Oppo",
  "Motorola",
  "Nothing",
  "Honor",
  "Sony",
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") || "brands";

  try {
    if (action === "brands") {
      const res = await fetch("https://phone-specs-api.vercel.app/brands", {
        headers: { Accept: "application/json" },
        next: { revalidate: 3600 }, // cache for 1 hr
      });

      if (!res.ok) {
        throw new Error(`External API responded with status ${res.status}`);
      }

      const json = await res.json();
      const rawBrands: BrandItem[] = json.data || [];

      // Sort with popular brands first
      const sorted = [...rawBrands].sort((a, b) => {
        const aIndex = PRIORITY_BRANDS.indexOf(a.brand_name);
        const bIndex = PRIORITY_BRANDS.indexOf(b.brand_name);
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return a.brand_name.localeCompare(b.brand_name);
      });

      return NextResponse.json({ success: true, brands: sorted });
    }

    if (action === "models") {
      let brandSlug = searchParams.get("brandSlug");
      const brandName = (searchParams.get("brand") || searchParams.get("brandName") || "").toLowerCase().trim();
      const deviceType = (searchParams.get("deviceType") || "").toLowerCase().trim();

      const BRAND_SLUG_MAP: Record<string, string> = {
        apple: "apple-phones-48",
        samsung: "samsung-phones-9",
        oneplus: "oneplus-phones-95",
        xiaomi: "xiaomi-phones-80",
        google: "google-phones-107",
        realme: "realme-phones-118",
        vivo: "vivo-phones-98",
        oppo: "oppo-phones-82",
        motorola: "motorola-phones-4",
        asus: "asus-phones-46",
        dell: "dell-phones-61",
        hp: "hp-phones-41",
        lenovo: "lenovo-phones-73",
        nothing: "nothing-phones-128",
        honor: "honor-phones-121",
        sony: "sony-phones-7",
        nokia: "nokia-phones-1",
        huawei: "huawei-phones-58",
        infinix: "infinix-phones-119",
        tecno: "tecno-phones-120",
        micromax: "micromax-phones-66",
        lava: "lava-phones-94",
        zte: "zte-phones-62",
        lg: "lg-phones-20",
        htc: "htc-phones-45",
      };

      if (!brandSlug && brandName) {
        brandSlug = BRAND_SLUG_MAP[brandName];
        if (!brandSlug) {
          try {
            const bRes = await fetch("https://phone-specs-api.vercel.app/brands", {
              headers: { Accept: "application/json" },
              next: { revalidate: 86400 },
            });
            if (bRes.ok) {
              const bJson = await bRes.json();
              const found = (bJson.data || []).find(
                (b: BrandItem) =>
                  b.brand_name.toLowerCase() === brandName ||
                  b.brand_slug.toLowerCase().includes(brandName)
              );
              if (found) {
                brandSlug = found.brand_slug;
              }
            }
          } catch (e) {
            console.warn("Could not dynamically resolve brand slug:", e);
          }
        }
      }

      const results: Array<{ name: string; slug?: string; image?: string; source?: string }> = [];

      // 1. Check Presets for Laptops & Drones first if applicable
      const { LAPTOP_PRESETS, DRONE_PRESETS } = await import("@/services/catalogPresets");

      if (deviceType === "drone" || brandName === "dji" || brandName === "autel robotics" || brandName === "skydio") {
        const droneMatches = DRONE_PRESETS.filter(
          (d) => !brandName || d.brand.toLowerCase() === brandName
        ).map((d) => ({ name: d.model, source: "Drone Master Preset" }));
        results.push(...droneMatches);
      }

      if (deviceType === "laptop" || deviceType === "macbook" || ["dell", "hp", "lenovo", "asus", "acer", "apple"].includes(brandName)) {
        const laptopMatches = LAPTOP_PRESETS.filter(
          (l) => !brandName || l.brand.toLowerCase() === brandName
        ).map((l) => ({ name: l.model, source: "Laptop Master Preset" }));
        results.push(...laptopMatches);
      }

      // 2. If an external API slug is available, fetch live phone/tablet models
      if (brandSlug) {
        try {
          const res = await fetch(`https://phone-specs-api.vercel.app/brands/${brandSlug}`, {
            headers: { Accept: "application/json" },
            next: { revalidate: 3600 },
          });

          if (res.ok) {
            const json = await res.json();
            const phones: PhoneItem[] = json.data?.phones || [];
            const apiModels = phones.map((p) => ({
              name: p.phone_name.trim(),
              slug: p.slug,
              image: p.image,
              source: "Live Phone Specs API",
            }));
            results.push(...apiModels);
          }
        } catch (apiErr) {
          console.warn("External phone specs API fetch error:", apiErr);
        }
      }

      // Deduplicate results by name
      const seen = new Set<string>();
      const uniqueModels = results.filter((m) => {
        const lower = m.name.toLowerCase();
        if (seen.has(lower)) return false;
        seen.add(lower);
        return true;
      });

      return NextResponse.json({
        success: true,
        total: uniqueModels.length,
        models: uniqueModels,
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "External API request failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items = body.items as Array<{
      device_type: string;
      brand: string;
      model: string;
      category_type?: string;
    }>;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "No items provided for import" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Map clean rows
    const rows = items.map((item) => ({
      device_type: item.device_type.trim(),
      brand: item.brand.trim(),
      model: item.model.trim(),
      category_type: item.device_type.toLowerCase() === "drone" ? "drone" : "laptop_general",
    }));

    // Upsert into device_catalog ignoring duplicates on (device_type, brand, model)
    const { data, error } = await supabase
      .from("device_catalog")
      .upsert(rows, { onConflict: "device_type,brand,model", ignoreDuplicates: true })
      .select();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      importedCount: data?.length ?? rows.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to import items into catalog";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
