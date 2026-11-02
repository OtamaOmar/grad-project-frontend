const paths = {
  play: "m9 5 11 7-11 7V5Z",
  book: "M12 5C8 2 4 2 2 4v16c3-2 7-2 10 0 3-2 7-2 10 0V4c-3-2-7-2-10 1Zm0 0v15M5 7h4m-4 4h4m6-4h4m-4 4h4",
  pairs: "M12 3v8M5 21v-6l7-4 7 4v6M9 6l3-3 3 3M2 18l3 3 3-3m8 0 3 3 3-3",
  eye: "M2 12c5-9 15-9 20 0-5 9-15 9-20 0Zm14 0a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  section: "M4 5h16v16H4V5Zm0 5h16M8 2v6m8-6v6M8 14h8m-8 3h5",
  density: "M3 4h18v16H3V4Zm6 0v16m6-16v16",
  chevron: "m9 5 7 7-7 7",
  shield: "m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6l8-4Zm-4 10 3 3 5-6",
  chart: "M4 19V9h3v10m4 0V4h3v15m4 0v-7h3v7",
  warning: "m12 3 10 18H2L12 3Zm0 6v5m0 3v.1",
  plus: "M12 4v16M4 12h16",
  search: "m16 16 5 5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z",
  filter: "M3 6h18M6 12h12m-8 6h4",
  calendar: "M4 5h16v16H4V5Zm0 5h16M8 2v6m8-6v6",
  download: "M12 3v12m-4-4 4 4 4-4M4 15v5h16v-5",
  arrow: "M3 12h18m-6-6 6 6-6 6",
  sync: "M3 10a9 9 0 0 1 15-6l3 3M21 2v5h-5M21 14a9 9 0 0 1-15 6l-3-3m0 5v-5h5",
  check: "m5 12 4 4L19 6",
  verified: "m12 2 3 2 4 1 1 4 2 3-2 3-1 4-4 1-3 2-3-2-4-1-1-4-2-3 2-3 1-4 4-1 3-2Zm-5 10 3 3 6-6",
  groups:
    "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9v-2c0-6 14-6 14 0v2M17 3a4 4 0 0 1 0 8m2 3c3 1 3 3 3 6",
  trend: "m3 17 5-5 4 3 8-10m-5 0h5v5",
  tree: "M9 2h6v5H9V2Zm3 5v5H4v5m8-5h8v5M1 17h6v5H1v-5Zm16 0h6v5h-6v-5Z",
  tune: "M4 7h7m4 0h5M4 17h3m4 0h9M11 4v6M7 14v6m9-10v4M4 12h12m4 0h-4",
  file: "M5 2h9l5 5v15H5V2Zm9 0v6h5M8 12h8m-8 4h8",
  grid: "M3 3h18v18H3V3Zm6 0v18m6-18v18M3 9h18M3 15h18",
  info: "M12 11v6m0-10v.1m10 4.9a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
  explain: "M9 21v-4H6v-5H3l3-6c2-5 12-5 14 1 2 5-1 8-4 10v4M12 6v7m-3-4h6",
  close: "m5 5 14 14M5 19 19 5",
  send: "M12 20V4m-6 6 6-6 6 6",
  moon: "M21 13A9 9 0 0 1 11 3a9 9 0 1 0 10 10Z",
  sun: "M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2m-3 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
};
export function CoordinatorIcon({ name }) {
  return (
    <svg
      className="cd-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.info} />
    </svg>
  );
}
