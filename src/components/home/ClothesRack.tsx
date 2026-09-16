export function ClothesRack({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 560 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path d="M28 22h504" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
      <path d="M62 22v22M498 22v22" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />

      <path d="M118 44v20M280 44v20M442 44v20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M90 64h56M252 64h56M414 64h56" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />

      <path
        d="M96 86c14 22 74 22 88 0"
        stroke="currentColor"
        strokeWidth="6.5"
        strokeLinecap="round"
      />
      <path
        d="M96 86 62 122l28 16v132h100V138l28-16-34-36"
        stroke="currentColor"
        strokeWidth="6.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path d="M90 138h100" stroke="currentColor" strokeWidth="6.5" />

      <path
        d="M258 90c10 16 54 16 64 0"
        stroke="currentColor"
        strokeWidth="6.5"
        strokeLinecap="round"
      />
      <path
        d="M258 90v164h64V90"
        stroke="currentColor"
        strokeWidth="6.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      <path
        d="M376 86c14 22 74 22 88 0"
        stroke="currentColor"
        strokeWidth="6.5"
        strokeLinecap="round"
      />
      <path
        d="M376 86 342 122l28 16v132h100V138l28-16-34-36"
        stroke="currentColor"
        strokeWidth="6.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path d="M370 138h100" stroke="currentColor" strokeWidth="6.5" />
    </svg>
  );
}
