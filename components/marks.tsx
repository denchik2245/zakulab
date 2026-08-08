export function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <span aria-hidden="true">{diagonal ? "↗" : "→"}</span>;
}

export function LabMark({ children }: { children: React.ReactNode }) {
  return <span className="lab-mark">{children}</span>;
}
