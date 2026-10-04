import { z } from "zod";

// Navegación y pie de página del concepto Viaje (VIAJE.md, sección 3).

const NavLinkSchema = z.object({
  /** "#ancla" (sección de la home) o "/ruta" (página propia). */
  href: z.string().regex(/^[#/]/, 'El href debe empezar con "#" o con "/"'),
  label: z.string(),
  /** Marca corta junto a la etiqueta, p. ej. "NUEVO". */
  tag: z.string().optional(),
});

const SocialSchema = z.object({
  id: z.enum(["instagram", "linkedin", "discord"]),
  label: z.string(),
  href: z.url(),
});

const FooterItemSchema = z.object({
  label: z.string(),
  /** null = todavía sin URL confirmada: se muestra como texto, sin enlace. */
  href: z.string().nullable(),
});

const FooterColumnSchema = z.object({
  id: z.string(),
  title: z.string(),
  items: z.array(FooterItemSchema).min(1),
});

/** Ruta del generador de badge para asistentes. */
export const badgeHref = "/badge";

export const navLinks = z.array(NavLinkSchema).parse([
  { href: "#cronograma", label: "Cronograma" },
  { href: "#ponentes", label: "Ponentes" },
  { href: "#stands", label: "Stands" },
  { href: "#calendario", label: "Calendario de becas" },
  { href: "#llegar", label: "Cómo llegar" },
  { href: badgeHref, label: "Mi badge", tag: "NUEVO" },
]);

export const socialLinks = z.array(SocialSchema).parse([
  { id: "instagram", label: "Instagram", href: "https://www.instagram.com/lead_utp/" },
  { id: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/company/lead-utp" },
  { id: "discord", label: "Discord", href: "https://discord.gg/EYXFUfYHbF" },
]);

/** Ruta del canje (no cambia la lógica: solo el enlace). */
export const canjeHref = "/canje";

export const footerColumns = z.array(FooterColumnSchema).parse([
  {
    id: "evento",
    title: "El evento",
    items: [
      { label: "Cronograma", href: "#cronograma" },
      { label: "Ponentes", href: "#ponentes" },
      { label: "Stands", href: "#stands" },
      { label: "Calendario de becas", href: "#calendario" },
    ],
  },
  {
    id: "organizan",
    title: "Organizan",
    // El Pilar todavía no tiene URL confirmada.
    items: [
      { label: "LEAD UTP", href: "https://www.instagram.com/lead_utp/" },
      { label: "Pilar de Excelencia Académica", href: null },
      { label: "UTP Internacional", href: "https://www.utp.edu.pe/internacional-utp" },
    ],
  },
]);

// TODO(confirmar): URL real de "Contacto". Sin ella no se muestra el enlace.
export const supportItems = z.array(FooterItemSchema).parse([{ label: "Canjear mi código", href: canjeHref }]);

// Pasos del pasaporte (PLAN.md, sección 2). El paso 2 usa el número de puertas.
export const passportSteps = z
  .array(z.object({ title: z.string(), text: z.string() }))
  .length(3)
  .parse([
    { title: "Recoge tu pasaporte", text: "Al ingresar al evento." },
    { title: "Junta los 4 sellos", text: "Uno por cada puerta." },
    { title: "Canjea tu código", text: "Y descarga tu calendario." },
  ]);
