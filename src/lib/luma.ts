import evento from "../data/evento";

/**
 * Arma la URL de inscripción en Luma con parámetros UTM, sin tocar el
 * `tk` (token de invitación del evento) que ya trae `evento.lumaUrl`.
 *
 * Todo CTA de inscripción debe usar este helper (CLAUDE.md · Convenciones
 * técnicas).
 *
 * @param source Identifica el CTA que originó el clic, p. ej. "hero",
 *   "nav", "calendario", "cta-final", "dock-movil".
 */
export function lumaUrl(source: string): string {
  const url = new URL(evento.lumaUrl);
  url.searchParams.set("utm_source", "site");
  url.searchParams.set("utm_medium", "cta");
  url.searchParams.set("utm_campaign", source);
  return url.toString();
}

/**
 * Enlace de Luma sin parámetros (ni `tk` ni UTM), para textos que la persona
 * pega en sus redes, donde un enlace corto se ve mejor.
 */
export function lumaUrlCorta(): string {
  const url = new URL(evento.lumaUrl);
  return `${url.origin}${url.pathname}`;
}
