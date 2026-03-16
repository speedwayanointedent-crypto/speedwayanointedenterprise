import React from "react";
import classNames from "classnames";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
};

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  size = "md"
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div
        className={classNames(
          "w-full max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card p-6 text-foreground shadow-lg",
          {
            "max-w-md": size === "sm",
            "max-w-xl": size === "md",
            "max-w-2xl": size === "lg"
          }
        )}
      >
        <div className="flex items-center justify-between mb-4">
          {title && (
            <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          )}
          <button
            className="icon-btn"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};






