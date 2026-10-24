import { NextRequest, NextResponse } from "next/server";

// Comprehensive Master list of all Indian States and Union Territories
export const INDIAN_STATES = [
  "Gujarat",
  "Maharashtra",
  "Rajasthan",
  "Delhi",
  "Karnataka",
  "Madhya Pradesh",
  "Uttar Pradesh",
  "Punjab",
  "Haryana",
  "Tamil Nadu",
  "Telangana",
  "Andhra Pradesh",
  "West Bengal",
  "Bihar",
  "Kerala",
  "Odisha",
  "Goa",
  "Assam",
  "Chhattisgarh",
  "Jharkhand",
  "Uttarakhand",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Chandigarh",
  "Tripura",
  "Manipur",
  "Meghalaya",
  "Nagaland",
  "Puducherry",
  "Sikkim",
  "Arunachal Pradesh",
  "Mizoram",
  "Ladakh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Andaman and Nicobar Islands",
  "Lakshadweep",
];

// Curated instant cities for high-volume states (0ms latency, zero downtime)
export const STATE_CITIES_PRESET: Record<string, string[]> = {
  Gujarat: [
    "Ahmedabad",
    "Surat",
    "Vadodara",
    "Rajkot",
    "Bhavnagar",
    "Jamnagar",
    "Gandhinagar",
    "Junagadh",
    "Anand",
    "Navsari",
    "Morbi",
    "Nadiad",
    "Surendranagar",
    "Bharuch",
    "Mehsana",
    "Bhuj",
    "Porbandar",
    "Palanpur",
    "Valsad",
    "Vapi",
    "Gondal",
    "Veraval",
    "Godhra",
    "Patan",
    "Kalol",
    "Dahod",
    "Botad",
    "Amreli",
    "Deesa",
    "Jetpur",
  ],
  Maharashtra: [
    "Mumbai",
    "Pune",
    "Nagpur",
    "Thane",
    "Nashik",
    "Kalyan-Dombivli",
    "Vasai-Virar",
    "Aurangabad (Chhatrapati Sambhajinagar)",
    "Navi Mumbai",
    "Solapur",
    "Mira-Bhayandar",
    "Bhiwandi",
    "Amravati",
    "Nanded",
    "Kolhapur",
    "Ulhasnagar",
    "Sangli",
    "Malegaon",
    "Jalgaon",
    "Akola",
    "Latur",
    "Dhule",
    "Ahmednagar",
    "Chandrapur",
    "Parbhani",
    "Satara",
    "Panvel",
  ],
  Rajasthan: [
    "Jaipur",
    "Jodhpur",
    "Kota",
    "Bikaner",
    "Ajmer",
    "Udaipur",
    "Bhilwara",
    "Alwar",
    "Bharatpur",
    "Sikar",
    "Pali",
    "Sri Ganganagar",
    "Kishangarh",
    "Baran",
    "Dhaulpur",
    "Tonk",
    "Beawar",
    "Hanumangarh",
  ],
  Delhi: [
    "New Delhi",
    "Central Delhi",
    "East Delhi",
    "North Delhi",
    "North East Delhi",
    "North West Delhi",
    "South Delhi",
    "South East Delhi",
    "South West Delhi",
    "West Delhi",
    "Connaught Place",
    "Dwarka",
    "Rohini",
    "Saket",
  ],
  Karnataka: [
    "Bengaluru (Bangalore)",
    "Mysuru (Mysore)",
    "Hubballi-Dharwad",
    "Mangaluru (Mangalore)",
    "Belagavi (Belgaum)",
    "Kalaburagi (Gulbarga)",
    "Davanagere",
    "Ballari (Bellary)",
    "Vijayapura (Bijapur)",
    "Shivamogga (Shimoga)",
    "Tumakuru (Tumkur)",
    "Udupi",
  ],
  "Madhya Pradesh": [
    "Indore",
    "Bhopal",
    "Jabalpur",
    "Gwalior",
    "Ujjain",
    "Sagar",
    "Dewas",
    "Satna",
    "Ratlam",
    "Rewa",
    "Murwara (Katni)",
    "Singrauli",
    "Burhanpur",
    "Khandwa",
  ],
  "Uttar Pradesh": [
    "Lucknow",
    "Kanpur",
    "Ghaziabad",
    "Agra",
    "Meerut",
    "Varanasi",
    "Prayagraj (Allahabad)",
    "Bareilly",
    "Aligarh",
    "Moradabad",
    "Saharanpur",
    "Gorakhpur",
    "Noida",
    "Greater Noida",
    "Firozabad",
    "Jhansi",
    "Muzaffarnagar",
    "Mathura",
  ],
  Punjab: [
    "Ludhiana",
    "Amritsar",
    "Jalandhar",
    "Patiala",
    "Bathinda",
    "Mohali (SAS Nagar)",
    "Hoshiarpur",
    "Batala",
    "Pathankot",
    "Moga",
  ],
  Haryana: [
    "Gurugram (Gurgaon)",
    "Faridabad",
    "Panipat",
    "Ambala",
    "Yamunanagar",
    "Rohtak",
    "Hisar",
    "Karnal",
    "Sonipat",
    "Panchkula",
  ],
  "Tamil Nadu": [
    "Chennai",
    "Coimbatore",
    "Madurai",
    "Tiruchirappalli",
    "Salem",
    "Tirunelveli",
    "Tiruppur",
    "Ranipet",
    "Nagercoil",
    "Thanjavur",
    "Vellore",
    "Kanchipuram",
    "Erode",
  ],
  Telangana: [
    "Hyderabad",
    "Warangal",
    "Nizamabad",
    "Karimnagar",
    "Ramagundam",
    "Khammam",
    "Mahbubnagar",
    "Secunderabad",
  ],
  "West Bengal": [
    "Kolkata",
    "Howrah",
    "Durgapur",
    "Asansol",
    "Siliguri",
    "Bardhaman",
    "Malda",
    "Baharampur",
    "Habra",
    "Kharagpur",
  ],
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") || "states";

  try {
    // 1. Fetch States List
    if (action === "states") {
      return NextResponse.json({
        success: true,
        states: INDIAN_STATES,
      });
    }

    // 2. Fetch Cities for a Selected State
    if (action === "cities") {
      const state = (searchParams.get("state") || "").trim();
      if (!state) {
        return NextResponse.json({ success: true, cities: [] });
      }

      // Check local curated list first
      const matchedKey = Object.keys(STATE_CITIES_PRESET).find(
        (k) => k.toLowerCase() === state.toLowerCase()
      );

      if (matchedKey && STATE_CITIES_PRESET[matchedKey]) {
        return NextResponse.json({
          success: true,
          source: "preset",
          state: matchedKey,
          cities: STATE_CITIES_PRESET[matchedKey],
        });
      }

      // Fallback to free public CountriesNow API for any other state
      try {
        const res = await fetch("https://countriesnow.space/api/v0.1/countries/state/cities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ country: "India", state }),
          next: { revalidate: 86400 },
        });

        if (res.ok) {
          const json = await res.json();
          if (json.data && Array.isArray(json.data) && json.data.length > 0) {
            return NextResponse.json({
              success: true,
              source: "external-api",
              state,
              cities: json.data,
            });
          }
        }
      } catch (apiErr) {
        console.warn("CountriesNow geo API fetch failed:", apiErr);
      }

      // Fallback empty list if external call also fails
      return NextResponse.json({
        success: true,
        source: "fallback",
        state,
        cities: [],
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch geo data";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
