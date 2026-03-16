import React from "react";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action
}) => {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-background p-6 text-center shadow-sm">
      <div className="text-base font-semibold text-foreground">{title}</div>
      {description ? (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
};
