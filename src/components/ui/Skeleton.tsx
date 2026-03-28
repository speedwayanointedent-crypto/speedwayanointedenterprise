import React from "react";
import classNames from "classnames";

type Props = {
  className?: string;
};

export const Skeleton: React.FC<Props> = ({ className }) => {
  return (
    <div
      className={classNames(
        "relative overflow-hidden rounded-xl bg-border opacity-60 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent",
        className
      )}
    />
  );
};






