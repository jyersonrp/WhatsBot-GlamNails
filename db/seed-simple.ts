import { getDb } from "../api/queries/connection";
import {
  botConfiguration,
  botRules,
  messageTemplates,
  conversations,
  messages,
  contacts,
} from "./schema";

async function seed() {
  const db = getDb();
  console.log("Seeding...");

  // Bot config
  await db.insert(botConfiguration).values({
    isActive: true,
    welcomeMessage: "¡Hola! 👋 Bienvenido a nuestro servicio de atención al cliente. Soy el asistente virtual y estoy aquí para ayudarte. ¿En qué puedo asistirte hoy?",
    awayMessage: "Gracias por contactarnos. Actualmente estamos fuera de nuestro horario de atención (Lunes a Viernes 9:00 - 18:00). Un agente te responderá tan pronto como sea posible.",
    businessHoursStart: "09:00",
    businessHoursEnd: "18:00",
  });
  console.log("Bot config OK");

  // Bot rules
  await db.insert(botRules).values([
    { name: "Saludo de Bienvenida", triggerType: "keyword", triggerValue: "hola, buenos días, buenas tardes, buenas noches, hey, hi", responseType: "text", responseContent: "¡Hola! 👋 Soy el asistente virtual de WhatsBot. Estoy aquí para ayudarte con:\n\n1️⃣ Información sobre servicios\n2️⃣ Horarios de atención\n3️⃣ Precios y planes\n4️⃣ Realizar un pedido\n5️⃣ Hablar con un agente\n\n¿Qué opción te interesa?", priority: 1 },
    { name: "Información de Servicios", triggerType: "keyword", triggerValue: "servicios, información, opción 1, 1", responseType: "text", responseContent: "📋 *Nuestros Servicios:*\n\n✅ Atención al cliente automatizada 24/7\n✅ Respuestas inteligentes con IA\n✅ Gestión de múltiples conversaciones\n✅ Plantillas de mensajes personalizadas\n✅ Análisis y reportes en tiempo real\n✅ Integración con CRM\n\n¿Te gustaría conocer nuestros precios? Escribe *precios*", priority: 2 },
    { name: "Horarios de Atención", triggerType: "keyword", triggerValue: "horario, horarios, atención, cuando atienden, opción 2, 2", responseType: "text", responseContent: "🕐 *Horario de Atención:*\n\n📅 Lunes a Viernes: 9:00 - 18:00\n📅 Sábados: 10:00 - 14:00\n📅 Domingos: Cerrado\n\n💬 *Atención por bot:* Disponible 24/7\n\n¿Necesitas algo más? Escribe *ayuda* para ver las opciones.", priority: 3 },
    { name: "Precios y Planes", triggerType: "keyword", triggerValue: "precio, precios, costo, planes, tarifa, opción 3, 3", responseType: "text", responseContent: "💰 *Nuestros Planes:*\n\n🥉 *Básico* - $29/mes\n• 1,000 mensajes/mes\n• 1 número de WhatsApp\n• Respuestas automáticas\n\n🥈 *Profesional* - $79/mes\n• 5,000 mensajes/mes\n• 2 números de WhatsApp\n• Bot con IA avanzada\n• Reportes detallados\n\n🥇 *Empresarial* - $199/mes\n• Mensajes ilimitados\n• Números ilimitados\n• API completa\n• Soporte prioritario\n\n¿Te interesa algún plan? Escribe *pedido*", priority: 4 },
    { name: "Realizar Pedido", triggerType: "keyword", triggerValue: "pedido, orden, comprar, contratar, opción 4, 4", responseType: "text", responseContent: "🛒 *¿Listo para comenzar?*\n\nPara realizar tu pedido, necesitamos algunos datos:\n\n1️⃣ Nombre completo\n2️⃣ Correo electrónico\n3️⃣ Plan que deseas\n4️⃣ Número de WhatsApp para la integración\n\nUn agente humano te contactará en menos de 30 minutos.", priority: 5 },
    { name: "Hablar con Agente", triggerType: "keyword", triggerValue: "agente, humano, persona, opción 5, 5", responseType: "text", responseContent: "👨‍💼 *Tranferencia a agente humano*\n\nEstamos conectándote con uno de nuestros agentes. Por favor espera un momento...\n\n⏱️ *Tiempo estimado de espera:* 2-5 minutos", priority: 6 },
    { name: "Despedida", triggerType: "keyword", triggerValue: "adiós, adios, gracias, hasta luego, bye, nos vemos", responseType: "text", responseContent: "¡Gracias por contactarnos! 🙏\n\nFue un placer atenderte. Si necesitas algo más, no dudes en escribirnos.\n\n¡Que tengas un excelente día! 😊", priority: 7 },
    { name: "Ayuda General", triggerType: "keyword", triggerValue: "ayuda, help, menu, menú, opciones", responseType: "text", responseContent: "🔧 *Menú de Ayuda*\n\nEscribe cualquiera de estas palabras clave:\n\n• *servicios* - Información sobre servicios\n• *horario* - Horarios de atención\n• *precios* - Planes y tarifas\n• *pedido* - Realizar un pedido\n• *agente* - Hablar con un humano\n• *hola* - Saludo inicial", priority: 8 },
    { name: "Respuesta por Defecto", triggerType: "default", triggerValue: "*", responseType: "text", responseContent: "Lo siento, no he entendido tu mensaje. 😅\n\nEscribe *ayuda* para ver las opciones disponibles, o escribe *agente* para hablar con un representante humano.", priority: 999 },
  ]);
  console.log("Bot rules OK");

  // Templates
  await db.insert(messageTemplates).values([
    { name: "bienvenida_cliente", category: "utility", language: "es", content: "¡Hola {{1}}! 👋 Bienvenido a WhatsBot. Tu cuenta ha sido creada exitosamente.", status: "approved" },
    { name: "confirmacion_pedido", category: "utility", language: "es", content: "✅ *Pedido Confirmado*\n\nHola {{1}}, tu pedido #{{2}} ha sido confirmado.\n📦 Producto: {{3}}\n💰 Total: {{4}}", status: "approved" },
    { name: "promocion_especial", category: "marketing", language: "es", content: "🎉 *Promoción Especial*\n\nHola {{1}}! Tenemos una oferta exclusiva:\n{{2}}\n⏰ Válido hasta: {{3}}", status: "pending" },
    { name: "codigo_verificacion", category: "authentication", language: "es", content: "🔐 *Código de Verificación*\n\nTu código es: *{{1}}*\nExpira en 10 minutos.", status: "approved" },
  ]);
  console.log("Templates OK");

  // Contacts
  await db.insert(contacts).values([
    { phoneNumber: "+34612345678", name: "María García", email: "maria.garcia@email.com", notes: "Cliente interesada en plan Profesional" },
    { phoneNumber: "+34623456789", name: "Carlos López", email: "carlos.lopez@empresa.com", notes: "Cliente empresarial actual" },
    { phoneNumber: "+34634567890", name: "Ana Martínez", email: "ana.martinez@email.com", notes: "Consulta sobre precios" },
    { phoneNumber: "+34645678901", name: "Pedro Sánchez", email: "pedro.sanchez@negocio.com", notes: "Nuevo contacto" },
    { phoneNumber: "+34656789012", name: "Laura Torres", email: "laura.torres@email.com", notes: "Soporte técnico" },
  ]);
  console.log("Contacts OK");

  // Conversations
  const convResult = await db.insert(conversations).values([
    { phoneNumber: "+34612345678", contactName: "María García", status: "active", unreadCount: 2, lastMessage: "Quiero saber más sobre el plan Profesional", lastMessageAt: new Date(Date.now() - 2 * 60000) },
    { phoneNumber: "+34623456789", contactName: "Carlos López", status: "active", unreadCount: 0, lastMessage: "Perfecto, gracias por la ayuda", lastMessageAt: new Date(Date.now() - 15 * 60000) },
    { phoneNumber: "+34634567890", contactName: "Ana Martínez", status: "active", unreadCount: 1, lastMessage: "¿Cuál es el horario de atención?", lastMessageAt: new Date(Date.now() - 60 * 60000) },
    { phoneNumber: "+34645678901", contactName: "Pedro Sánchez", status: "active", unreadCount: 3, lastMessage: "Necesito hacer un pedido urgente", lastMessageAt: new Date(Date.now() - 3 * 60 * 60000) },
    { phoneNumber: "+34656789012", contactName: "Laura Torres", status: "active", unreadCount: 1, lastMessage: "Mi pedido no ha llegado todavía", lastMessageAt: new Date(Date.now() - 5 * 60 * 60000) },
  ]).$returningId();
  console.log("Conversations OK");

  // Messages
  const c0 = convResult[0].id;
  const c1 = convResult[1].id;
  const c2 = convResult[2].id;
  const c3 = convResult[3].id;
  const c4 = convResult[4].id;

  await db.insert(messages).values([
    { conversationId: c0, sender: "customer", content: "Hola, buenos días", status: "read", createdAt: new Date(Date.now() - 10 * 60000) },
    { conversationId: c0, sender: "bot", content: "¡Buenos días! 👋 Soy el asistente virtual de WhatsBot. ¿En qué puedo ayudarte?\n\n1️⃣ Información sobre servicios\n2️⃣ Horarios de atención\n3️⃣ Precios y planes\n4️⃣ Realizar un pedido\n5️⃣ Hablar con un agente", status: "read", createdAt: new Date(Date.now() - 9 * 60000) },
    { conversationId: c0, sender: "customer", content: "Quiero saber más sobre el plan Profesional", status: "read", createdAt: new Date(Date.now() - 5 * 60000) },
    { conversationId: c0, sender: "bot", content: "💰 *Plan Profesional - $79/mes*\n\n• 5,000 mensajes/mes\n• 2 números de WhatsApp\n• Bot con IA avanzada\n• Reportes detallados\n• Soporte prioritario", status: "read", createdAt: new Date(Date.now() - 4 * 60000) },
    { conversationId: c0, sender: "customer", content: "Sí, me interesa", status: "delivered", createdAt: new Date(Date.now() - 2 * 60000) },

    { conversationId: c1, sender: "customer", content: "Necesito ayuda con mi facturación", status: "read", createdAt: new Date(Date.now() - 30 * 60000) },
    { conversationId: c1, sender: "bot", content: "Entiendo que necesitas ayuda con facturación. 💳 Te estoy transfiriendo con un agente especializado...", status: "read", createdAt: new Date(Date.now() - 29 * 60000) },
    { conversationId: c1, sender: "agent", content: "Hola Carlos, soy Juan del departamento de facturación. ¿En qué puedo ayudarte?", status: "read", createdAt: new Date(Date.now() - 25 * 60000) },
    { conversationId: c1, sender: "customer", content: "Quiero cambiar mi método de pago", status: "read", createdAt: new Date(Date.now() - 20 * 60000) },
    { conversationId: c1, sender: "agent", content: "Claro, puedes hacerlo desde tu panel de configuración. ¿Necesitas que te guíe paso a paso?", status: "read", createdAt: new Date(Date.now() - 18 * 60000) },
    { conversationId: c1, sender: "customer", content: "No, ya lo encontré. Gracias!", status: "read", createdAt: new Date(Date.now() - 16 * 60000) },
    { conversationId: c1, sender: "agent", content: "Perfecto, gracias por la ayuda", status: "read", createdAt: new Date(Date.now() - 15 * 60000) },

    { conversationId: c2, sender: "customer", content: "Hola, ¿cuál es el horario de atención?", status: "read", createdAt: new Date(Date.now() - 65 * 60000) },
    { conversationId: c2, sender: "bot", content: "🕐 *Horario de Atención:*\n\n📅 Lunes a Viernes: 9:00 - 18:00\n📅 Sábados: 10:00 - 14:00\n📅 Domingos: Cerrado\n\n💬 *Atención por bot:* Disponible 24/7", status: "read", createdAt: new Date(Date.now() - 64 * 60000) },
    { conversationId: c2, sender: "customer", content: "Gracias! Y los precios?", status: "delivered", createdAt: new Date(Date.now() - 60 * 60000) },

    { conversationId: c3, sender: "customer", content: "Hola, necesito hacer un pedido urgente", status: "read", createdAt: new Date(Date.now() - 200 * 60000) },
    { conversationId: c3, sender: "bot", content: "🛒 *¿Listo para comenzar?*\n\nPara realizar tu pedido, necesitamos algunos datos:\n\n1️⃣ Nombre completo\n2️⃣ Correo electrónico\n3️⃣ Plan que deseas\n4️⃣ Número de WhatsApp", status: "read", createdAt: new Date(Date.now() - 199 * 60000) },
    { conversationId: c3, sender: "customer", content: "Pedro Sánchez, pedro@negocio.com, plan Empresarial", status: "read", createdAt: new Date(Date.now() - 190 * 60000) },
    { conversationId: c3, sender: "bot", content: "Gracias Pedro! Hemos recibido tu información. Un agente te contactará pronto.", status: "read", createdAt: new Date(Date.now() - 189 * 60000) },
    { conversationId: c3, sender: "customer", content: "Necesito que sea hoy por favor", status: "delivered", createdAt: new Date(Date.now() - 180 * 60000) },
    { conversationId: c3, sender: "customer", content: "Es muy urgente", status: "delivered", createdAt: new Date(Date.now() - 179 * 60000) },
    { conversationId: c3, sender: "customer", content: "Alguien me puede atender?", status: "delivered", createdAt: new Date(Date.now() - 178 * 60000) },

    { conversationId: c4, sender: "customer", content: "Hola, mi pedido no ha llegado todavía", status: "read", createdAt: new Date(Date.now() - 320 * 60000) },
    { conversationId: c4, sender: "bot", content: "Entiendo tu preocupación sobre tu pedido. 📦 ¿Podrías proporcionarme el número de pedido?", status: "read", createdAt: new Date(Date.now() - 319 * 60000) },
    { conversationId: c4, sender: "customer", content: "Es el #12345", status: "read", createdAt: new Date(Date.now() - 310 * 60000) },
    { conversationId: c4, sender: "bot", content: "He encontrado tu pedido #12345. El estado actual es: *En tránsito* 🚚\nFecha estimada: Mañana antes de las 6:00 PM", status: "read", createdAt: new Date(Date.now() - 309 * 60000) },
    { conversationId: c4, sender: "customer", content: "Perfecto, gracias por la información", status: "delivered", createdAt: new Date(Date.now() - 300 * 60000) },
  ]);
  console.log("Messages OK");

  console.log("\n✅ Seeded successfully!");
}

seed().catch(console.error);
