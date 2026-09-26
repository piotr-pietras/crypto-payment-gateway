import { createInstance, type i18n as I18nInstance } from "i18next";
import { defaultLocale, defaultNS, isLocale, type Locale, resources } from "./config";

export async function initI18n(
  lng: Locale = defaultLocale
): Promise<I18nInstance> {
  const i18n = createInstance();

  await i18n.init({
    lng,
    fallbackLng: defaultLocale,
    defaultNS,
    resources,
    interpolation: {
      escapeValue: false,
    },
  });

  return i18n;
}

export async function getTranslation(_lng: string) {
  let lng = _lng;
  if (!isLocale(lng)) {
    lng = defaultLocale;
  }

  const i18n = await initI18n(lng as Locale);
  return {
    t: i18n.getFixedT(lng, defaultNS),
    i18n,
  };
}
