"use client";

export function ConfirmSubmitButton({
  mensaje,
  children,
  disabled,
}: {
  mensaje: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      onClick={(e) => {
        if (!window.confirm(mensaje)) e.preventDefault();
      }}
      className="text-xs font-medium text-red-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400"
    >
      {children}
    </button>
  );
}
