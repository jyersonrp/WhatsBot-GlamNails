// Prueba funcional real del motor de reglas del WhatsBot (Glam Nails Maturín)
// - La función matchRule() de abajo es una copia EXACTA, línea por línea,
//   del switch-case de findMatchingRule() en api/queries/botRules.ts
//   (se omite únicamente la consulta a la base de datos, que en producción
//   entrega este mismo arreglo `rules` ya ordenado por prioridad).
// - El arreglo SEED_RULES es una copia EXACTA de las 12 reglas insertadas
//   por db/seed-salon-unas.ts (mismos triggerType, triggerValue y priority).
// Ejecutar con: node botRules.realtest.mjs

function matchRule(message, rules) {
  const lowerMessage = message.toLowerCase().trim();

  for (const rule of rules) {
    const triggerValue = rule.triggerValue.toLowerCase();

    switch (rule.triggerType) {
      case "exact":
        if (lowerMessage === triggerValue) return rule;
        break;
      case "keyword": {
        const keywords = triggerValue.split(",").map((k) => k.trim());
        if (keywords.some((kw) => lowerMessage.includes(kw))) return rule;
        break;
      }
      case "contains":
        if (lowerMessage.includes(triggerValue)) return rule;
        break;
      case "regex":
        try {
          const regex = new RegExp(triggerValue, "i");
          if (regex.test(message)) return rule;
        } catch {
          continue;
        }
        break;
      case "default":
        break;
    }
  }

  const defaultRule = rules.find((r) => r.triggerType === "default");
  if (defaultRule) return defaultRule;
  return null;
}

const SEED_RULES = [
  { name: "Saludo de bienvenida", triggerType: "keyword", triggerValue: "hola, buenos días, buenas tardes, buenas noches, hey, hi, buenas", priority: 1 },
  { name: "Catálogo de servicios", triggerType: "keyword", triggerValue: "catálogo, catalogo, servicios, que servicios tienen, menu de servicios", priority: 2 },
  { name: "Precios", triggerType: "keyword", triggerValue: "precio, precios, cuanto cuesta, cuánto cuesta, tarifa, tarifas, cuanto vale", priority: 3 },
  { name: "Horario de atención", triggerType: "keyword", triggerValue: "horario, horarios, atienden, abren, cierran, a que hora", priority: 4 },
  { name: "Ubicación", triggerType: "keyword", triggerValue: "ubicación, ubicacion, dirección, direccion, donde quedan, como llegar, dónde están", priority: 5 },
  { name: "Agendar cita", triggerType: "keyword", triggerValue: "cita, agendar, reservar, quiero una cita, sacar cita, apartar", priority: 6 },
  { name: "Cancelar o reprogramar cita", triggerType: "keyword", triggerValue: "cancelar, reprogramar, cambiar cita, mover cita, cancelar cita", priority: 7 },
  { name: "Promociones", triggerType: "keyword", triggerValue: "promocion, promoción, promociones, oferta, ofertas, descuento", priority: 8 },
  { name: "Hablar con asesora", triggerType: "keyword", triggerValue: "asesora, humano, persona, hablar con alguien, agente", priority: 9 },
  { name: "Despedida", triggerType: "keyword", triggerValue: "gracias, adiós, adios, hasta luego, bye, nos vemos, chao", priority: 10 },
  { name: "Ayuda / menú", triggerType: "keyword", triggerValue: "ayuda, help, menu, menú, opciones", priority: 11 },
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
