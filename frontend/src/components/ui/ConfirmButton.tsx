interface ConfirmButtonProps {
  className?: string;
  confirmMessage: string;
  disabled?: boolean;
  onConfirm: () => void;
  children: React.ReactNode;
}

/** Boton que pide confirmacion nativa antes de ejecutar acciones destructivas (borrar). */
export function ConfirmButton({
  className,
  confirmMessage,
  disabled,
  onConfirm,
  children,
}: ConfirmButtonProps) {
  return (
    <button
      type="button"
      className={className}
      disabled={disabled}
      onClick={() => {
        if (window.confirm(confirmMessage)) {
          onConfirm();
        }
      }}
    >
      {children}
    </button>
  );
}
