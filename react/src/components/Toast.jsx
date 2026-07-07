export default function Toast({ message }) {
  return (
    <div className="toast-container" role="status" aria-live="polite">
      <div className="toast success" role="alert">{message}</div>
    </div>
  );
}
