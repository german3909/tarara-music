function Svg({ size = 20, children, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function MusicNote(props) {
  return (
    <Svg {...props}>
      <path d="M9 18V5l11-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="17" cy="16" r="3" />
    </Svg>
  );
}

export function Search(props) {
  return (
    <Svg {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.4-3.4" />
    </Svg>
  );
}

export function Library(props) {
  return (
    <Svg {...props}>
      <path d="M4 4v16" />
      <path d="M9 4v16" />
      <path d="m13.5 5.2 5.8 14.1" />
      <path d="M3 4h2M8 4h2M18 19h2" />
    </Svg>
  );
}

export function Heart({ filled = false, ...props }) {
  return (
    <Svg fill={filled ? 'currentColor' : 'none'} {...props}>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21.2l7.8-7.7 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
    </Svg>
  );
}

export function ListMusic(props) {
  return (
    <Svg {...props}>
      <path d="M21 15V6l-7-2v11" />
      <circle cx="11" cy="17" r="3" />
      <path d="M3 6h6M3 11h6M3 16h4" />
    </Svg>
  );
}

export function User(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </Svg>
  );
}

export function LogOut(props) {
  return (
    <Svg {...props}>
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M15 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
    </Svg>
  );
}

export function Play({ filled = true, ...props }) {
  return (
    <Svg fill={filled ? 'currentColor' : 'none'} {...props}>
      <path d="M8 5.5v13l11-6.5-11-6.5Z" />
    </Svg>
  );
}

export function Pause(props) {
  return (
    <Svg fill="currentColor" stroke="none" {...props}>
      <rect x="7" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </Svg>
  );
}

export function Next(props) {
  return (
    <Svg fill="currentColor" stroke="none" {...props}>
      <path d="M6 5.5v13l10-6.5L6 5.5Z" />
      <rect x="17" y="5" width="2.5" height="14" rx="1" />
    </Svg>
  );
}

export function Previous(props) {
  return (
    <Svg fill="currentColor" stroke="none" {...props}>
      <path d="M18 5.5v13L8 12l10-6.5Z" />
      <rect x="4.5" y="5" width="2.5" height="14" rx="1" />
    </Svg>
  );
}

export function Volume(props) {
  return (
    <Svg {...props}>
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="M15 9a4 4 0 0 1 0 6" />
      <path d="M18 6.5a8 8 0 0 1 0 11" />
    </Svg>
  );
}

export function VolumeMuted(props) {
  return (
    <Svg {...props}>
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="m16 9 5 6M21 9l-5 6" />
    </Svg>
  );
}

export function Plus(props) {
  return (
    <Svg {...props}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function Trash(props) {
  return (
    <Svg {...props}>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="m19 6-1 15H6L5 6" />
      <path d="M10 11v6M14 11v6" />
    </Svg>
  );
}

export function Close(props) {
  return (
    <Svg {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </Svg>
  );
}

export function Menu(props) {
  return (
    <Svg {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Svg>
  );
}

export function ChevronRight(props) {
  return (
    <Svg {...props}>
      <path d="m9 5 7 7-7 7" />
    </Svg>
  );
}

export function Disc(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2.5" />
    </Svg>
  );
}

export function Sparkles(props) {
  return (
    <Svg {...props}>
      <path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z" />
      <path d="M19 15.5 20 18l2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5Z" />
    </Svg>
  );
}

export function Clock(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Svg>
  );
}
