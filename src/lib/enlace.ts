/** Etiqueta corta del enlace, según el sitio. No inventa una red si no es esa. */
export function etiquetaEnlace(url: string): string {
  const host = new URL(url).hostname.replace(/^www\./, "");
  if (host === "instagram.com") return "Instagram";
  if (host === "linkedin.com") return "LinkedIn";
  return "Sitio web";
}

/**
 * Enlace a un ancla de la home. En la home queda como "#ancla"; desde otra
 * página (p. ej. "/badge") pasa a "/#ancla" para volver a la home.
 */
export function enlaceInicio(ancla: string, current?: string): string {
  return current ? `/${ancla}` : ancla;
}
