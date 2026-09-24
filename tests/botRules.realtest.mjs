// Prueba funcional real del motor de reglas del WhatsBot (Glam Nails Maturín)
// Actualizado con normalización de diacríticos y tildes (Phase 5)
// Ejecutar con: node tests/botRules.realtest.mjs

function normalizeText(text) {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿?¡!.,;:()\-_'"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchRule(message, rules) {
  const normMessage = normalizeText(message);
  if (!normMessage) return null;

  const sortedRules = [...rules]
    .filter((r) => r.isActive !== false && r.triggerType !== "default")
    .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));

  for (const rule of sortedRules) {
    const triggerValue = rule.triggerValue;

    switch (rule.triggerType) {
      case "exact": {
        if (normMessage === normalizeText(triggerValue)) return rule;
        break;
      }
      case "keyword": {
        const rawKeywords = triggerValue.split(/[,;]/).map((k) => k.trim());
        const keywords = rawKeywords
          .map((k) => normalizeText(k))
          .filter(Boolean)
          .sort((a, b) => b.length - a.length);

        const paddedMessage = ` ${normMessage} `;
        if (keywords.some((kw) => paddedMessage.includes(` ${kw} `))) return rule;
        break;
      }
      case "contains": {
        if (normMessage.includes(normalizeText(triggerValue))) return rule;
        break;
      }
      case "regex": {
        try {
          const regex = new RegExp(triggerValue, "i");
          if (regex.test(message) || regex.test(normMessage)) return rule;
        } catch {
          continue;
        }
        break;
      }
      case "default":
        break;
    }
  }

  const defaultRule = rules.find((r) => r.triggerType === "default");
  if (defaultRule) return defaultRule;
  return null;
}

const SEED_RULES = [
  { name: "Saludo de bienvenida", triggerType: "keyword", triggerValue: "hola, buenos dias, buenas tardes, buenas noches, hey, hi, buenas, saludos", priority: 1 },
  { name: "Catálogo de servicios", triggerType: "keyword", triggerValue: "catalogo, servicios, que servicios tienen, menu de servicios, servicios disponibles", priority: 2 },
  { name: "Precios", triggerType: "keyword", triggerValue: "precio, precios, cuanto cuesta, tarifa, tarifas, cuanto vale, costo, costos", priority: 3 },
  { name: "Horario de atención", triggerType: "keyword", triggerValue: "horario, horarios, atienden, abren, cierran, a que hora, cuando abren", priority: 4 },
  { name: "Ubicación", triggerType: "keyword", triggerValue: "ubicacion, direccion, donde quedan, como llegar, donde estan, estacionamiento", priority: 5 },
  { name: "Pago Móvil y anticipo", triggerType: "keyword", triggerValue: "pago movil, datos de pago, transferencia, comprobante, captura, anticipo, cuenta, banco, como pagar", priority: 6 },
  { name: "Cancelar o reprogramar cita", triggerType: "keyword", triggerValue: "cancelar cita, cancelar mi cita, cancelar, reprogramar, cambiar cita, mover cita", priority: 7 },
  { name: "Agendar cita", triggerType: "keyword", triggerValue: "agendar, reservar, quiero una cita, sacar cita, apartar, cita para", priority: 8 },
  { name: "Promociones", triggerType: "keyword", triggerValue: "promocion, promociones, oferta, ofertas, descuento, promo", priority: 9 },
  { name: "Hablar con asesora", triggerType: "keyword", triggerValue: "asesora, humano, persona, hablar con alguien, recepcionista, agente", priority: 10 },
  { name: "Despedida", triggerType: "keyword", triggerValue: "gracias, adios, hasta luego, bye, nos vemos, chao, feliz dia", priority: 11 },
  { name: "Ayuda / menú", triggerType: "keyword", triggerValue: "ayuda, help, menu, opciones, comandos", priority: 12 },
  { name: "Respuesta por defecto", triggerType: "default", triggerValue: "*", priority: 999 },
];

const CASES = [
  { msg: "Hola, buenas tardes", expected: "Saludo de bienvenida" },
  { msg: "¿Qué servicios tienen?", expected: "Catálogo de servicios" },
  { msg: "¿Cuánto cuesta el acrílico?", expected: "Precios" },
  { msg: "¿A qué hora abren?", expected: "Horario de atención" },
  { msg: "¿Dónde están ubicados?", expected: "Ubicación" },
  { msg: "Quiero reservar una cita para el sábado", expected: "Agendar cita" },
  { msg: "Necesito cancelar cita", expected: "Cancelar o reprogramar cita" },
  { msg: "¿Tienen alguna promoción?", expected: "Promociones" },
  { msg: "Quiero hablar con una persona", expected: "Hablar con asesora" },
  { msg: "Muchas gracias, hasta luego", expected: "Despedida" },
  { msg: "Cuánto vale el gel", expected: "Precios" },
  { msg: "Quiero cancelar mi cita", expected: "Cancelar o reprogramar cita" },
  { msg: "¿Cuáles son los datos de pago móvil?", expected: "Pago Móvil y anticipo" },
  { msg: "Aquí está la captura del comprobante", expected: "Pago Móvil y anticipo" },
  { msg: "hice el tramite de registro", expected: "Respuesta por defecto" },
  { msg: "muchas felicitaciones por la inauguracion", expected: "Respuesta por defecto" },
  { msg: "aprecio mucho la atencion", expected: "Respuesta por defecto" },
];

console.log("# Prueba funcional real del motor de reglas — WhatsBot Glam Nails Maturín\n");
console.log("| # | Mensaje de prueba | Regla esperada | Regla obtenida | Resultado |");
console.log("|---|---|---|---|---|");

let pass = 0;
CASES.forEach((c, i) => {
  const result = matchRule(c.msg, SEED_RULES);
  const obtained = result ? result.name : "(sin coincidencia)";
  const ok = obtained === c.expected;
  if (ok) pass++;
  console.log(`| ${i + 1} | ${c.msg} | ${c.expected} | ${obtained} | ${ok ? "✅ Pasa" : "❌ Falla"} |`);
});

console.log(`\nResultado: ${pass}/${CASES.length} casos correctos (${((pass / CASES.length) * 100).toFixed(0)}%)`);
