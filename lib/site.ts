/** Single source of truth for Skyline Voyager public details. */
export const site = {
  name: "Skyline Voyager",
  legalName: "Skyline Voyager LLC",
  domain: "skylinevoyager.com",
  url: "https://skylinevoyager.com",
  email: "info@skylinevoyager.com",
  /** Served from `/public` (e.g. `public/skyline-logo.png`). */
  logoPath: "/skyline-logo.png",
} as const;

export function siteLogoAbsoluteUrl(): string {
  return `${site.url}${site.logoPath}`;
}
