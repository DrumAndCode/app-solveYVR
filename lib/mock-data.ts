export interface Report {
  id: string;
  service_request_type: string;
  address: string;
  local_area: string;
  department: string;
  status: "Open" | "Closed";
  closure_reason?: string;
  date: string;
  close_date?: string;
  lat: number;
  lng: number;
  description?: string;
  attachments?: string[];
  ref?: string;
}

export const VANCOUVER_CENTER = { lat: 49.2827, lng: -123.1207 };

export const NEIGHBOURHOODS = [
  "Arbutus Ridge",
  "Downtown",
  "Dunbar-Southlands",
  "Fairview",
  "Grandview-Woodland",
  "Hastings-Sunrise",
  "Kensington-Cedar Cottage",
  "Kerrisdale",
  "Killarney",
  "Kitsilano",
  "Marpole",
  "Mount Pleasant",
  "Oakridge",
  "Renfrew-Collingwood",
  "Riley Park",
  "Shaughnessy",
  "South Cambie",
  "Strathcona",
  "Sunset",
  "Victoria-Fraserview",
  "West End",
  "West Point Grey",
] as const;

export const DEPARTMENTS = [
  "ENG - Sanitation Services",
  "ENG - Streets",
  "ENG - Electrical Operations",
  "ENG - Water",
  "ENG - Sewers & Drainage",
  "PDS - Planning & Development",
  "PRBD - Parks",
  "311 - Contact Centre",
] as const;

export const mockReports: Report[] = [
  {
    id: "1",
    service_request_type: "Abandoned Garbage Case",
    address: "1425 W 4TH AVE",
    local_area: "Kitsilano",
    department: "ENG - Sanitation Services",
    status: "Open",
    date: "2026-03-20T14:34:00+00:00",
    lat: 49.2685,
    lng: -123.1456,
    description:
      "Large pile of household waste including broken furniture and garbage bags. Blocking sidewalk. Approx 2m x 1m.",
    ref: "SYV-00247",
  },
  {
    id: "2",
    service_request_type: "Pothole - Loss of Material",
    address: "W BROADWAY & ALMA ST",
    local_area: "Kitsilano",
    department: "ENG - Streets",
    status: "Closed",
    closure_reason: "Service provided",
    date: "2026-03-12T09:15:00+00:00",
    close_date: "2026-03-18",
    lat: 49.2636,
    lng: -123.1688,
    description:
      "Deep pothole in westbound lane near intersection. Approx 30cm diameter, 10cm deep.",
    ref: "SYV-00198",
  },
  {
    id: "3",
    service_request_type: "Street Light Out",
    address: "CAMBIE ST & W 12TH AVE",
    local_area: "Fairview",
    department: "ENG - Electrical Operations",
    status: "Open",
    date: "2026-02-28T19:20:00+00:00",
    lat: 49.2596,
    lng: -123.1147,
    description: "Street light not functioning on northeast corner of intersection.",
    ref: "SYV-00134",
  },
  {
    id: "4",
    service_request_type: "Abandoned Bike Case",
    address: "1770 DAVIE ST",
    local_area: "West End",
    department: "ENG - Sanitation Services",
    status: "Closed",
    closure_reason: "Service provided",
    date: "2026-02-10T16:40:00+00:00",
    close_date: "2026-02-20",
    lat: 49.28693,
    lng: -123.14218,
  },
  {
    id: "5",
    service_request_type: "Graffiti Removal",
    address: "GRANVILLE ST & ROBSON ST",
    local_area: "Downtown",
    department: "ENG - Streets",
    status: "Closed",
    closure_reason: "Service provided",
    date: "2026-03-18T11:00:00+00:00",
    close_date: "2026-03-21",
    lat: 49.2797,
    lng: -123.1215,
    description: "Spray paint graffiti on utility box at northeast corner.",
  },
  {
    id: "6",
    service_request_type: "Needle/Syringe Cleanup",
    address: "E HASTINGS ST & MAIN ST",
    local_area: "Strathcona",
    department: "ENG - Sanitation Services",
    status: "Open",
    date: "2026-03-16T08:45:00+00:00",
    lat: 49.2812,
    lng: -123.1004,
    description: "Multiple needles found on sidewalk near bus stop.",
  },
  {
    id: "7",
    service_request_type: "Catch Basin Blocked/Flooded",
    address: "MAIN ST & E 2ND AVE",
    local_area: "Mount Pleasant",
    department: "ENG - Sewers & Drainage",
    status: "Open",
    date: "2026-03-15T13:30:00+00:00",
    lat: 49.2691,
    lng: -123.1008,
    description: "Catch basin overflowing during rain, flooding sidewalk and bike lane.",
  },
  {
    id: "8",
    service_request_type: "Abandoned Vehicle Case",
    address: "2200 BLOCK E 1ST AVE",
    local_area: "Grandview-Woodland",
    department: "ENG - Streets",
    status: "Open",
    date: "2026-03-14T10:00:00+00:00",
    lat: 49.2694,
    lng: -123.0651,
    description: "Vehicle with flat tires, no plates, parked for 3+ weeks.",
  },
  {
    id: "9",
    service_request_type: "Noise - Construction",
    address: "1055 W HASTINGS ST",
    local_area: "Downtown",
    department: "311 - Contact Centre",
    status: "Closed",
    closure_reason: "Information provided",
    date: "2026-03-10T07:00:00+00:00",
    close_date: "2026-03-10",
    lat: 49.2876,
    lng: -123.1189,
    description: "Construction noise starting before 7am, violating noise bylaw.",
  },
  {
    id: "10",
    service_request_type: "Sidewalk Not Cleared of Snow/Ice",
    address: "COMMERCIAL DR & E BROADWAY",
    local_area: "Grandview-Woodland",
    department: "ENG - Streets",
    status: "Closed",
    closure_reason: "Service provided",
    date: "2026-01-22T15:00:00+00:00",
    close_date: "2026-01-24",
    lat: 49.2633,
    lng: -123.0696,
  },
  {
    id: "11",
    service_request_type: "Tree - Branches Down",
    address: "W 16TH AVE & ARBUTUS ST",
    local_area: "Arbutus Ridge",
    department: "PRBD - Parks",
    status: "Open",
    date: "2026-03-19T22:10:00+00:00",
    lat: 49.2527,
    lng: -123.1536,
    description: "Large branch broken off tree, partially blocking sidewalk.",
  },
  {
    id: "12",
    service_request_type: "Illegal Dumping",
    address: "CLARK DR & E 6TH AVE",
    local_area: "Grandview-Woodland",
    department: "ENG - Sanitation Services",
    status: "Open",
    date: "2026-03-21T09:30:00+00:00",
    lat: 49.266,
    lng: -123.0763,
    description:
      "Mattress, broken table, and several garbage bags dumped in alley behind commercial buildings.",
  },
  {
    id: "13",
    service_request_type: "Water Leak - City Main",
    address: "OAK ST & W 41ST AVE",
    local_area: "Oakridge",
    department: "ENG - Water",
    status: "Open",
    date: "2026-03-17T06:15:00+00:00",
    lat: 49.2345,
    lng: -123.1277,
    description: "Water bubbling up from roadway at intersection. Steady flow.",
  },
  {
    id: "14",
    service_request_type: "Traffic Signal Malfunction",
    address: "KNIGHT ST & KINGSWAY",
    local_area: "Kensington-Cedar Cottage",
    department: "ENG - Electrical Operations",
    status: "Closed",
    closure_reason: "Service provided",
    date: "2026-03-08T17:45:00+00:00",
    close_date: "2026-03-09",
    lat: 49.2442,
    lng: -123.0756,
  },
  {
    id: "15",
    service_request_type: "Dead Animal Removal",
    address: "FRASER ST & E 49TH AVE",
    local_area: "Sunset",
    department: "ENG - Sanitation Services",
    status: "Closed",
    closure_reason: "Service provided",
    date: "2026-03-05T12:00:00+00:00",
    close_date: "2026-03-05",
    lat: 49.2262,
    lng: -123.0895,
  },
];

// User's own reports (subset with refs)
export const myReports = mockReports.filter((r) => r.ref);

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
  });
}

export function formatDateLong(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
