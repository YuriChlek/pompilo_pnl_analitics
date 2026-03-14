export const BREAKPOINTS = {
    mobile: 0,
    tablet: 600,
    laptop: 900,
    desktop: 1200,
    wide: 1440,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

export const MEDIA_QUERIES = {
    mobileUp: `@media (min-width: ${BREAKPOINTS.mobile}px)`,
    tabletUp: `@media (min-width: ${BREAKPOINTS.tablet}px)`,
    laptopUp: `@media (min-width: ${BREAKPOINTS.laptop}px)`,
    desktopUp: `@media (min-width: ${BREAKPOINTS.desktop}px)`,
    wideUp: `@media (min-width: ${BREAKPOINTS.wide}px)`,
} as const;

export const CONTAINER_WIDTHS = {
    mobile: '100%',
    tablet: 640,
    laptop: 960,
    desktop: 1200,
    wide: 1440,
} as const;

export const LAYOUT_GUTTERS = {
    mobile: 16,
    tablet: 20,
    laptop: 24,
    desktop: 32,
    wide: 40,
} as const;

export const SECTION_SPACING = {
    mobile: 32,
    tablet: 40,
    laptop: 48,
    desktop: 64,
    wide: 80,
} as const;
