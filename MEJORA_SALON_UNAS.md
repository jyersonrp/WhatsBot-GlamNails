# Mejora aplicada: contenido específico para salón de uñas

## Contexto

El sistema **WhatsBot** (código base en `/app`) fue generado originalmente como un CRM
genérico de atención al cliente por WhatsApp: incluye gestión de conversaciones, motor de
reglas, plantillas, contactos, dashboard y configuración, pero sus datos de ejemplo
(`db/seed-simple.ts`) simulaban una empresa de software con "planes" y "pedidos", sin
relación con el caso de estudio elegido para el proyecto (un salón de uñas).

## Qué se agregó

Se creó `db/seed-salon-unas.ts`, un script de datos semilla alternativo que reutiliza el
mismo esquema de base de datos (no se tocó `db/schema.ts`) pero reemplaza el contenido de
negocio por el de un salón de uñas real, *Glam Nails Maturín*:

| Tabla | Contenido agregado |
|---|---|
| `bot_configuration` | Mensaje de bienvenida, mensaje fuera de horario y horario de atención propios de un salón de uñas (martes a sábado). |
| `bot_rules` | 12 reglas de conversación: saludo, catálogo de servicios, precios, horario, agendar cita, cancelar/reprogramar, ubicación, promociones, hablar con asesora, despedida, ayuda y respuesta por defecto. |
| `message_templates` | Plantillas de confirmación y recordatorio de cita, bienvenida y promoción de temporada. |
| `contacts` | 5 clientas de ejemplo con notas de preferencia de servicio. |
| `conversations` / `messages` | 3 conversaciones de ejemplo que muestran el flujo real: consulta → catálogo/precio → solicitud de cita → confirmación. |

## Por qué se hizo así (alcance de la mejora)

El Entregable 2 (JAT / PERT-CPM) de este proyecto planificó un "Módulo de citas/agenda" y
un "Catálogo de servicios" como entregables de la Fase 3. Agregar tablas y endpoints
nuevos (un módulo de agenda con disponibilidad en tiempo real) implicaría una nueva fase
de desarrollo completa. Para esta entrega se optó por el camino consistente con el motor
de reglas ya implementado: el bot **atiende catálogo, precios, horario y ubicación de
forma 100% automática**, y para todo lo que requiere confirmar disponibilidad real
(agendar, cancelar o reprogramar una cita) **escala la conversación a una asesora
humana**, que es exactamente la decisión modelada en el Entregable 1 (Programación
Dinámica) y en el diagrama de flujo del proyecto.

## Cómo ejecutar la siembra de datos

Con la base de datos MySQL del proyecto ya configurada (variables de entorno en `.env`,
ver `.env.example`):

```bash
npx tsx db/seed-salon-unas.ts
# o bien
npm run db:seed:salon
```

El script imprime en consola cada bloque de datos insertado y finaliza con un mensaje de
confirmación.
