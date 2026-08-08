import { getDb } from "../api/queries/connection";
import {
  conversations,
  messages,
  botRules,
  messageTemplates,
  contacts,
  botConfiguration,
} from "./schema";
import { sql } from "drizzle-orm";

async function seed() {
  const db = getDb();
  console.log("Seeding database...");

  // ─── 1. Bot Configuration ───────────────────────────────────────
  await db.insert(botConfiguration).values({
    isActive: true,
    welcomeMessage:
      "¡Hola! 👋 Bienvenido a nuestro servicio de atención al cliente. Soy el asistente virtual y estoy aquí para ayudarte. ¿En qué puedo asistirte hoy?\n\nEscribe el número de la opción que necesites:\n1. Información sobre nuestros servicios\n2. Horarios de atención\n3. Precios y planes\n4. Realizar un pedido\n5. Hablar con un agente humano",
    awayMessage:
      "Gracias por contactarnos. Actualmente estamos fuera de nuestro horario de atención (Lunes a Viernes 9:00 - 18:00). Un agente te responderá tan pronto como sea posible. 🕐",
    businessHoursStart: "09:00",
    businessHoursEnd: "18:00",
  });
  console.log("✅ Bot configuration created");

  // ─── 2. Bot Rules ───────────────────────────────────────────────
  const rulesData = [
    {
      name: "Saludo de Bienvenida",
      triggerType: "keyword" as const,
      triggerValue: "hola, buenos días, buenas tardes, buenas noches, hey, hi, hello",
      responseType: "text" as const,
      responseContent:
        "¡Hola! 👋 Soy el asistente virtual de WhatsBot. Estoy aquí para ayudarte con:\n\n1️⃣ Información sobre servicios\n2️⃣ Horarios de atención\n3️⃣ Precios y planes\n4️⃣ Realizar un pedido\n5️⃣ Hablar con un agente\n\n¿Qué opción te interesa?",
      priority: 1,
    },
    {
      name: "Información de Servicios",
      triggerType: "keyword" as const,
      triggerValue: "servicios, información, opción 1, 1, que ofrecen, que hacen",
      responseType: "text" as const,
      responseContent:
        "📋 *Nuestros Servicios:*\n\n✅ Atención al cliente automatizada 24/7\n✅ Respuestas inteligentes con IA\n✅ Gestión de múltiples conversaciones\n✅ Plantillas de mensajes personalizadas\n✅ Análisis y reportes en tiempo real\n✅ Integración con CRM\n\n¿Te gustaría conocer nuestros precios? Escribe *precios*",
      priority: 2,
    },
    {
      name: "Horarios de Atención",
      triggerType: "keyword" as const,
      triggerValue: "horario, horarios, atención, cuando atienden, que hora, opción 2, 2",
      responseType: "text" as const,
      responseContent:
        "🕐 *Horario de Atención:*\n\n📅 Lunes a Viernes: 9:00 - 18:00\n📅 Sábados: 10:00 - 14:00\n📅 Domingos: Cerrado\n\n💬 *Atención por bot:* Disponible 24/7\n\n¿Necesitas algo más? Escribe *ayuda* para ver las opciones.",
      priority: 3,
    },
    {
      name: "Precios y Planes",
      triggerType: "keyword" as const,
      triggerValue: "precio, precios, costo, planes, tarifa, opción 3, 3, cuanto cuesta",
      responseType: "text" as const,
      responseContent:
        "💰 *Nuestros Planes:*\n\n🥉 *Básico* - $29/mes\n• 1,000 mensajes/mes\n• 1 número de WhatsApp\n• Respuestas automáticas\n\n🥈 *Profesional* - $79/mes\n• 5,000 mensajes/mes\n• 2 números de WhatsApp\n• Bot con IA avanzada\n• Reportes detallados\n\n🥇 *Empresarial* - $199/mes\n• Mensajes ilimitados\n• Números ilimitados\n• API completa\n• Soporte prioritario\n\n¿Te interesa algún plan? Escribe *pedido*",
      priority: 4,
    },
    {
      name: "Realizar Pedido",
      triggerType: "keyword" as const,
      triggerValue: "pedido, orden, comprar, contratar, opción 4, 4, quiero",
      responseType: "text" as const,
      responseContent:
        "🛒 *¿Listo para comenzar?*\n\nPara realizar tu pedido, necesitamos algunos datos:\n\n1️⃣ Nombre completo\n2️⃣ Correo electrónico\n3️⃣ Plan que deseas\n4️⃣ Número de WhatsApp para la integración\n\nUn agente humano te contactará en menos de 30 minutos para completar tu registro. ⏱️\n\nO si prefieres, escribe *agente* para hablar con alguien ahora.",
      priority: 5,
    },
    {
      name: "Hablar con Agente",
      triggerType: "keyword" as const,
      triggerValue: "agente, humano, persona, opción 5, 5, hablar con alguien, representante",
      responseType: "text" as const,
      responseContent:
        "👨‍💼 *Tranferencia a agente humano*\n\nEstamos conectándote con uno de nuestros agentes. Por favor espera un momento...\n\n⏱️ *Tiempo estimado de espera:* 2-5 minutos\n\nMientras tanto, ¿puedes contarnos brevemente qué necesitas? Así el agente podrá ayudarte más rápido.",
      priority: 6,
    },
    {
      name: "Despedida",
      triggerType: "keyword" as const,
      triggerValue: "adiós, adios, gracias, hasta luego, bye, nos vemos, chau",
      responseType: "text" as const,
      responseContent:
        "¡Gracias por contactarnos! 🙏\n\nFue un placer atenderte. Si necesitas algo más, no dudes en escribirnos. Estamos aquí para ayudarte.\n\n¡Que tengas un excelente día! 😊",
      priority: 7,
    },
    {
      name: "Ayuda General",
      triggerType: "keyword" as const,
      triggerValue: "ayuda, help, menu, menú, opciones",
      responseType: "text" as const,
      responseContent:
        "🔧 *Menú de Ayuda*\n\nEscribe cualquiera de estas palabras clave:\n\n• *servicios* - Información sobre nuestros servicios\n• *horario* - Horarios de atención\n• *precios* - Planes y tarifas\n• *pedido* - Realizar un pedido\n• *agente* - Hablar con un humano\n• *hola* - Saludo inicial\n\n¿En qué puedo ayudarte?",
      priority: 8,
    },
    {
      name: "Respuesta por Defecto",
      triggerType: "default" as const,
      triggerValue: "*",
      responseType: "text" as const,
      responseContent:
        "Lo siento, no he entendido tu mensaje. 😅\n\nEscribe *ayuda* para ver las opciones disponibles, o escribe *agente* para hablar con un representante humano.",
      priority: 999,
    },
  ];

  for (const rule of rulesData) {
    await db.insert(botRules).values(rule);
  }
  console.log(`✅ ${rulesData.length} bot rules created`);

  // ─── 3. Message Templates ───────────────────────────────────────
  const templatesData = [
    {
      name: "bienvenida_cliente",
      category: "utility" as const,
      language: "es",
      content:
        "¡Hola {{1}}! 👋 Bienvenido a WhatsBot. Tu cuenta ha sido creada exitosamente. ¿En qué podemos ayudarte hoy?",
      variables: JSON.stringify(["customer_name"]),
      status: "approved" as const,
    },
    {
      name: "confirmacion_pedido",
      category: "utility" as const,
      language: "es",
      content:
        "✅ *Pedido Confirmado*\n\nHola {{1}}, tu pedido #{{2}} ha sido confirmado.\n\n📦 Producto: {{3}}\n💰 Total: {{4}}\n📅 Fecha estimada: {{5}}\n\nGracias por tu compra! 🎉",
      variables: JSON.stringify(["customer_name", "order_id", "product", "total", "delivery_date"]),
      status: "approved" as const,
    },
    {
      name: "recordatorio_cita",
      category: "utility" as const,
      language: "es",
      content:
        "📅 *Recordatorio de Cita*\n\nHola {{1}}, te recordamos tu cita programada para:\n\n📆 Fecha: {{2}}\n🕐 Hora: {{3}}\n📍 Lugar: {{4}}\n\nPara confirmar responde *SI* o para cancelar responde *NO*.",
      variables: JSON.stringify(["customer_name", "date", "time", "location"]),
      status: "approved" as const,
    },
    {
      name: "promocion_especial",
      category: "marketing" as const,
      language: "es",
      content:
        "🎉 *Promoción Especial*\n\nHola {{1}}! Tenemos una oferta exclusiva para ti:\n\n{{2}}\n\n⏰ Válido hasta: {{3}}\n\nResponde *INFO* para más detalles o *COMPRAR* para aprovechar la oferta.",
      variables: JSON.stringify(["customer_name", "offer_details", "expiration_date"]),
      status: "pending" as const,
    },
    {
      name: "codigo_verificacion",
      category: "authentication" as const,
      language: "es",
      content:
        "🔐 *Código de Verificación*\n\nTu código de verificación es: *{{1}}*\n\nEste código expira en 10 minutos. No lo compartas con nadie.",
      variables: JSON.stringify(["verification_code"]),
      status: "approved" as const,
    },
  ];

  for (const template of templatesData) {
    await db.insert(messageTemplates).values(template);
  }
  console.log(`✅ ${templatesData.length} message templates created`);

  // ─── 4. Contacts ────────────────────────────────────────────────
  const contactsData = [
    {
      phoneNumber: "+34612345678",
      name: "María García",
      email: "maria.garcia@email.com",
      notes: "Cliente interesada en plan Profesional",
      labels: JSON.stringify(["prospecto", "plan-profesional"]),
    },
    {
      phoneNumber: "+34623456789",
      name: "Carlos López",
      email: "carlos.lopez@empresa.com",
      notes: "Cliente empresarial actual",
      labels: JSON.stringify(["cliente", "plan-empresarial"]),
    },
    {
      phoneNumber: "+34634567890",
      name: "Ana Martínez",
      email: "ana.martinez@email.com",
      notes: "Consulta sobre precios",
      labels: JSON.stringify(["lead", "consulta-precios"]),
    },
    {
      phoneNumber: "+34645678901",
      name: "Pedro Sánchez",
      email: "pedro.sanchez@negocio.com",
      notes: "Nuevo contacto",
      labels: JSON.stringify(["nuevo"]),
    },
    {
      phoneNumber: "+34656789012",
      name: "Laura Torres",
      email: "laura.torres@email.com",
      notes: "Soporte técnico",
      labels: JSON.stringify(["soporte", "ticket-abierto"]),
    },
  ];

  for (const contact of contactsData) {
    await db.insert(contacts).values(contact);
  }
  console.log(`✅ ${contactsData.length} contacts created`);

  // ─── 5. Conversations ───────────────────────────────────────────
  const conversationsData = [
    {
      phoneNumber: "+34612345678",
      contactName: "María García",
      status: "active" as const,
      unreadCount: 2,
      lastMessage: "Quiero saber más sobre el plan Profesional",
      lastMessageAt: new Date(Date.now() - 2 * 60000), // 2 min ago
    },
    {
      phoneNumber: "+34623456789",
      contactName: "Carlos López",
      status: "active" as const,
      unreadCount: 0,
      lastMessage: "Perfecto, gracias por la ayuda",
      lastMessageAt: new Date(Date.now() - 15 * 60000), // 15 min ago
    },
    {
      phoneNumber: "+34634567890",
      contactName: "Ana Martínez",
      status: "active" as const,
      unreadCount: 1,
      lastMessage: "¿Cuál es el horario de atención?",
      lastMessageAt: new Date(Date.now() - 60 * 60000), // 1 hr ago
    },
    {
      phoneNumber: "+34645678901",
      contactName: "Pedro Sánchez",
      status: "active" as const,
      unreadCount: 3,
      lastMessage: "Necesito hacer un pedido urgente",
      lastMessageAt: new Date(Date.now() - 3 * 60 * 60000), // 3 hr ago
    },
    {
      phoneNumber: "+34656789012",
      contactName: "Laura Torres",
      status: "active" as const,
      unreadCount: 1,
      lastMessage: "Mi pedido no ha llegado todavía",
      lastMessageAt: new Date(Date.now() - 5 * 60 * 60000), // 5 hr ago
    },
  ];

  const createdConversations: { id: number; phoneNumber: string }[] = [];
  for (const conv of conversationsData) {
    const result = await db.insert(conversations).values(conv).$returningId();
    createdConversations.push({ id: result[0].id, phoneNumber: conv.phoneNumber });
  }
  console.log(`✅ ${conversationsData.length} conversations created`);

  // ─── 6. Messages ────────────────────────────────────────────────
  const messagesData = [
    // María García conversation
    {
      conversationId: createdConversations[0].id,
      sender: "customer" as const,
      content: "Hola, buenos días",
      messageType: "text" as const,
      status: "read" as const,
      createdAt: new Date(Date.now() - 10 * 60000),
    },
    {
      conversationId: createdConversations[0].id,
      sender: "bot" as const,
      content:
        "¡Buenos días! 👋 Soy el asistente virtual de WhatsBot. ¿En qué puedo ayudarte?\n\n1️⃣ Información sobre servicios\n2️⃣ Horarios de atención\n3️⃣ Precios y planes\n4️⃣ Realizar un pedido\n5️⃣ Hablar con un agente",
      messageType: "text" as const,
      status: "read" as const,
      createdAt: new Date(Date.now() - 9 * 60000),
    },
    {
      conversationId: createdConversations[0].id,
      sender: "customer" as const,
      content: "Quiero saber más sobre el plan Profesional",
      messageType: "text" as const,
      status: "read" as const,
      createdAt: new Date(Date.now() - 5 * 60000),
    },
    {
      conversationId: createdConversations[0].id,
      sender: "bot" as const,
      content:
        "💰 *Plan Profesional - $79/mes*\n\n• 5,000 mensajes/mes\n• 2 números de WhatsApp\n• Bot con IA avanzada\n• Reportes detallados\n• Soporte prioritario\n\n¿Te gustaría contratar este plan? Escribe *pedido*",
      messageType: "text" as const,
      status: "read" as const,
      createdAt: new Date(Date.now() - 4 * 60000),
    },
    {
      conversationId: createdConversations[0].id,
      sender: "customer" as const,
      content: "Sí, me interesa",
      messageType: "text" as const,
      status: "delivered" as const,
      createdAt: new Date(Date.now() - 2 * 60000),
    },
    // Carlos López conversation
    {
      conversationId: createdConversations[1].id,
      sender: "customer" as const,
      content: "Necesito ayuda con mi facturación",
      messageType: "text" as const,
      status: "read" as const,
      createdAt: new Date(Date.now() - 30 * 60000),
    },
    {
      conversationId: createdConversations[1].id,
      sender: "bot" as const,
      content:
        "Entiendo que necesitas ayuda con facturación. 💳\n\nTe estoy transfiriendo con un agente especializado en facturación. Por favor espera un momento...",
      messageType: "text" as const,
      status: "read" as const,
      createdAt: new Date(Date.now() - 29 * 60000),
    },
    {
      conversationId: createdConversations[1].id,
      sender: "agent" as const,
      content: "Hola Carlos, soy Juan del departamento de facturación. ¿En qué puedo ayudarte con tu factura?",
      messageType: "text" as const,
      status: "read" as const,
      createdAt: new Date(Date.now() - 25 * 60000),
    },
    {
      conversationId: createdConversations[1].id,
      sender: "customer" as const,
      content: "Quiero cambiar mi método de pago",
      messageType: "text" as const,
      status: "read" as const,
      createdAt: new Date(Date.now() - 20 * 60000),
    },
    {
      conversationId: createdConversations[1].id,
      sender: "agent" as const,
      content: "Claro, puedes hacerlo desde tu panel de configuración. ¿Necesitas que te guíe paso a paso?",
      messageType: "text" as const,
      status: "read" as const,
      createdAt: new Date(Date.now() - 18 * 60000),
    },
    {
      conversationId: createdConversations[1].id,
      sender: "customer" as const,
      content: "No, ya lo encontré. Gracias!",
      messageType: "text" as const,
      status: "read" as const,
      createdAt: new Date(Date.now() - 16 * 60000),
    },
    {
      conversationId: createdConversations[1].id,
      sender: "agent" as const,
      content: "Perfecto, gracias por la ayuda",
      messageType: "text" as const,
      status: "read" as const,
      createdAt: new Date(Date.now() - 15 * 60000),
    },
    // Ana Martínez conversation
    {
      conversationId: createdConversations[2].id,
      sender: "customer" as const,
      content: "Hola, ¿cuál es el horario de atención?",
      messageType: "text" as const,
      status: "read" as const,
      createdAt: new Date(Date.now() - 65 * 60000),
    },
    {
      conversationId: createdConversations[2].id,
      sender: "bot" as const,
      content:
        "🕐 *Horario de Atención:*\n\n📅 Lunes a Viernes: 9:00 - 18:00\n📅 Sábados: 10:00 - 14:00\n📅 Domingos: Cerrado\n\n💬 *Atención por bot:* Disponible 24/7",
      messageType: "text" as const,
      status: "read" as const,
      createdAt: new Date(Date.now() - 64 * 60000),
    },
    {
      conversationId: createdConversations[2].id,
      sender: "customer" as const,
      content: "Gracias! Y los precios?",
      messageType: "text" as const,
      status: "delivered" as const,
      createdAt: new Date(Date.now() - 60 * 60000),
    },
    // Pedro Sánchez conversation
    {
      conversationId: createdConversations[3].id,
      sender: "customer" as const,
      content: "Hola, necesito hacer un pedido urgente",
      messageType: "text" as const,
      status: "read" as const,
      createdAt: new Date(Date.now() - 200 * 60000),
    },
    {
      conversationId: createdConversations[3].id,
      sender: "bot" as const,
      content:
        "🛒 *¿Listo para comenzar?*\n\nPara realizar tu pedido, necesitamos algunos datos:\n\n1️⃣ Nombre completo\n2️⃣ Correo electrónico\n3️⃣ Plan que deseas\n4️⃣ Número de WhatsApp para la integración\n\nUn agente humano te contactará en menos de 30 minutos.",
      messageType: "text" as const,
      status: "read" as const,
      createdAt: new Date(Date.now() - 199 * 60000),
    },
    {
      conversationId: createdConversations[3].id,
      sender: "customer" as const,
      content: "Pedro Sánchez, pedro@negocio.com, plan Empresarial",
      messageType: "text" as const,
      status: "read" as const,
      createdAt: new Date(Date.now() - 190 * 60000),
    },
    {
      conversationId: createdConversations[3].id,
      sender: "bot" as const,
      content:
        "Gracias Pedro! Hemos recibido tu información. Un agente te contactará pronto para completar tu pedido del plan Empresarial.",
      messageType: "text" as const,
      status: "read" as const,
      createdAt: new Date(Date.now() - 189 * 60000),
    },
    {
      conversationId: createdConversations[3].id,
      sender: "customer" as const,
      content: "Necesito que sea hoy por favor",
      messageType: "text" as const,
      status: "delivered" as const,
      createdAt: new Date(Date.now() - 180 * 60000),
    },
    {
      conversationId: createdConversations[3].id,
      sender: "customer" as const,
      content: "Es muy urgente",
      messageType: "text" as const,
      status: "delivered" as const,
      createdAt: new Date(Date.now() - 179 * 60000),
    },
    {
      conversationId: createdConversations[3].id,
      sender: "customer" as const,
      content: "Alguien me puede atender?",
      messageType: "text" as const,
      status: "delivered" as const,
      createdAt: new Date(Date.now() - 178 * 60000),
    },
    // Laura Torres conversation
    {
      conversationId: createdConversations[4].id,
      sender: "customer" as const,
      content: "Hola, mi pedido no ha llegado todavía",
      messageType: "text" as const,
      status: "read" as const,
      createdAt: new Date(Date.now() - 320 * 60000),
    },
    {
      conversationId: createdConversations[4].id,
      sender: "bot" as const,
      content:
        "Entiendo tu preocupación sobre tu pedido. 📦\n\nPara poder ayudarte, ¿podrías proporcionarme el número de pedido? Lo encontrarás en tu correo de confirmación.",
      messageType: "text" as const,
      status: "read" as const,
      createdAt: new Date(Date.now() - 319 * 60000),
    },
    {
      conversationId: createdConversations[4].id,
      sender: "customer" as const,
      content: "Es el #12345",
      messageType: "text" as const,
      status: "read" as const,
      createdAt: new Date(Date.now() - 310 * 60000),
    },
    {
      conversationId: createdConversations[4].id,
      sender: "bot" as const,
      content:
        "Gracias! He encontrado tu pedido #12345. El estado actual es: *En tránsito* 🚚\n\nFecha estimada de entrega: Mañana antes de las 6:00 PM\n\n¿Necesitas algo más?",
      messageType: "text" as const,
      status: "read" as const,
      createdAt: new Date(Date.now() - 309 * 60000),
    },
    {
      conversationId: createdConversations[4].id,
      sender: "customer" as const,
      content: "Perfecto, gracias por la información",
      messageType: "text" as const,
      status: "delivered" as const,
      createdAt: new Date(Date.now() - 300 * 60000),
    },
  ];

  for (const msg of messagesData) {
    await db.insert(messages).values(msg);
  }
  console.log(`✅ ${messagesData.length} messages created`);

  console.log("\n🎉 Database seeded successfully!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
