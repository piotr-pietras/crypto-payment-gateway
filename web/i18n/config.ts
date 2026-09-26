import type { Resource } from "i18next";
import en from "./locales/en/translation.json";

export const resources = {
  en: {
    translation: en,
  },
} satisfies Resource;

export const defaultLocale = "en" as const;
export const locales = ["en"] as const;
export const defaultNS = "translation";

export type Locale = (typeof locales)[number];
export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
