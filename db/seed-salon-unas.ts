import { getDb } from "../api/queries/connection";
import {
  users,
  services,
  appointments,
  botConfiguration,
  botRules,
  messageTemplates,
  conversations,
  messages,
  contacts,
} from "./schema";
import { hashPassword } from "../api/lib/crypto";

/**
 * Datos semilla específicos para el caso de estudio:
 * "Glam Nails Maturín" — Salón de belleza y estética de uñas.
 */
export async function seedGlamNails(dbInstance?: ReturnType<typeof getDb>) {
  const db = dbInstance || getDb();
  console.log("🌸 Sembrando datos de Glam Nails Maturín en PostgreSQL...");

  // ── 1. Usuarios del Sistema (Admin y Recepcionista) ───────────
  const adminPasswordHash = await hashPassword("admin123456");
  const agentPasswordHash = await hashPassword("agente123456");

  const seededUsers = await db
    .insert(users)
    .values([
      {
        email: "admin@glamnails.com",
        passwordHash: adminPasswordHash,
        name: "Andrea Directora (Glam Nails)",
        role: "admin",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
      },
      {
        email: "recepcion@glamnails.com",
        passwordHash: agentPasswordHash,
        name: "Valentina Recepción",
        role: "agent",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      },
    ])
    .returning();
  console.log("✅ Usuarios iniciales creados (admin@glamnails.com / admin123456)");

  // ── 2. Catálogo de Servicios de Uñas ──────────────────────────
  const seededServices = await db
    .insert(services)
    .values([
      {
        name: "Manicure Clásica",
        description: "Limpieza profunda de cutículas, limado anatómico, exfoliación y esmaltado tradicional.",
        priceUsd: 6,
        durationMinutes: 45,
        isActive: true,
      },
      {
        name: "Manicure Spa",
        description: "Manicure completa con mascarilla hidratante, masaje relajante y parafina tibia.",
        priceUsd: 9,
        durationMinutes: 60,
        isActive: true,
      },
      {
        name: "Esmaltado Semipermanente",
        description: "Esmaltado en gel curado en lámpara UV/LED con duración impecable de 21 días.",
        priceUsd: 10,
        durationMinutes: 60,
        isActive: true,
      },
      {
        name: "Uñas Acrílicas Esculpidas",
        description: "Extensión con polímero acrílico de alta durabilidad, forma y largo al gusto.",
        priceUsd: 18,
        durationMinutes: 120,
        isActive: true,
      },
      {
        name: "Uñas en Gel (Soft Gel)",
        description: "Tips de gel suave ultra ligeros de fijación completa, acabado natural e hipoalergénico.",
        priceUsd: 16,
        durationMinutes: 90,
        isActive: true,
      },
      {
        name: "Pedicure Spa",
        description: "Higiene podal integral, exfoliación con sales marinas y esmaltado impecable.",
        priceUsd: 10,
        durationMinutes: 60,
        isActive: true,
      },
      {
        name: "Nail Art / Diseños",
        description: "Diseño a mano alzada, pedrería Swarovski, foil o efecto cromo (tarifa por uña).",
        priceUsd: 1,
        durationMinutes: 15,
        isActive: true,
      },
    ])
    .returning();
  console.log(`✅ Catálogo de servicios creado (${seededServices.length} servicios)`);

  // ── 3. Configuración del Bot ──────────────────────────────────
  await db.insert(botConfiguration).values({
    isActive: true,
    welcomeMessage:
      "¡Hola! 💅 Bienvenida a *Glam Nails Maturín*. Soy Sofía, tu asistente virtual y puedo ayudarte con:\n\n" +
      "1️⃣ Catálogo de servicios\n2️⃣ Precios y tarifas\n3️⃣ Horario de atención\n4️⃣ Ubicación del salón\n" +
      "5️⃣ Agendar una cita\n6️⃣ Cancelar o reprogramar\n7️⃣ Promociones del mes\n8️⃣ Hablar con una asesora\n\n¿En qué te ayudo hoy?",
    awayMessage:
      "Gracias por escribir a *Glam Nails Maturín* 💅. En este momento estamos fuera de horario " +
      "(atendemos martes a sábado, 9:00 am - 5:00 pm). Tu mensaje quedó registrado y una asesora te " +
      "responderá a primera hora.",
    businessHoursStart: "09:00",
    businessHoursEnd: "17:00",
    businessDays: JSON.stringify(["tuesday", "wednesday", "thursday", "friday", "saturday"]),
  });
  console.log("✅ Configuración del bot OK");

  // ── 4. Reglas del Bot (Optimizadas con prioridad y sin colisiones)
  await db.insert(botRules).values([
    {
      name: "Cancelar o reprogramar cita",
      triggerType: "keyword",
      triggerValue: "cancelar cita, cancelar mi cita, cancelar, reprogramar, cambiar cita, mover cita, no podre ir, no puedo ir, postergar, mover fecha, cambiar fecha, anular cita, anulacion",
      responseType: "text",
      responseContent:
        "🔄 Entendido. Indícame tu nombre completo y la fecha de la cita que deseas cancelar o reprogramar. " +
        "Una asesora lo confirmará en breve en el sistema.",
      priority: 2, // Prioridad máxima en citas para evitar colisión con agendar
    },
    {
      name: "Pago Móvil y anticipo",
      triggerType: "keyword",
      triggerValue: "pago movil, datos de pago, transferencia, comprobante, captura, anticipo, cuenta, banco, como pagar, banesco, pagar, bcv, tasa, tasa bcv, capture, datos bancarios, numero de cuenta, abono, abono de cita",
      responseType: "text",
      responseContent:
        "💳 *Datos de Pago Móvil Glam Nails:*\n\n• Banco: Banesco (0134)\n• Teléfono: 0412-1234567\n• RIF: J-501234567\n• Anticipo para citas: $5 (a tasa oficial BCV)\n\nPor favor envíanos la captura o comprobante una vez realizada la operación.",
      priority: 3,
    },
    {
      name: "Precios",
      triggerType: "keyword",
      triggerValue: "precio, precios, cuanto cuesta, tarifa, tarifas, cuanto vale, costo, costos, presupuesto, cotizacion, cuanto cobran, valor, a como estan, en cuanto sale",
      responseType: "text",
      responseContent:
        "💰 *Lista de Precios Oficial (Glam Nails):*\n\n" +
        "💅 Manicure clásica — $6\n💅 Manicure spa — $9\n✨ Esmaltado semipermanente — $10\n" +
        "💎 Uñas acrílicas — $18\n💎 Uñas en gel — $16\n🦶 Pedicure spa — $10\n🎨 Nail art — desde $1\n\n" +
        "Aceptamos Pago Móvil (tasa oficial BCV), efectivo y transferencias. ¿Deseas *agendar una cita*?",
      priority: 4,
    },
    {
      name: "Agendar cita",
      triggerType: "keyword",
      triggerValue: "agendar, reservar, quiero una cita, sacar cita, apartar, cita para, agendar cita, reservar cita, apartar cupo, quiero cita, hacer una cita, tienen cita, tienen disponible, disponibilidad, tienen turno, turno, quiero turno, agendame",
      responseType: "text",
      responseContent:
        "📅 *¡Con gusto te agendamos en Glam Nails!*\n\nPor favor indícame:\n1) Tu nombre\n2) Servicio que deseas\n3) Día y hora de tu preferencia\n\n" +
        "Para apartar el cupo solicitamos un anticipo de $5 por Pago Móvil. ¡Te responderemos con la disponibilidad!",
      priority: 5,
    },
    {
      name: "Catálogo de servicios",
      triggerType: "keyword",
      triggerValue: "catalogo, servicios, que servicios tienen, menu de servicios, servicios disponibles, acrilico, acrilicas, acrilicos, unas acrilicas, gel, soft gel, kapping, bano de acrilico, semipermanente, esmalte, esmaltado, manicure, manicura, pedicure, pedicura, spa, disenos, esculpidas, unas, sistemas, postizas, que hacen, que ofrecen",
      responseType: "text",
      responseContent:
        "💅 *Catálogo de Servicios:*\n\n" +
        "✨ Manicure clásica ($6)\n✨ Manicure spa ($9)\n✨ Esmaltado semipermanente ($10)\n" +
        "💎 Uñas acrílicas esculpidas ($18)\n💎 Uñas en gel soft gel ($16)\n🦶 Pedicure spa ($10)\n🎨 Nail art / diseño ($1+ por uña)\n\n" +
        "Escribe *precios* para más detalles o *agendar* para apartar tu cupo.",
      priority: 6,
    },
    {
      name: "Horario de atención",
      triggerType: "keyword",
      triggerValue: "horario, horarios, atienden, abren, cierran, a que hora, cuando abren, que dias abren, que dias atienden, estan abiertas, estan abiertas hoy, abren hoy, hora de atencion, jornada",
      responseType: "text",
      responseContent:
        "🕐 *Horario de Atención en Salón:*\n\n📅 Martes a Sábado: 9:00 am - 5:00 pm\n📅 Domingo y Lunes: Cerrado (descanso del equipo)\n\n" +
        "💬 Puedes escribirnos a cualquier hora; te responderemos apenas comience la jornada.",
      priority: 7,
    },
    {
      name: "Ubicación",
      triggerType: "keyword",
      triggerValue: "ubicacion, direccion, donde quedan, como llegar, donde estan, estacionamiento, donde es, plaza girasol, bicentenario, como llego, en que parte estan, direccion exacta, referencia, centro comercial",
      responseType: "text",
      responseContent:
        "📍 *Nuestra ubicación en Maturín:*\n\nAv. Bicentenario, C.C. Plaza Girasol, local 12, Maturín, Monagas.\n\n" +
        "🚗 Contamos con estacionamiento vigilado y aire acondicionado. ¿Te gustaría agendar tu cita?",
      priority: 8,
    },
    {
      name: "Saludo de bienvenida",
      triggerType: "keyword",
      triggerValue: "hola, buenos dias, buenas tardes, buenas noches, hey, hi, buenas, saludos, que tal, buen dia, hello",
      responseType: "text",
      responseContent:
        "¡Hola! 💅 Bienvenida a *Glam Nails Maturín*. Puedo ayudarte con nuestro catálogo, precios, " +
        "horario, ubicación, agendar o cancelar tu cita. ¿En qué podemos consentirte hoy?",
      priority: 90, // Prioridad baja para que consultas específicas con saludo ("hola, quiero cancelar...") no sean interceptadas
    },
    {
      name: "Promociones",
      triggerType: "keyword",
      triggerValue: "promocion, promociones, oferta, ofertas, descuento, promo",
      responseType: "text",
      responseContent:
        "🎉 *Promoción de la Semana:* 15% de descuento en Uñas Acrílicas y Gel los días martes y miércoles. " +
        "¡Escríbenos para agendar y asegurar tu descuento!",
      priority: 9,
    },
    {
      name: "Hablar con asesora",
      triggerType: "keyword",
      triggerValue: "asesora, humano, persona, hablar con alguien, recepcionista, agente",
      responseType: "text",
      responseContent:
        "👩‍💼 Te estoy comunicando con Valentina en recepción. He silenciado el bot momentáneamente para que te atienda personalmente. 💅",
      priority: 10,
    },
    {
      name: "Despedida",
      triggerType: "keyword",
      triggerValue: "gracias, adios, hasta luego, bye, nos vemos, chao, feliz dia",
      responseType: "text",
      responseContent:
        "¡Gracias a ti por escribir a *Glam Nails Maturín*! 💅 Te esperamos pronto. ¡Que tengas un hermoso día! ✨",
      priority: 11,
    },
    {
      name: "Ayuda / menú",
      triggerType: "keyword",
      triggerValue: "ayuda, help, menu, opciones, comandos",
      responseType: "text",
      responseContent:
        "🔧 *Opciones rápidas:* Escribe una palabra clave:\n\n" +
        "• *catálogo* — servicios\n• *precios* — tarifas\n• *horario* — jornada\n" +
        "• *ubicación* — dirección\n• *pago móvil* — datos de cuenta\n• *agendar* — reservar cita\n• *cancelar* — modificar cita\n" +
        "• *promociones* — ofertas\n• *asesora* — atención humana",
      priority: 12,
    },
    {
      name: "Respuesta por defecto",
      triggerType: "default",
      triggerValue: "*",
      responseType: "text",
      responseContent:
        "No logré comprender del todo tu mensaje 😅. Puedes escribir *ayuda* para ver las opciones disponibles, o *asesora* para que una de nuestras chicas te responda directamente.",
      priority: 999,
    },
  ]);
  console.log("✅ 13 Reglas del bot configuradas y optimizadas");

  // ── 5. Plantillas de Mensajes ─────────────────────────────────
  await db.insert(messageTemplates).values([
    {
      name: "bienvenida_clienta",
      category: "utility",
      language: "es",
      content: "¡Hola {{1}}! 💅 Bienvenida a Glam Nails Maturín. Es un placer atenderte.",
      status: "approved",
    },
    {
      name: "confirmacion_cita",
      category: "utility",
      language: "es",
      content:
        "✅ *Cita Confirmada en Glam Nails*\n\nHola {{1}}, tu cita para *{{2}}* está reservada para el *{{3}}* a las *{{4}}*. ¡Te esperamos en C.C. Plaza Girasol!",
      status: "approved",
    },
    {
      name: "recordatorio_cita",
      category: "utility",
      language: "es",
      content: "⏰ Recordatorio: {{1}}, mañana tienes tu cita de {{2}} a las {{3}}. Por favor llega 5 min antes. ¡Nos vemos!",
      status: "approved",
    },
    {
      name: "solicitud_pago_movil",
      category: "utility",
      language: "es",
      content:
        "💳 *Datos de Pago Móvil Glam Nails:*\n\nBanco: Banesco (0134)\nTeléfono: 0412-1234567\nRIF: J-501234567\n\nPor favor envíanos la captura una vez realizada la transferencia.",
      status: "approved",
    },
  ]);
  console.log("✅ Plantillas de mensaje creadas");

  // ── 6. Contactos ──────────────────────────────────────────────
  const seededContacts = await db
    .insert(contacts)
    .values([
      {
        phoneNumber: "+584121234567",
        name: "Génesis Rondón",
        email: "genesis.rondon@email.com",
        notes: "Prefiere acrílicas número 3 con efecto almendrado y diseño francés.",
      },
      {
        phoneNumber: "+584241234568",
        name: "Marielys Guzmán",
        email: "marielys.guzman@email.com",
        notes: "Clienta frecuente, siempre pide Soft Gel y esmaltado nude.",
      },
      {
        phoneNumber: "+584161234569",
        name: "Oriana Salazar",
        email: "oriana.salazar@email.com",
        notes: "Preguntó por promociones de manicure spa.",
      },
    ])
    .returning();
  console.log(`✅ Contactos creados (${seededContacts.length} contactos)`);

  // ── 7. Conversaciones y Mensajes de Ejemplo ───────────────────
  const seededConvs = await db
    .insert(conversations)
    .values([
      {
        phoneNumber: "+584121234567",
        contactName: "Génesis Rondón",
        status: "active",
        unreadCount: 0,
        lastMessage: "Perfecto, ahí estaré el viernes. Gracias!",
        lastMessageAt: new Date(Date.now() - 20 * 60000),
        assignedTo: seededUsers[1].id,
        isBotMuted: false,
      },
      {
        phoneNumber: "+584241234568",
        contactName: "Marielys Guzmán",
        status: "pending",
        unreadCount: 1,
        lastMessage: "¿Tienen espacio este sábado a las 2:00 pm?",
        lastMessageAt: new Date(Date.now() - 5 * 60000),
        assignedTo: seededUsers[1].id,
        isBotMuted: true,
      },
    ])
    .returning();

  const c0 = seededConvs[0].id;
  const c1 = seededConvs[1].id;

  await db.insert(messages).values([
    {
      conversationId: c0,
      sender: "customer",
      content: "Hola, buenas tardes",
      status: "read",
      createdAt: new Date(Date.now() - 60 * 60000),
    },
    {
      conversationId: c0,
      sender: "bot",
      content: "¡Hola! 💅 Bienvenida a Glam Nails Maturín. ¿En qué te ayudo hoy?",
      status: "read",
      createdAt: new Date(Date.now() - 59 * 60000),
    },
    {
      conversationId: c0,
      sender: "customer",
      content: "¿Cuánto cuesta el acrílico?",
      status: "read",
      createdAt: new Date(Date.now() - 50 * 60000),
    },
    {
      conversationId: c0,
      sender: "bot",
      content: "💎 Uñas acrílicas — $18. ¿Deseas agendar una cita?",
      status: "read",
      createdAt: new Date(Date.now() - 49 * 60000),
    },
    {
      conversationId: c0,
      sender: "customer",
      content: "Aquí les dejo la captura del pago móvil del anticipo",
      messageType: "image",
      mediaUrl: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=500",
      status: "read",
      createdAt: new Date(Date.now() - 40 * 60000),
    },
    {
      conversationId: c0,
      sender: "agent",
      content: "¡Pago verificado Génesis! Cita confirmada para el viernes 9:30 am. 💅",
      status: "read",
      createdAt: new Date(Date.now() - 30 * 60000),
    },
    {
      conversationId: c1,
      sender: "customer",
      content: "¿Tienen espacio este sábado a las 2:00 pm?",
      status: "delivered",
      createdAt: new Date(Date.now() - 5 * 60000),
    },
  ]);
  console.log("✅ Mensajes de prueba sembrados (con imagen de comprobante)");

  // ── 8. Citas Iniciales ────────────────────────────────────────
  const nextFriday = new Date();
  nextFriday.setDate(nextFriday.getDate() + ((5 + 7 - nextFriday.getDay()) % 7 || 7));
  nextFriday.setHours(9, 30, 0, 0);

  const nextSaturday = new Date();
  nextSaturday.setDate(nextSaturday.getDate() + ((6 + 7 - nextSaturday.getDay()) % 7 || 7));
  nextSaturday.setHours(14, 0, 0, 0);

  await db.insert(appointments).values([
    {
      conversationId: c0,
      contactId: seededContacts[0].id,
      serviceId: seededServices[3].id, // Uñas Acrílicas
      clientName: "Génesis Rondón",
      clientPhone: "+584121234567",
      scheduledAt: nextFriday,
      status: "confirmada",
      notes: "Acrílicas número 3 diseño francés, anticipo recibido.",
      paymentProofUrl: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=500",
    },
    {
      conversationId: c1,
      contactId: seededContacts[1].id,
      serviceId: seededServices[4].id, // Soft Gel
      clientName: "Marielys Guzmán",
      clientPhone: "+584241234568",
      scheduledAt: nextSaturday,
      status: "pendiente",
      notes: "Consulta cupo para soft gel sábado 2:00 pm.",
    },
  ]);
  console.log("✅ Citas sembradas (1 confirmada, 1 pendiente)");

  console.log("\n🌸 Glam Nails Maturín sembrado exitosamente en PostgreSQL!");
}

if (process.argv[1]?.replace(/\\/g, "/").includes("seed-salon-unas")) {
  seedGlamNails().catch((err) => {
    console.error("Error al sembrar base de datos:", err);
    process.exit(1);
  });
}
