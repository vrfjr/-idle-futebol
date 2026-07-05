import React, { CSSProperties, ReactNode } from "react";
import { m } from "framer-motion";
import { colors, radii, withAlpha, shade, readableTextOn, elevation } from "../styles/tokens";

export type ButtonVariant = "primary" | "reward" | "upgrade" | "secondary" | "icon";
type Size = "sm" | "md" | "lg";

interface Props {
  onClick: ()=>void; children: ReactNode;
  variant?: ButtonVariant; color?: string; size?: Size;
  fullWidth?: boolean; disabled?: boolean; style?: CSSProperties;
}

const PAD: Record<Size,string> = { sm:"8px 12px", md:"11px 16px", lg:"14px 20px" };
const FONT: Record<Size,number> = { sm:12, md:13, lg:14.5 };
const ICON_BOX: Record<Size,number> = { sm:28, md:34, lg:40 };

const DEFAULT_COLOR: Record<ButtonVariant,string> = {
  primary: colors.primary, reward: colors.warning, upgrade: colors.success,
  secondary: colors.textSecondary, icon: colors.primaryLight,
};

// Filled variants (primary/reward/upgrade) read as the game's main CTAs — deep gradient,
// 3D drop shadow, dims on press. Secondary/icon stay flat-tinted so they never compete
// visually with a real call to action.
export function GameButton({onClick, children, variant="primary", color, size="md", fullWidth=false, disabled=false, style={}}:Props) {
  const base = color ?? DEFAULT_COLOR[variant];
  const filled = variant==="primary" || variant==="reward" || variant==="upgrade";
  const isIcon = variant==="icon";

  const background = disabled
    ? colors.border
    : filled
      ? `linear-gradient(180deg, ${shade(base,30)}, ${base} 60%, ${shade(base,-15)})`
      : withAlpha(base,"subtle");

  const border = disabled ? colors.border : filled ? shade(base,-35) : withAlpha(base,"medium");
  const textColor = disabled ? colors.textMuted : filled ? readableTextOn(base) : base;
  const boxShadow = disabled || !filled ? undefined : elevation.raised(base);
  const pressedShadow = disabled || !filled ? boxShadow : elevation.pressed(base);

  return (
    <m.button
      onClick={disabled?undefined:onClick}
      disabled={disabled}
      whileTap={disabled?undefined:{scale:0.96, y:1, boxShadow:pressedShadow}}
      style={{
        background, border:`1px solid ${border}`,
        borderRadius: isIcon?radii.badge:radii.button,
        color:textColor, fontFamily:"inherit", fontWeight:800, fontSize:FONT[size],
        letterSpacing:0.3, cursor:disabled?"default":"pointer",
        padding: isIcon ? 0 : PAD[size],
        width: isIcon ? ICON_BOX[size] : fullWidth?"100%":undefined,
        height: isIcon ? ICON_BOX[size] : undefined,
        display:"inline-flex", alignItems:"center", justifyContent:"center", gap:6,
        boxShadow, WebkitTapHighlightColor:"transparent",
        ...style,
      }}>
      {children}
    </m.button>
  );
}
