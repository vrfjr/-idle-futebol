import React, { ReactNode } from "react";
import { spacing } from "../styles/tokens";

interface Props { children:ReactNode; }

export function Screen({children}:Props) {
  return (
    <div style={{padding:spacing.screenPadding}}>{children}</div>
  );
}
