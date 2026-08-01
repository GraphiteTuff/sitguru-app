"use client";

import { useState, type ReactNode } from "react";

export default function AdminQueueCardShell({
  children,
}: {
  children: (api: { remove: () => void }) => ReactNode;
}) {
  const [removed, setRemoved] = useState(false);

  if (removed) return null;

  return <>{children({ remove: () => setRemoved(true) })}</>;
}
