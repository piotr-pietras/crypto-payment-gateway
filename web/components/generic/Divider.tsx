"use client";

import { useTranslation } from "react-i18next";

interface Props {
  type?: "horizontal" | "vertical" | "or";
  className?: string;
}

export function Divider({ type = "horizontal", className }: Props) {
  const { t } = useTranslation();

  if (type === "horizontal") {
    return <div className={`w-full h-[1px] bg-border sm:my-2 my-0 ${className}`} />;
  }

  if (type === "or") {
    return (
      <div className={`flex w-full items-center gap-3 my-2 ${className}`}>
        <div className="h-px flex-1 bg-border" />
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-background">
          <span className="text-caption font-bold uppercase text-text-primary">
            {t("common.or")}
          </span>
        </div>
        <div className="h-px flex-1 bg-border" />
      </div>
    );
  }

  return <div className={`h-12 w-px bg-warning-border ${className}`} />;
}
