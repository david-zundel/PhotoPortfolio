import "react";

/**
 * Allow CSS custom properties (`--foo`) as keys in inline `style` objects.
 * The scene components (AutumnPondScene and the winter layers) drive their
 * animations through CSS variables set inline; this is a pure type relaxation
 * that lets those `style={{ "--run": "99vw", ... }}` objects type-check without
 * per-object casts. No runtime effect.
 */
declare module "react" {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }
}
