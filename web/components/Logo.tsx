/** L'oeil de YITERE (« voir » en pular) : decoratif, le nom est ecrit a cote. */
export function Logo() {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
      <path
        d="M2 16 C8 6, 24 6, 30 16 C24 26, 8 26, 2 16 Z"
        fill="none"
        stroke="var(--texte)"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="16" r="5.5" fill="var(--logo)" />
      <circle cx="16" cy="16" r="2.2" fill="var(--fond)" />
    </svg>
  );
}
