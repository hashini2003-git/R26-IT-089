import type { ReactNode } from "react";
import styles from "../meditation.module.css";

interface ActionButtonProps {
  children: ReactNode;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  secondary?: boolean;
  type?: "button" | "submit";
}

export function ActionButton({
  children,
  icon,
  onClick,
  disabled = false,
  secondary = false,
  type = "button",
}: ActionButtonProps) {
  return (
    <button
      type={type}
      className={secondary ? styles.secondaryButton : styles.primaryButton}
      onClick={onClick}
      disabled={disabled}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
