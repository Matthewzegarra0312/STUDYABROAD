import { z } from "zod";

/**
 * Todo dato de `src/data/` lleva un estado (CLAUDE.md · Reglas de contenido, #2).
 * Solo lo "confirmado" se publica, salvo que el componente muestre
 * explícitamente "Por anunciar" / "Por confirmar".
 */
export const EstadoSchema = z.enum(["confirmado", "por-confirmar"]);
export type Estado = z.infer<typeof EstadoSchema>;

const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;
const HORA_RE = /^\d{2}:\d{2}$/;
const CODIGO_RE = /^[A-Z]{2,4}$/;

const FechaSchema = z.string().regex(FECHA_RE, "usa el formato YYYY-MM-DD");
const HoraSchema = z.string().regex(HORA_RE, "usa el formato HH:mm");
const CodigoSchema = z.string().regex(CODIGO_RE, "usa 2 a 4 letras mayúsculas (p. ej. MX, US, UTP)");

// ---------------------------------------------------------------------------
// Evento (src/data/evento.ts)
// ---------------------------------------------------------------------------
// A propósito NO tiene ningún campo de aforo/capacidad (CLAUDE.md, regla 3).
export const EventoSchema = z.object({
  nombre: z.string(),
  fecha: FechaSchema,
  horaInicio: HoraSchema,
  horaFin: HoraSchema,
  lugar: z.string(),
  direccion: z.string(),
  zonaHoraria: z.string(),
  gratuito: z.boolean(),
  inscripcionPrevia: z.boolean(),
  lumaUrl: z.url(),
  organizadores: z.array(z.string()).min(1),
  /** Contacto para códigos de canje perdidos después del evento (PLAN.md,
   *  sección 4 y sección 8: "Contacto para códigos perdidos..."). null
   *  hasta que el equipo lo confirme. */
  contactoSoporte: z.string().nullable(),
  estado: EstadoSchema,
});
export type Evento = z.infer<typeof EventoSchema>;

// ---------------------------------------------------------------------------
// Cronograma (src/data/cronograma.ts)
// ---------------------------------------------------------------------------
export const ModalidadSchema = z.enum([
  "presencial",
  // Vlog pregrabado + preguntas en vivo por Zoom. Nunca "presencial"
  // (CLAUDE.md, regla 6).
  "vlog-zoom",
  // Charla en vivo por Zoom, sin vlog pregrabado (distinto de "vlog-zoom").
  "zoom-vivo",
  // Receso del programa: sin ponente ni modalidad real.
  "receso",
]);
export type Modalidad = z.infer<typeof ModalidadSchema>;

export const EspacioSchema = z.enum(["auditorio", "zona-stands"]);
export type Espacio = z.infer<typeof EspacioSchema>;

export const CronogramaBloqueSchema = z
  .object({
    orden: z.number().int().positive(),
    titulo: z.string(),
    /** null solo para bloques "receso" (PLAN.md, sección "Cronograma: datos confirmados"). */
    quien: z.string().nullable(),
    /** El documento fuente ya no distingue espacio por bloque; null = no especificado. */
    espacio: EspacioSchema.nullable(),
    modalidad: ModalidadSchema,
    horaInicio: HoraSchema.nullable(),
    horaFin: HoraSchema.nullable(),
    estado: EstadoSchema,
  })
  .superRefine((data, ctx) => {
    if (data.modalidad !== "receso" && data.quien === null) {
      ctx.addIssue({
        code: "custom",
        path: ["quien"],
        message: 'solo un bloque "receso" puede tener "quien" en null',
      });
    }
  });
export type CronogramaBloque = z.infer<typeof CronogramaBloqueSchema>;

/** El carril paralelo de stands, que corre junto al cronograma del auditorio. */
export const CarrilParaleloSchema = z.object({
  titulo: z.string(),
  horaInicio: HoraSchema.nullable(),
  horaFin: HoraSchema.nullable(),
  quienes: z.array(z.string()).min(1),
  nota: z.string(),
  estado: EstadoSchema,
});
export type CarrilParalelo = z.infer<typeof CarrilParaleloSchema>;

// ---------------------------------------------------------------------------
// Stands (src/data/stands.ts)
// ---------------------------------------------------------------------------
export const StandSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  /** null cuando el stand aún no entrega una descripción (se muestra "Por anunciar"). */
  descripcion: z.string().nullable(),
  /** Ruta relativa dentro de src/assets/aliados/. Ausente = placeholder. */
  logo: z.string().optional(),
  /** true cuando el logo es a color y debe ir sobre fondo claro (por defecto va sobre fondo oscuro). */
  logoClaro: z.boolean().optional(),
  /** Fondo de la cabecera de la puerta. Archivo en src/assets/aliados/. */
  fondo: z.string().optional(),
  /** Sitio o red confirmados. Ausente = sin enlace. */
  url: z.url().optional(),
  estado: EstadoSchema,
});
export type Stand = z.infer<typeof StandSchema>;

// ---------------------------------------------------------------------------
// Aliados (src/data/aliados.ts)
// ---------------------------------------------------------------------------
export const AliadoSchema = z.object({
  nombre: z.string(),
  /** Ruta relativa dentro de src/assets/aliados/. Ausente = placeholder. */
  logo: z.string().optional(),
  estado: EstadoSchema,
});
export type Aliado = z.infer<typeof AliadoSchema>;

// ---------------------------------------------------------------------------
// Postulaciones / convocatorias (src/data/postulaciones.ts)
// ---------------------------------------------------------------------------
// El nombre de la convocatoria y la institución son públicos. Las fechas,
// el enlace oficial y "dónde preguntar" solo se muestran si estado es
// "confirmado" (fechas y enlace son, además, contenido protegido: nunca
// van en public/, páginas prerenderizadas ni JS de cliente. CLAUDE.md
// regla 10).
export const PostulacionSchema = z
  .object({
    id: z.string(),
    programa: z.string(),
    destino: z.string(),
    codigoPais: CodigoSchema,
    institucion: z.string(),
    apertura: FechaSchema.nullable(),
    cierre: FechaSchema.nullable(),
    urlOficial: z.url().nullable(),
    dondePreguntar: z.string().nullable(),
    estado: EstadoSchema,
    verificadoEl: FechaSchema.nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.estado !== "confirmado") return;
    (["apertura", "cierre", "urlOficial", "dondePreguntar", "verificadoEl"] as const).forEach(
      (campo) => {
        if (data[campo] === null) {
          ctx.addIssue({
            code: "custom",
            path: [campo],
            message: `una postulación "confirmado" no puede tener "${campo}" en null (CLAUDE.md, reglas 1 y 2)`,
          });
        }
      },
    );
  });
export type Postulacion = z.infer<typeof PostulacionSchema>;

// ---------------------------------------------------------------------------
// Tips (src/data/tips.ts). SOLO se importa desde código de servidor
// ---------------------------------------------------------------------------
export const TipSchema = z
  .object({
    convocatoriaId: z.string(),
    fuente: z.string(),
    tips: z.array(z.string()).min(1),
    estado: EstadoSchema,
  })
  .superRefine((data, ctx) => {
    if (data.estado === "confirmado" && data.tips.length !== 3) {
      ctx.addIssue({
        code: "custom",
        path: ["tips"],
        message: 'un tip "confirmado" necesita exactamente 3 tips (PLAN.md, sección 2)',
      });
    }
  });
export type Tip = z.infer<typeof TipSchema>;

// ---------------------------------------------------------------------------
// FAQ (src/data/faq.ts)
// ---------------------------------------------------------------------------
export const FaqItemSchema = z
  .object({
    pregunta: z.string(),
    respuesta: z.string().nullable(),
    estado: EstadoSchema,
  })
  .superRefine((data, ctx) => {
    if (data.estado === "confirmado" && data.respuesta === null) {
      ctx.addIssue({
        code: "custom",
        path: ["respuesta"],
        message: 'una FAQ "confirmado" necesita respuesta',
      });
    }
  });
export type FaqItem = z.infer<typeof FaqItemSchema>;

// ---------------------------------------------------------------------------
// Viaje: cronograma visual (src/data/schedule.ts)
// ---------------------------------------------------------------------------
export const ScheduleModeSchema = z.enum(["presencial", "vlog-zoom", "zoom", "libre"]);
export type ScheduleMode = z.infer<typeof ScheduleModeSchema>;

export const ScheduleRowSchema = z.object({
  start: HoraSchema,
  end: HoraSchema,
  title: z.string(),
  who: z.string().optional(),
  mode: ScheduleModeSchema,
});
export type ScheduleRow = z.infer<typeof ScheduleRowSchema>;

export const ScheduleGroupSchema = z.object({
  n: z.number().int().positive(),
  title: z.string(),
  from: HoraSchema,
  to: HoraSchema,
  rows: z.array(ScheduleRowSchema).min(1),
});
export type ScheduleGroup = z.infer<typeof ScheduleGroupSchema>;

export const ScheduleBreakSchema = z.object({
  start: HoraSchema,
  end: HoraSchema,
  title: z.string(),
});
export type ScheduleBreak = z.infer<typeof ScheduleBreakSchema>;

// Viaje: tarjetas de ponente (pase de abordaje) y puertas de embarque.
export const SpeakerModeSchema = z.enum(["vlog-zoom", "zoom", "experiencia"]);
export type SpeakerMode = z.infer<typeof SpeakerModeSchema>;

export const SpeakerSchema = z.object({
  id: z.string(),
  initials: z.string().min(1).max(3),
  /** Código de país del sello. null = sin sello (no se inventa un código). */
  code: CodigoSchema.nullable(),
  name: z.string(),
  institution: z.string().nullable(),
  mode: SpeakerModeSchema,
  /** Hora de la actividad en el cronograma (tarjeta "Sale"). */
  time: HoraSchema,
  /** Ruta relativa dentro de src/assets/ponentes/. Ausente = placeholder. */
  imagen: z.string().optional(),
  /** Perfil confirmado (Instagram, LinkedIn o sitio). Ausente = sin enlace. */
  url: z.url().optional(),
  estado: EstadoSchema,
});
export type Speaker = z.infer<typeof SpeakerSchema>;

export const AllyLinkSchema = z.object({
  name: z.string(),
  /** null = el aliado se muestra, pero todavía sin URL confirmada. */
  url: z.url().nullable(),
  /** Archivo en src/assets/aliados/. Ausente = solo el nombre. */
  logo: z.string().optional(),
});
export type AllyLink = z.infer<typeof AllyLinkSchema>;

export const GateColorSchema = z.enum(["violet", "magenta", "road", "sky-deep"]);
export const GateSchema = z.object({
  n: z.number().int().positive(),
  /** Debe coincidir con el `id` de un stand en src/data/stands.ts. */
  standId: z.string(),
  name: z.string(),
  color: GateColorSchema,
  estado: EstadoSchema,
});
export type Gate = z.infer<typeof GateSchema>;
