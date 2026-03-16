import React from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  kicker?: string;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  size?: "md" | "lg";
};

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  kicker,
  actions,
  meta,
  size = "md"
}) => {
  const titleClass = size === "lg" ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl";
  return (
    <div className="section-header">
      <div>
        {kicker ? (
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {kicker}
          </p>
        ) : null}
        <h1 className={`${titleClass} font-bold text-foreground text-balance`}>{title}</h1>
        {subtitle ? (
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
        {meta ? <div className="mt-2 text-xs text-muted-foreground">{meta}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
};
