/** Etiqueta corta del enlace, según el sitio. No inventa una red si no es esa. */
export function etiquetaEnlace(url: string): string {
  const host = new URL(url).hostname.replace(/^www\./, "");
  if (host === "instagram.com") return "Instagram";
  if (host === "linkedin.com") return "LinkedIn";
  return "Sitio web";
}
