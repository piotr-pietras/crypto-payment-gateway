"use client";

import { createInstance, type i18n as I18nInstance } from "i18next";
import { useEffect, useState, type ReactNode } from "react";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { defaultLocale, defaultNS, type Locale, resources } from "./config";

function createClientI18n(lng: Locale): I18nInstance {
  const i18n = createInstance();

  void i18n.use(initReactI18next).init({
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

export function I18nProvider({
  children,
  lng,
}: {
  children: ReactNode;
  lng: Locale;
}) {
  const [i18n] = useState(() => createClientI18n(lng));

  useEffect(() => {
    if (i18n.language !== lng) {
      void i18n.changeLanguage(lng);
    }
  }, [i18n, lng]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
