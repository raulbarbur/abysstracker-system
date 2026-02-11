export const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export function validateDemoMode() {
  if (isDemoMode) {
    return {
      error: "Modo Demo: Las acciones de escritura están deshabilitadas.",
    };
  }
  return null;
}
