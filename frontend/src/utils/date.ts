/**
 * Utility Formatting Tanggal Standar Aplikasi
 * Standar format yang digunakan seragam: dd - mm - yyyy
 * Contoh: 11 - 11 - 2026
 */

export function formatDate(val: string | number | Date | null | undefined): string {
  if (!val) return "-";

  // Tangani string format YYYY-MM-DD langsung untuk menghindari pergeseran zona waktu
  if (typeof val === "string") {
    const match = val.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match && !val.includes("T") && !val.includes(" ") && !val.includes(":")) {
      const [, y, m, d] = match;
      return `${d} - ${m} - ${y}`;
    }
  }

  const d = typeof val === "string" || typeof val === "number" ? new Date(val) : val;
  if (isNaN(d.getTime())) return String(val);

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day} - ${month} - ${year}`;
}

export function formatDateTime(val: string | number | Date | null | undefined): string {
  if (!val) return "-";
  const d = typeof val === "string" || typeof val === "number" ? new Date(val) : val;
  if (isNaN(d.getTime())) return String(val);

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${day} - ${month} - ${year} ${hours}:${minutes}`;
}
