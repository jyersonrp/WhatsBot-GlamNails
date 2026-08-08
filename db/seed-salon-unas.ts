import { getDb } from "../api/queries/connection";
import {
  botConfiguration,
  botRules,
  messageTemplates,
  conversations,
  messages,
  contacts,
} from "./schema";

/**
 * Datos semilla específicos para el caso de estudio del proyecto:
 * "Glam Nails Maturín" — salón de uñas.
 *
 * Reutiliza el mismo esquema de base de datos que seed-simple.ts
 * (no se modifica db/schema.ts) pero reemplaza el contenido genérico
 * de "planes/pedidos" de software por el negocio real: catálogo de
 * servicios de uñas, horario de atención, reglas de conversación,
 * plantillas y contactos de ejemplo.
 *
 * Ver MEJORA_SALON_UNAS.md para el detalle de qué se agregó y por qué.
 */

async function seed() {
  const db = getDb();
  console.log("Sembrando datos de Glam Nails Maturín...");

  // ── Configuración del bot ──────────────────────────────────────
  await db.insert(botConfiguration).values({
    isActive: true,
    welcomeMessage:
      "¡Hola! 💅 Bienvenida a *Glam Nails Maturín*. Soy tu asistente virtual y puedo ayudarte con:\n\n" +
      "1️⃣ Catálogo y precios\n2️⃣ Horario de atención\n3️⃣ Ubicación\n4️⃣ Agendar una cita\n" +
      "5️⃣ Cancelar o reprogramar\n6️⃣ Promociones\n7️⃣ Hablar con una asesora\n\n¿En qué te ayudo hoy?",
    awayMessage:
      "Gracias por escribir a *Glam Nails Maturín* 💅. En este momento estamos fuera de horario " +
      "(atendemos martes a sábado, 9:00 am - 5:00 pm). Tu mensaje quedó registrado y una asesora te " +
      "responderá apenas abramos.",
    businessHoursStart: "09:00",
    businessHoursEnd: "17:00",
    businessDays: ["tuesday", "wednesday", "thursday", "friday", "saturday"],
  });
  console.log("bot_configuration OK");

  // ── Reglas del bot (12) ─────────────────────────────────────────
  await db.insert(botRules).values([
    {
      name: "Saludo de bienvenida",
      triggerType: "keyword",
      triggerValue: "hola, buenos días, buenas tardes, buenas noches, hey, hi, buenas",
      responseType: "text",
      responseContent:
        "¡Hola! 💅 Bienvenida a *Glam Nails Maturín*. Puedo ayudarte con catálogo y precios, " +
        "horario, ubicación, agendar/cancelar tu cita o promociones. ¿Qué necesitas?",
      priority: 1,
    },
    {
      name: "Catálogo de servicios",
      triggerType: "keyword",
      triggerValue: "catálogo, catalogo, servicios, que servicios tienen, menu de servicios",
      responseType: "text",
      responseContent:
        "💅 *Catálogo de Servicios:*\n\n" +
        "✅ Manicure clásica\n✅ Manicure spa\n✅ Esmaltado semipermanente\n" +
        "✅ Uñas acrílicas (esculpidas)\n✅ Uñas en gel (soft gel)\n✅ Pedicure spa\n✅ Diseño / nail art\n\n" +
        "Escribe *precios* para ver las tarifas de cada servicio.",
      priority: 2,
    },
    {
      name: "Precios",
      triggerType: "keyword",
      triggerValue: "precio, precios, cuanto cuesta, cuánto cuesta, tarifa, tarifas, cuanto vale",
      responseType: "text",
      responseContent:
        "💰 *Tarifas:*\n\n" +
        "💅 Manicure clásica — $6\n💅 Manicure spa — $9\n✨ Esmaltado semipermanente — $10\n" +
        "💎 Uñas acrílicas — $18\n💎 Uñas en gel — $16\n🦶 Pedicure spa — $10\n🎨 Nail art (por uña) — desde $1\n\n" +
        "¿Te gustaría *agendar una cita*?",
      priority: 3,
    },
    {
      name: "Horario de atención",
      triggerType: "keyword",
      triggerValue: "horario, horarios, atienden, abren, cierran, a que hora",
      responseType: "text",
      responseContent:
        "🕐 *Horario de Atención:*\n\n📅 Martes a Sábado: 9:00 am - 5:00 pm\n📅 Domingo y Lunes: Cerrado\n\n" +
        "💬 El bot puede atenderte fuera de horario, pero las citas se confirman en horario laboral.",
      priority: 4,
    },
    {
      name: "Ubicación",
      triggerType: "keyword",
      triggerValue: "ubicación, ubicacion, dirección, direccion, donde quedan, como llegar, dónde están",
      responseType: "text",
      responseContent:
        "📍 *Nuestra ubicación:*\n\nAv. Bicentenario, C.C. Plaza Girasol, local 12, Maturín, Monagas.\n\n" +
        "🚗 Contamos con estacionamiento cercano. ¿Deseas *agendar una cita*?",
      priority: 5,
    },
    {
      name: "Agendar cita",
      triggerType: "keyword",
      triggerValue: "cita, agendar, reservar, quiero una cita, sacar cita, apartar",
      responseType: "text",
      responseContent:
        "📅 *¡Con gusto te agendamos!*\n\nCuéntame: 1) servicio deseado, 2) día y hora de tu preferencia, " +
        "3) tu nombre.\n\nUna asesora confirmará la disponibilidad real y te dará la cita en breve. 💅",
      priority: 6,
    },
    {
      name: "Cancelar o reprogramar cita",
      triggerType: "keyword",
      triggerValue: "cancelar, reprogramar, cambiar cita, mover cita, cancelar cita",
      responseType: "text",
      responseContent:
        "🔄 Entendido. Indícame tu nombre y la fecha de la cita que deseas cancelar o mover, y una " +
        "asesora te confirmará el cambio a la brevedad.",
      priority: 7,
    },
    {
      name: "Promociones",
      triggerType: "keyword",
      triggerValue: "promocion, promoción, promociones, oferta, ofertas, descuento",
      responseType: "text",
      responseContent:
        "🎉 *Promoción del mes:* 15% de descuento en uñas acrílicas o en gel de martes a jueves. " +
        "¡Escríbenos para agendar tu cita y aprovecharla!",
      priority: 8,
    },
    {
      name: "Hablar con asesora",
      triggerType: "keyword",
      triggerValue: "asesora, humano, persona, hablar con alguien, agente",
      responseType: "text",
      responseContent:
        "👩‍💼 Te comunico con una de nuestras asesoras. Por favor espera un momento, en breve te responderá. 💅",
      priority: 9,
    },
    {
      name: "Despedida",
      triggerType: "keyword",
      triggerValue: "gracias, adiós, adios, hasta luego, bye, nos vemos, chao",
      responseType: "text",
      responseContent:
        "¡Gracias por escribirnos! 💅 Te esperamos en *Glam Nails Maturín*. ¡Que tengas un lindo día! 😊",
      priority: 10,
    },
    {
      name: "Ayuda / menú",
      triggerType: "keyword",
      triggerValue: "ayuda, help, menu, menú, opciones",
      responseType: "text",
      responseContent:
        "🔧 *Menú de ayuda* — escribe una palabra clave:\n\n" +
        "• *catálogo* — servicios disponibles\n• *precios* — tarifas\n• *horario* — atención\n" +
        "• *ubicación* — cómo llegar\n• *cita* — agendar\n• *cancelar* — cancelar o mover tu cita\n" +
        "• *promociones* — ofertas vigentes\n• *asesora* — hablar con una persona",
      priority: 11,
    },
    {
      name: "Respuesta por defecto",
      triggerType: "default",
      triggerValue: "*",
      responseType: "text",
      responseContent:
        "No entendí muy bien tu mensaje 😅. Escribe *ayuda* para ver las opciones, o *asesora* para " +
        "hablar directamente con una persona.",
      priority: 999,
    },
  ]);
  console.log("bot_rules OK (12 reglas)");

  // ── Plantillas de mensajes ──────────────────────────────────────
  await db.insert(messageTemplates).values([
    {
      name: "bienvenida_clienta",
      category: "utility",
      language: "es",
      content: "¡Hola {{1}}! 💅 Bienvenida a Glam Nails Maturín. Gracias por escribirnos.",
      status: "approved",
    },
    {
      name: "confirmacion_cita",
      category: "utility",
      language: "es",
      content:
        "✅ *Cita Confirmada*\n\nHola {{1}}, tu cita para {{2}} quedó agendada el {{3}} a las {{4}}. ¡Te esperamos!",
      status: "approved",
    },
    {
      name: "recordatorio_cita",
      category: "utility",
      language: "es",
      content: "⏰ Recordatorio: {{1}}, tu cita de {{2}} es mañana {{3}} a las {{4}}. ¡No faltes!",
      status: "approved",
    },
    {
      name: "promocion_temporada",
      category: "marketing",
      language: "es",
      content: "🎉 {{1}}, tenemos una promoción especial: {{2}}. ⏰ Válida hasta {{3}}. ¡Agenda ya!",
      status: "pending",
    },
  ]);
  console.log("message_templates OK (4 plantillas)");

  // ── Contactos ────────────────────────────────────────────────────
  await db.insert(contacts).values([
    { phoneNumber: "+584121234567", name: "Génesis Rondón", email: "genesis.rondon@email.com", notes: "Prefiere uñas acrílicas, diseño francés" },
    { phoneNumber: "+584241234568", name: "Marielys Guzmán", email: "marielys.guzman@email.com", notes: "Cliente frecuente, siempre pide gel" },
    { phoneNumber: "+584161234569", name: "Oriana Salazar", email: "oriana.salazar@email.com", notes: "Consultó promociones de temporada" },
    { phoneNumber: "+584121234570", name: "Yumary Blanco", email: "yumary.blanco@email.com", notes: "Nueva clienta, pidió catálogo completo" },
    { phoneNumber: "+584261234571", name: "Carla Millán", email: "carla.millan@email.com", notes: "Reprogramó su cita de pedicure spa" },
  ]);
  console.log("contacts OK (5 contactos)");

  // ── Conversaciones de ejemplo ─────────────────────────────────────
  // Flujo: consulta -> catálogo/precio -> solicitud de cita -> confirmación (escalado a asesora)
  const convResult = await db
    .insert(conversations)
    .values([
      {
        phoneNumber: "+584121234567",
        contactName: "Génesis Rondón",
        status: "active",
        unreadCount: 0,
        lastMessage: "Perfecto, ahí estaré. Gracias!",
        lastMessageAt: new Date(Date.now() - 20 * 60000),
      },
      {
        phoneNumber: "+584241234568",
        contactName: "Marielys Guzmán",
        status: "pending",
        unreadCount: 1,
        lastMessage: "¿Tienen espacio este sábado en la tarde?",
        lastMessageAt: new Date(Date.now() - 5 * 60000),
      },
      {
        phoneNumber: "+584161234569",
        contactName: "Oriana Salazar",
        status: "active",
        unreadCount: 0,
        lastMessage: "Genial, escribo cuando quiera agendar",
        lastMessageAt: new Date(Date.now() - 90 * 60000),
      },
    ])
    .$returningId();
  console.log("conversations OK");

  const c0 = convResult[0].id;
  const c1 = convResult[1].id;
  const c2 = convResult[2].id;

  await db.insert(messages).values([
    // Conversación 1: catálogo -> precio -> cita -> confirmación por asesora
    { conversationId: c0, sender: "customer", content: "Hola, buenas tardes", status: "read", createdAt: new Date(Date.now() - 60 * 60000) },
    { conversationId: c0, sender: "bot", content: "¡Hola! 💅 Bienvenida a Glam Nails Maturín. ¿En qué te ayudo hoy?", status: "read", createdAt: new Date(Date.now() - 59 * 60000) },
    { conversationId: c0, sender: "customer", content: "¿Qué servicios tienen?", status: "read", createdAt: new Date(Date.now() - 55 * 60000) },
    { conversationId: c0, sender: "bot", content: "💅 Catálogo: manicure clásica/spa, esmaltado semipermanente, uñas acrílicas, uñas en gel, pedicure spa y nail art.", status: "read", createdAt: new Date(Date.now() - 54 * 60000) },
    { conversationId: c0, sender: "customer", content: "¿Cuánto cuesta el acrílico?", status: "read", createdAt: new Date(Date.now() - 50 * 60000) },
    { conversationId: c0, sender: "bot", content: "💎 Uñas acrílicas — $18. ¿Deseas agendar una cita?", status: "read", createdAt: new Date(Date.now() - 49 * 60000) },
    { conversationId: c0, sender: "customer", content: "Sí, quiero una cita para el viernes en la mañana, diseño francés", status: "read", createdAt: new Date(Date.now() - 45 * 60000) },
    { conversationId: c0, sender: "bot", content: "📅 Perfecto, te comunico con una asesora para confirmar la disponibilidad real del viernes en la mañana.", status: "read", createdAt: new Date(Date.now() - 44 * 60000) },
    { conversationId: c0, sender: "agent", content: "Hola Génesis, soy Andrea de Glam Nails. Tenemos espacio el viernes 9:30 am para uñas acrílicas con diseño francés, ¿te queda bien?", status: "read", createdAt: new Date(Date.now() - 30 * 60000) },
    { conversationId: c0, sender: "customer", content: "Sí, perfecto", status: "read", createdAt: new Date(Date.now() - 25 * 60000) },
    { conversationId: c0, sender: "agent", content: "✅ Cita confirmada: viernes 9:30 am, uñas acrílicas diseño francés. ¡Te esperamos!", status: "read", createdAt: new Date(Date.now() - 21 * 60000) },
    { conversationId: c0, sender: "customer", content: "Perfecto, ahí estaré. Gracias!", status: "delivered", createdAt: new Date(Date.now() - 20 * 60000) },

    // Conversación 2: pide horario/disponibilidad -> pendiente de asesora
    { conversationId: c1, sender: "customer", content: "Hola", status: "read", createdAt: new Date(Date.now() - 15 * 60000) },
    { conversationId: c1, sender: "bot", content: "¡Hola! 💅 Bienvenida a Glam Nails Maturín. ¿En qué te ayudo hoy?", status: "read", createdAt: new Date(Date.now() - 14 * 60000) },
    { conversationId: c1, sender: "customer", content: "¿Tienen espacio este sábado en la tarde?", status: "delivered", createdAt: new Date(Date.now() - 5 * 60000) },
    { conversationId: c1, sender: "bot", content: "📅 Para confirmar disponibilidad real del sábado te comunico con una asesora en un momento.", status: "delivered", createdAt: new Date(Date.now() - 4 * 60000) },

    // Conversación 3: consulta de promociones y ubicación, resuelta 100% por el bot
    { conversationId: c2, sender: "customer", content: "Buenas, ¿tienen alguna promoción?", status: "read", createdAt: new Date(Date.now() - 100 * 60000) },
    { conversationId: c2, sender: "bot", content: "🎉 Promoción del mes: 15% de descuento en uñas acrílicas o en gel de martes a jueves.", status: "read", createdAt: new Date(Date.now() - 99 * 60000) },
    { conversationId: c2, sender: "customer", content: "¿Dónde quedan ubicadas?", status: "read", createdAt: new Date(Date.now() - 95 * 60000) },
    { conversationId: c2, sender: "bot", content: "📍 Av. Bicentenario, C.C. Plaza Girasol, local 12, Maturín, Monagas.", status: "read", createdAt: new Date(Date.now() - 94 * 60000) },
    { conversationId: c2, sender: "customer", content: "Genial, escribo cuando quiera agendar", status: "read", createdAt: new Date(Date.now() - 90 * 60000) },
  ]);
  console.log("messages OK");

  console.log("\n✅ Glam Nails Maturín sembrado exitosamente!");
}

seed().catch(console.error);
