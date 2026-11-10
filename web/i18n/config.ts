import type { Resource } from "i18next";
import en from "./locales/en/translation.json";
import enGB from "./locales/en-GB/translation.json";
import es from "./locales/es/translation.json";
import fr from "./locales/fr/translation.json";
import de from "./locales/de/translation.json";
import it from "./locales/it/translation.json";
import ru from "./locales/ru/translation.json";
import enIN from "./locales/en-IN/translation.json";
import hiIN from "./locales/hi-IN/translation.json";
import zhCN from "./locales/zh-CN/translation.json";
import id from "./locales/id/translation.json";
import urPK from "./locales/ur-PK/translation.json";
import ptBR from "./locales/pt-BR/translation.json";
import bnBD from "./locales/bn-BD/translation.json";
import ar from "./locales/ar/translation.json";
import ja from "./locales/ja/translation.json";
import fil from "./locales/fil/translation.json";
import vi from "./locales/vi/translation.json";
import tr from "./locales/tr/translation.json";
import ko from "./locales/ko/translation.json";
import th from "./locales/th/translation.json";
import am from "./locales/am/translation.json";
import sw from "./locales/sw/translation.json";

export const resources = {
  en: { translation: en },
  "en-GB": { translation: enGB },
  es: { translation: es },
  fr: { translation: fr },
  de: { translation: de },
  it: { translation: it },
  ru: { translation: ru },
  "en-IN": { translation: enIN },
  "hi-IN": { translation: hiIN },
  "zh-CN": { translation: zhCN },
  id: { translation: id },
  "ur-PK": { translation: urPK },
  "pt-BR": { translation: ptBR },
  "bn-BD": { translation: bnBD },
  ar: { translation: ar },
  ja: { translation: ja },
  fil: { translation: fil },
  vi: { translation: vi },
  tr: { translation: tr },
  ko: { translation: ko },
  th: { translation: th },
  am: { translation: am },
  sw: { translation: sw },
} satisfies Resource;

export const defaultLocale = "en" as const;
export const locales = [
  "en",
  "en-GB",
  "es",
  "fr",
  "de",
  "it",
  "ru",
  "en-IN",
  "hi-IN",
  "zh-CN",
  "id",
  "ur-PK",
  "pt-BR",
  "bn-BD",
  "ar",
  "ja",
  "fil",
  "vi",
  "tr",
  "ko",
  "th",
  "am",
  "sw",
] as const;
export const defaultNS = "translation";

export type Locale = (typeof locales)[number];

const rtlLocales = ["ar", "ur-PK"] as const satisfies readonly Locale[];

export function localeDirection(locale: Locale): "rtl" | "ltr" {
  return (rtlLocales as readonly string[]).includes(locale) ? "rtl" : "ltr";
}

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
