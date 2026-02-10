import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { toZonedTime, fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";

export const TIMEZONE = "America/Argentina/Buenos_Aires";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function buildArgentinaDate(dateStr: string, timeStr: string): Date {
  const localIso = `${dateStr}T${timeStr}:00`;
  return fromZonedTime(localIso, TIMEZONE);
}

export function getLocalDateISO(): string {
  const now = new Date();
  return formatInTimeZone(now, TIMEZONE, "yyyy-MM-dd");
}

export function getTodayRangeUTC() {
  const now = new Date();
  const zonedNow = toZonedTime(now, TIMEZONE);
  const startAR = new Date(zonedNow);
  startAR.setHours(0, 0, 0, 0);
  const endAR = new Date(zonedNow);
  endAR.setHours(23, 59, 59, 999);
  return {
    start: fromZonedTime(startAR, TIMEZONE),
    end: fromZonedTime(endAR, TIMEZONE),
  };
}

export function getArgentinaDayRange(dateStr: string) {
  if (!dateStr) return getTodayRangeUTC();
  const startAR = toZonedTime(`${dateStr}T00:00:00`, TIMEZONE);
  const endAR = toZonedTime(`${dateStr}T23:59:59.999`, TIMEZONE);

  return {
    start: fromZonedTime(startAR, TIMEZONE),
    end: fromZonedTime(endAR, TIMEZONE),
  };
}

export function formatDateAR(
  date: Date | string,
  formatStr: string = "EEEE, d 'de' MMMM",
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatInTimeZone(d, TIMEZONE, formatStr, { locale: es });
}

export function formatCurrency(value: number | string | object): string {
  const numberValue = Number(value);
  if (isNaN(numberValue)) return "$0";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numberValue);
}

export function getAppointmentStatusStyles(status: string) {
  const container: Record<string, string> = {
    PENDING: "bg-yellow-500/10 border-yellow-500 dark:border-yellow-400/50",
    CONFIRMED: "bg-blue-500/10 border-blue-500 dark:border-blue-400/50",
    COMPLETED: "bg-green-500/10 border-green-500 dark:border-green-400/50",
    BILLED: "bg-secondary border-border opacity-70 grayscale",
    CANCELLED: "bg-destructive/10 border-destructive opacity-80",
  };
  const badge: Record<string, string> = {
    PENDING: "text-yellow-700 dark:text-yellow-400 bg-yellow-500/10",
    CONFIRMED: "text-blue-700 dark:text-blue-400 bg-blue-500/10",
    COMPLETED: "text-green-700 dark:text-green-400 bg-green-500/10",
    BILLED: "text-muted-foreground bg-secondary",
    CANCELLED: "text-destructive bg-destructive/10",
  };
  return {
    container: container[status] || "bg-card border-border",
    badge: badge[status] || "text-muted-foreground bg-muted",
    label: status === "CONFIRMED" ? "EN PROCESO" : status,
  };
}

export function getPaymentMethodStyles(method: string) {
  const styles: Record<string, string> = {
    CASH: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    TRANSFER:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    CHECKING_ACCOUNT:
      "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  };
  const labels: Record<string, string> = {
    CASH: "Efectivo",
    TRANSFER: "Transferencia",
    CHECKING_ACCOUNT: "Cta. Corriente",
  };
  return {
    badge: styles[method] || "bg-secondary text-muted-foreground border-border",
    label: labels[method] || method,
  };
}

export function downloadBase64File(base64Data: string, filename: string) {
  if (typeof window === "undefined") return;
  const linkSource = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64Data}`;
  const downloadLink = document.createElement("a");
  downloadLink.href = linkSource;
  downloadLink.download = filename;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}

export function formatWeight(grams: number): string {
  if (!grams) return "0 gr";
  if (grams < 1000) return `${grams} gr`;
  const kilograms = grams / 1000;
  return `${kilograms.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 3 })} kg`;
}
