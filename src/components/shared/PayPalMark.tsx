// PayPal's double-P monogram, simplified: a light-blue P behind a white one. Meant for a PayPal-navy (#003087) tile.
export const PayPalMark = ({ className = "size-3" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden className={className}>
    <path fillRule="evenodd" fill="#009cde" d="M10.5 6h6.2a4.3 4.3 0 0 1 0 8.6h-3.6L12.1 21H8.7zM13.4 8.8l-.6 3.4h3.3a1.7 1.7 0 0 0 0-3.4z" />
    <path fillRule="evenodd" fill="#fff" d="M7 2h6.2a4.3 4.3 0 0 1 0 8.6H9.6L8.6 17H5.2zM9.9 4.8l-.6 3.4h3.3a1.7 1.7 0 0 0 0-3.4z" />
  </svg>
);
