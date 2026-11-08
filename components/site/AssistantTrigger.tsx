"use client";

import type { ReactNode } from "react";
import { useAssistant } from "../assistant/AssistantProvider";

/**
 * Any call-to-action that opens the assistant. "complaint" mode always starts the
 * report inside the assistant — there is no separate reporting form (D03, spec §3).
 */
export function AssistantTrigger({
  mode,
  className,
  children,
}: {
  mode: "question" | "complaint";
  className?: string;
  children: ReactNode;
}) {
  const { openAssistant } = useAssistant();
  return (
    <button type="button" className={className} onClick={() => openAssistant(mode)}>
      {children}
    </button>
  );
}
