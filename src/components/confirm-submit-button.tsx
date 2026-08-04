"use client";

export function ConfirmSubmitButton({
  mensaje,
  children,
  disabled,
  className,
}: {
  mensaje: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      onClick={(e) => {
        if (!window.confirm(mensaje)) e.preventDefault();
      }}
      className={
        className ??
        "text-xs font-medium text-red-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400"
      }
    >
      {children}
    </button>
  );
}
