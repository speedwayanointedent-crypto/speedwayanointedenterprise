import React from "react";

type StickyActionBarProps = {
  children: React.ReactNode;
  className?: string;
};

export const StickyActionBar: React.FC<StickyActionBarProps> = ({
  children,
  className = ""
}) => {
  return (
    <div
      className={`sticky bottom-0 z-10 border-t border-border bg-card/95 px-4 py-3 backdrop-blur ${className}`}
    >
      <div className="flex flex-wrap items-center justify-end gap-2">
        {children}
      </div>
    </div>
  );
};
