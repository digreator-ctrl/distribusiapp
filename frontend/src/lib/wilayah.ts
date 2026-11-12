// Helper Data Wilayah Indonesia & Integrasi Google Maps
import { API_BASE_URL } from "../config/api";

export interface RegionItem {
  id: string;
  name: string;
}

// 38 Provinsi Resmi Indonesia (Diurutkan secara alfabetis)
export const PROVINCES_DATA: RegionItem[] = [
  { id: "11", name: "Aceh" },
  { id: "51", name: "Bali" },
  { id: "36", name: "Banten" },
  { id: "17", name: "Bengkulu" },
  { id: "34", name: "DI Yogyakarta" },
  { id: "31", name: "DKI Jakarta" },
  { id: "75", name: "Gorontalo" },
  { id: "15", name: "Jambi" },
  { id: "32", name: "Jawa Barat" },
  { id: "33", name: "Jawa Tengah" },
  { id: "35", name: "Jawa Timur" },
  { id: "61", name: "Kalimantan Barat" },
  { id: "63", name: "Kalimantan Selatan" },
  { id: "62", name: "Kalimantan Tengah" },
  { id: "64", name: "Kalimantan Timur" },
  { id: "65", name: "Kalimantan Utara" },
  { id: "19", name: "Kepulauan Bangka Belitung" },
  { id: "21", name: "Kepulauan Riau" },
  { id: "18", name: "Lampung" },
  { id: "81", name: "Maluku" },
  { id: "82", name: "Maluku Utara" },
  { id: "52", name: "Nusa Tenggara Barat" },
  { id: "53", name: "Nusa Tenggara Timur" },
  { id: "94", name: "Papua" },
  { id: "91", name: "Papua Barat" },
  { id: "96", name: "Papua Barat Daya" },
  { id: "95", name: "Papua Pegunungan" },
  { id: "93", name: "Papua Selatan" },
  { id: "92", name: "Papua Tengah" },
  { id: "14", name: "Riau" },
  { id: "76", name: "Sulawesi Barat" },
  { id: "73", name: "Sulawesi Selatan" },
  { id: "72", name: "Sulawesi Tengah" },
  { id: "74", name: "Sulawesi Tenggara" },
  { id: "71", name: "Sulawesi Utara" },
  { id: "13", name: "Sumatera Barat" },
  { id: "16", name: "Sumatera Selatan" },
  { id: "12", name: "Sumatera Utara" },
].sort((a, b) => a.name.localeCompare(b.name, "id-ID"));

// 38 Kabupaten / Kota di Jawa Timur (Provinsi ID: 35) sebagai Fallback Instan Offline
export const JAWA_TIMUR_REGENCIES: RegionItem[] = [
  { id: "3501", name: "Kabupaten Pacitan" },
  { id: "3502", name: "Kabupaten Ponorogo" },
  { id: "3503", name: "Kabupaten Trenggalek" },
  { id: "3504", name: "Kabupaten Tulungagung" },
  { id: "3505", name: "Kabupaten Blitar" },
  { id: "3506", name: "Kabupaten Kediri" },
  { id: "3507", name: "Kabupaten Malang" },
  { id: "3508", name: "Kabupaten Lumajang" },
  { id: "3509", name: "Kabupaten Jember" },
  { id: "3510", name: "Kabupaten Banyuwangi" },
  { id: "3511", name: "Kabupaten Bondowoso" },
  { id: "3512", name: "Kabupaten Situbondo" },
  { id: "3513", name: "Kabupaten Probolinggo" },
  { id: "3514", name: "Kabupaten Pasuruan" },
  { id: "3515", name: "Kabupaten Sidoarjo" },
  { id: "3516", name: "Kabupaten Mojokerto" },
  { id: "3517", name: "Kabupaten Jombang" },
  { id: "3518", name: "Kabupaten Nganjuk" },
  { id: "3519", name: "Kabupaten Madiun" },
  { id: "3520", name: "Kabupaten Magetan" },
  { id: "3521", name: "Kabupaten Ngawi" },
  { id: "3522", name: "Kabupaten Bojonegoro" },
  { id: "3523", name: "Kabupaten Tuban" },
  { id: "3524", name: "Kabupaten Lamongan" },
  { id: "3525", name: "Kabupaten Gresik" },
  { id: "3526", name: "Kabupaten Bangkalan" },
  { id: "3527", name: "Kabupaten Sampang" },
  { id: "3528", name: "Kabupaten Pamekasan" },
  { id: "3529", name: "Kabupaten Sumenep" },
  { id: "3571", name: "Kota Kediri" },
  { id: "3572", name: "Kota Blitar" },
  { id: "3573", name: "Kota Malang" },
  { id: "3574", name: "Kota Probolinggo" },
  { id: "3575", name: "Kota Pasuruan" },
  { id: "3576", name: "Kota Mojokerto" },
  { id: "3577", name: "Kota Madiun" },
  { id: "3578", name: "Kota Surabaya" },
  { id: "3579", name: "Kota Batu" },
].sort((a, b) => a.name.localeCompare(b.name, "id-ID"));

export const toTitleCase = (str: string) => {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => {
      if (word.toUpperCase() === "DKI" || word.toUpperCase() === "DI") return word.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
};

// Cache API agar tidak memanggil ulang data yang sama
const cacheRegencies: Record<string, RegionItem[]> = {
  "35": JAWA_TIMUR_REGENCIES,
};
const cacheDistricts: Record<string, RegionItem[]> = {};
const cacheVillages: Record<string, RegionItem[]> = {};

// Helper multi-source fetcher dengan fallback bertingkat
const fetchWithFallback = async (urls: string[]): Promise<any[]> => {
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    } catch {
      // lanjut ke fallback berikutnya
    }
  }
  return [];
};

export const fetchRegencies = async (provinceId: string): Promise<RegionItem[]> => {
  if (!provinceId) return [];
  if (cacheRegencies[provinceId] && cacheRegencies[provinceId].length > 0) {
    return cacheRegencies[provinceId];
  }

  // Khusus Jawa Timur (35) selalu tersedia instan
  if (provinceId === "35") {
    cacheRegencies["35"] = JAWA_TIMUR_REGENCIES;
    return JAWA_TIMUR_REGENCIES;
  }

  const urls = [
    `${API_BASE_URL}/regions/regencies/${provinceId}`,
    `https://emsifa.github.io/api-wilayah-indonesia/api/regencies/${provinceId}.json`,
    `https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provinceId}.json`,
  ];

  try {
    const raw = await fetchWithFallback(urls);
    if (raw.length > 0) {
      const formatted: RegionItem[] = raw.map((item: any) => ({
        id: String(item.id),
        name: toTitleCase(item.name),
      }));
      formatted.sort((a, b) => a.name.localeCompare(b.name, "id-ID"));
      cacheRegencies[provinceId] = formatted;
      return formatted;
    }
  } catch (err) {
    console.error("Gagal mengambil data kabupaten/kota:", err);
  }

  return [];
};

export const fetchDistricts = async (regencyId: string): Promise<RegionItem[]> => {
  if (!regencyId) return [];
  if (cacheDistricts[regencyId] && cacheDistricts[regencyId].length > 0) {
    return cacheDistricts[regencyId];
  }

  const urls = [
    `${API_BASE_URL}/regions/districts/${regencyId}`,
    `https://emsifa.github.io/api-wilayah-indonesia/api/districts/${regencyId}.json`,
    `https://www.emsifa.com/api-wilayah-indonesia/api/districts/${regencyId}.json`,
  ];

  try {
    const raw = await fetchWithFallback(urls);
    if (raw.length > 0) {
      const formatted: RegionItem[] = raw.map((item: any) => ({
        id: String(item.id),
        name: toTitleCase(item.name),
      }));
      formatted.sort((a, b) => a.name.localeCompare(b.name, "id-ID"));
      cacheDistricts[regencyId] = formatted;
      return formatted;
    }
  } catch (err) {
    console.error("Gagal mengambil data kecamatan:", err);
  }

  return [];
};

export const fetchVillages = async (districtId: string): Promise<RegionItem[]> => {
  if (!districtId) return [];
  if (cacheVillages[districtId] && cacheVillages[districtId].length > 0) {
    return cacheVillages[districtId];
  }

  const urls = [
    `${API_BASE_URL}/regions/villages/${districtId}`,
    `https://emsifa.github.io/api-wilayah-indonesia/api/villages/${districtId}.json`,
    `https://www.emsifa.com/api-wilayah-indonesia/api/villages/${districtId}.json`,
  ];

  try {
    const raw = await fetchWithFallback(urls);
    if (raw.length > 0) {
      const formatted: RegionItem[] = raw.map((item: any) => ({
        id: String(item.id),
        name: toTitleCase(item.name),
      }));
      formatted.sort((a, b) => a.name.localeCompare(b.name, "id-ID"));
      cacheVillages[districtId] = formatted;
      return formatted;
    }
  } catch (err) {
    console.error("Gagal mengambil data kelurahan/desa:", err);
  }

  return [];
};

/**
 * Parsing input titik / link Google Maps untuk mengekstrak latitude dan longitude
 */
export const parseGmapsInput = (input: string): { lat: number | null; lng: number | null } => {
  if (!input) return { lat: null, lng: null };

  const clean = input.trim();

  // 1. Format URL "@-6.3728,106.8329" atau "!3d-6.3728!4d106.8329"
  const atMatch = clean.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  }

  const queryMatch = clean.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (queryMatch) {
    return { lat: parseFloat(queryMatch[1]), lng: parseFloat(queryMatch[2]) };
  }

  const embedMatch = clean.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (embedMatch) {
    return { lat: parseFloat(embedMatch[1]), lng: parseFloat(embedMatch[2]) };
  }

  // 2. Format Koordinat Langsung "-6.3728, 106.8329"
  const directMatch = clean.match(/^(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)$/);
  if (directMatch) {
    return { lat: parseFloat(directMatch[1]), lng: parseFloat(directMatch[2]) };
  }

  return { lat: null, lng: null };
};
