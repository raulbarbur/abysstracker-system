import { describe, it, expect } from "vitest";
import {
  cn,
  buildArgentinaDate,
  formatCurrency,
  formatWeight,
  getTodayRangeUTC,
  getAppointmentStatusStyles,
} from "@/lib/utils";

describe("Utils Library", () => {
  describe("cn", () => {
    it("Debe combinar clases", () => {
      expect(cn("a", "b")).toBe("a b");
    });
  });

  describe("buildArgentinaDate", () => {
    it("Debe manejar correctamente el desfasaje UTC-3", () => {
      const date = buildArgentinaDate("2024-05-10", "10:00");
      expect(date.getUTCHours()).toBe(13);
    });
  });

  describe("formatCurrency", () => {
    it("Debe contener el símbolo peso y los miles", () => {
      const result = formatCurrency(1500.5);
      expect(result).toContain("$");
      expect(result).toContain("1.500");
      expect(result).toMatch(/1\.500,5/);
    });
  });

  describe("Date Ranges", () => {
    it("getTodayRangeUTC debe devolver un objeto con start y end", () => {
      const range = getTodayRangeUTC();
      expect(range).toHaveProperty("start");
      expect(range).toHaveProperty("end");
      expect(range.start instanceof Date).toBe(true);
      expect(range.end.getTime()).toBeGreaterThan(range.start.getTime());
    });
  });

  describe("formatWeight", () => {
    it("Debe formatear gramos y kg", () => {
      expect(formatWeight(500)).toBe("500 gr");
      expect(formatWeight(2500)).toContain("2,5 kg");
    });
  });

  describe("Styles Helpers", () => {
    it("Debe devolver labels correctos", () => {
      expect(getAppointmentStatusStyles("PENDING").label).toBe("PENDING");
      expect(getAppointmentStatusStyles("CONFIRMED").label).toBe("EN PROCESO");
    });
  });
});
