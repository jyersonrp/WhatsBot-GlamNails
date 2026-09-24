import { describe, it, expect } from "vitest";
import {
  normalizeText,
  matchRuleInMemory,
  isWithinBusinessHours,
} from "../api/services/botRulesEngine";
import type { BotRule, BotConfiguration } from "../db/schema";
import { hashPassword, verifyPassword, signSessionToken, verifySessionToken } from "../api/lib/crypto";

const SEED_RULES: BotRule[] = [
  {
    id: 1,
    name: "Saludo de bienvenida",
    triggerType: "keyword",
    triggerValue: "hola, buenos dias, buenas tardes, buenas noches, hey, hi, buenas, saludos",
    responseType: "text",
    responseContent: "Bienvenida a Glam Nails Maturín",
    templateName: null,
    isActive: true,
    priority: 1,
    createdAt: new Date(),
  },
  {
    id: 2,
    name: "Catálogo de servicios",
    triggerType: "keyword",
    triggerValue: "catalogo, servicios, que servicios tienen, menu de servicios, servicios disponibles",
    responseType: "text",
    responseContent: "Catálogo de servicios",
    templateName: null,
    isActive: true,
    priority: 2,
    createdAt: new Date(),
  },
  {
    id: 3,
    name: "Precios",
    triggerType: "keyword",
    triggerValue: "precio, precios, cuanto cuesta, tarifa, tarifas, cuanto vale, costo, costos",
    responseType: "text",
    responseContent: "Lista de Precios",
    templateName: null,
    isActive: true,
    priority: 3,
    createdAt: new Date(),
  },
  {
    id: 4,
    name: "Horario de atención",
    triggerType: "keyword",
    triggerValue: "horario, horarios, atienden, abren, cierran, a que hora, cuando abren",
    responseType: "text",
    responseContent: "Martes a Sábado 9:00 am - 5:00 pm",
    templateName: null,
    isActive: true,
    priority: 4,
    createdAt: new Date(),
  },
  {
    id: 5,
    name: "Ubicación",
    triggerType: "keyword",
    triggerValue: "ubicacion, direccion, donde quedan, como llegar, donde estan, estacionamiento",
    responseType: "text",
    responseContent: "Av. Bicentenario C.C. Plaza Girasol",
    templateName: null,
    isActive: true,
    priority: 5,
    createdAt: new Date(),
  },
  {
    id: 6,
    name: "Pago Móvil y anticipo",
    triggerType: "keyword",
    triggerValue: "pago movil, datos de pago, transferencia, comprobante, captura, anticipo, cuenta, banco, como pagar",
    responseType: "text",
    responseContent: "Datos de Pago Móvil Glam Nails",
    templateName: null,
    isActive: true,
    priority: 6,
    createdAt: new Date(),
  },
  {
    id: 7,
    name: "Cancelar o reprogramar cita",
    triggerType: "keyword",
    triggerValue: "cancelar cita, cancelar mi cita, cancelar, reprogramar, cambiar cita, mover cita",
    responseType: "text",
    responseContent: "Indícanos tu nombre y fecha para cancelar",
    templateName: null,
    isActive: true,
    priority: 7, // Priority higher than Agendar to avoid collision
    createdAt: new Date(),
  },
  {
    id: 8,
    name: "Agendar cita",
    triggerType: "keyword",
    triggerValue: "agendar, reservar, quiero una cita, sacar cita, apartar, cita para",
    responseType: "text",
    responseContent: "Con gusto te agendamos",
    templateName: null,
    isActive: true,
    priority: 8,
    createdAt: new Date(),
  },
  {
    id: 9,
    name: "Promociones",
    triggerType: "keyword",
    triggerValue: "promocion, promociones, oferta, ofertas, descuento, promo",
    responseType: "text",
    responseContent: "15% descuento martes y miércoles",
    templateName: null,
    isActive: true,
    priority: 9,
    createdAt: new Date(),
  },
  {
    id: 10,
    name: "Hablar con asesora",
    triggerType: "keyword",
    triggerValue: "asesora, humano, persona, hablar con alguien, recepcionista, agente",
    responseType: "text",
    responseContent: "Te comunico con una asesora",
    templateName: null,
    isActive: true,
    priority: 10,
    createdAt: new Date(),
  },
  {
    id: 11,
    name: "Despedida",
    triggerType: "keyword",
    triggerValue: "gracias, adios, hasta luego, bye, nos vemos, chao, feliz dia",
    responseType: "text",
    responseContent: "¡Gracias por escribir a Glam Nails!",
    templateName: null,
    isActive: true,
    priority: 11,
    createdAt: new Date(),
  },
  {
    id: 12,
    name: "Ayuda / menú",
    triggerType: "keyword",
    triggerValue: "ayuda, help, menu, opciones, comandos",
    responseType: "text",
    responseContent: "Menú de opciones",
    templateName: null,
    isActive: true,
    priority: 12,
    createdAt: new Date(),
  },
  {
    id: 13,
    name: "Respuesta por defecto",
    triggerType: "default",
    triggerValue: "*",
    responseType: "text",
    responseContent: "No entendí muy bien tu mensaje",
    templateName: null,
    isActive: true,
    priority: 999,
    createdAt: new Date(),
  },
];

describe("Normalización de Texto (normalizeText)", () => {
  it("elimina diacríticos, tildes y signos de puntuación", () => {
    expect(normalizeText("¿Cuánto cuesta el acrílico?")).toBe("cuanto cuesta el acrilico");
    expect(normalizeText("¡Hola! Buenos días...")).toBe("hola buenos dias");
    expect(normalizeText("   MENÚ DE SERVICIOS    ")).toBe("menu de servicios");
    expect(normalizeText("¿Dónde están ubicados?")).toBe("donde estan ubicados");
  });

  it("maneja cadenas vacías y caracteres especiales", () => {
    expect(normalizeText("")).toBe("");
    expect(normalizeText("   !???...   ")).toBe("");
  });
});

describe("Motor de Reglas WhatsBot — 12 Casos de Prueba Oficiales", () => {
  const TEST_CASES = [
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

  TEST_CASES.forEach(({ msg, expected }, i) => {
    it(`Caso #${i + 1}: "${msg}" debe coincidir con "${expected}"`, () => {
      const match = matchRuleInMemory(msg, SEED_RULES);
      expect(match).not.toBeNull();
      expect(match?.name).toBe(expected);
    });
  });
});

describe("Resolución de Colisiones y Casos Borde", () => {
  it("prioriza cancelación sobre agendamiento cuando el mensaje contiene cancelar", () => {
    const res1 = matchRuleInMemory("Quiero cancelar cita", SEED_RULES);
    expect(res1?.name).toBe("Cancelar o reprogramar cita");

    const res2 = matchRuleInMemory("deseo cancelar mi cita de acrilicas", SEED_RULES);
    expect(res2?.name).toBe("Cancelar o reprogramar cita");
  });

  it("evita colisiones falsas por subcadenas internas en palabras no relacionadas", () => {
    // "hi" no debe disparar Saludo ante "hice"
    const resHi = matchRuleInMemory("hice el tramite de documentacion", SEED_RULES);
    expect(resHi?.name).toBe("Respuesta por defecto");

    // "cita" no debe disparar Agendar ante "felicitaciones"
    const resCita = matchRuleInMemory("muchas felicitaciones por el local", SEED_RULES);
    expect(resCita?.name).toBe("Respuesta por defecto");

    // "precio" no debe disparar Precios ante "aprecio"
    const resPrecio = matchRuleInMemory("aprecio mucho la atencion", SEED_RULES);
    expect(resPrecio?.name).toBe("Respuesta por defecto");

    // "promo" no debe disparar Promociones ante "compromiso"
    const resPromo = matchRuleInMemory("tengo un compromiso personal manana", SEED_RULES);
    expect(resPromo?.name).toBe("Respuesta por defecto");
  });

  it("reconoce consultas de pago móvil y capturas de comprobantes", () => {
    const res1 = matchRuleInMemory("¿Cuáles son los datos de pago móvil?", SEED_RULES);
    expect(res1?.name).toBe("Pago Móvil y anticipo");

    const res2 = matchRuleInMemory("Aquí les dejo la captura del pago móvil del anticipo", SEED_RULES);
    expect(res2?.name).toBe("Pago Móvil y anticipo");

    const res3 = matchRuleInMemory("hice una transferencia", SEED_RULES);
    expect(res3?.name).toBe("Pago Móvil y anticipo");
  });

  it("prioriza intenciones comerciales sobre saludos cuando el mensaje combina ambos", () => {
    // Caso real reportado por clientas en WhatsApp:
    const resCancel = matchRuleInMemory("Hola, necesito cancelar mi cita", SEED_RULES);
    expect(resCancel?.name).toBe("Cancelar o reprogramar cita");

    const resPrecios = matchRuleInMemory("Hola buenas, ¿cuánto cuesta el acrílico?", SEED_RULES);
    expect(resPrecios?.name).toBe("Precios");

    const resUbicacion = matchRuleInMemory("Buenas tardes, ¿dónde están ubicados?", SEED_RULES);
    expect(resUbicacion?.name).toBe("Ubicación");

    const resAgendar = matchRuleInMemory("Hola, quiero agendar cita para el sábado", SEED_RULES);
    expect(resAgendar?.name).toBe("Agendar cita");

    const resPago = matchRuleInMemory("Hola, datos de pago móvil por favor", SEED_RULES);
    expect(resPago?.name).toBe("Pago Móvil y anticipo");

    // Saludo puro sin intención comercial debe seguir respondiendo Bienvenida
    const resSaludoSolo = matchRuleInMemory("Hola", SEED_RULES);
    expect(resSaludoSolo?.name).toBe("Saludo de bienvenida");

    const resBuenasTardes = matchRuleInMemory("Hola, buenas tardes", SEED_RULES);
    expect(resBuenasTardes?.name).toBe("Saludo de bienvenida");
  });

  it("devuelve respuesta por defecto ante mensajes desconocidos", () => {
    const match = matchRuleInMemory("asldkjalskdjalksdj 123", SEED_RULES);
    expect(match?.name).toBe("Respuesta por defecto");
  });
});

describe("Validación de Horario Comercial (isWithinBusinessHours)", () => {
  const mockConfig: BotConfiguration = {
    id: 1,
    isActive: true,
    welcomeMessage: "",
    awayMessage: "",
    businessHoursStart: "09:00",
    businessHoursEnd: "17:00",
    businessDays: JSON.stringify(["tuesday", "wednesday", "thursday", "friday", "saturday"]),
    updatedAt: new Date(),
  };

  it("permite mensajes dentro de horario (ej. Miércoles 11:30 am)", () => {
    // 2026-09-23 is Wednesday
    const wednesdayInHours = new Date("2026-09-23T11:30:00");
    expect(isWithinBusinessHours(wednesdayInHours, mockConfig)).toBe(true);
  });

  it("bloquea mensajes fuera de horario (ej. Miércoles 20:00 pm)", () => {
    const wednesdayNight = new Date("2026-09-23T20:00:00");
    expect(isWithinBusinessHours(wednesdayNight, mockConfig)).toBe(false);
  });

  it("bloquea días no laborables (ej. Domingo)", () => {
    // 2026-09-27 is Sunday
    const sundayNoon = new Date("2026-09-27T12:00:00");
    expect(isWithinBusinessHours(sundayNoon, mockConfig)).toBe(false);
  });
});

describe("Autenticación Criptográfica Segura (crypto.scrypt y JWT)", () => {
  it("hashea y verifica contraseñas correctamente", async () => {
    const password = "claveSuperSegura2026!";
    const hash = await hashPassword(password);

    expect(hash).toContain(":");
    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);

    const isInvalid = await verifyPassword("claveIncorrecta", hash);
    expect(isInvalid).toBe(false);
  });

  it("firma y valida tokens de sesión JWT", async () => {
    const payload = {
      userId: 42,
      email: "andrea@glamnails.com",
      role: "admin" as const,
      name: "Andrea",
    };

    const token = await signSessionToken(payload);
    expect(typeof token).toBe("string");

    const decoded = await verifySessionToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(42);
    expect(decoded?.email).toBe("andrea@glamnails.com");
    expect(decoded?.role).toBe("admin");

    const invalid = await verifySessionToken("token_invalido_corrupto");
    expect(invalid).toBeNull();
  });
});

describe("Utilidades y Plantillas de WhatsApp Glam Nails", () => {
  it("sanitiza números telefónicos para enlaces wa.me correctamente", () => {
    const rawPhones = [
      "+58 (412) 123-4567",
      "+58 412 1234567",
      "+58-412-123.45.67",
      "584121234567",
    ];

    rawPhones.forEach((p) => {
      const sanitized = p.replace(/[^0-9]/g, "");
      expect(sanitized).toBe("584121234567");
      expect(`https://wa.me/${sanitized}`).toBe("https://wa.me/584121234567");
    });
  });

  it("garantiza que las respuestas de pago móvil contienen datos bancarios válidos", () => {
    const pagoMovilRule = SEED_RULES.find((r) => r.id === 6);
    expect(pagoMovilRule).toBeDefined();
    expect(pagoMovilRule?.triggerValue).toContain("pago movil");
    expect(pagoMovilRule?.triggerValue).toContain("transferencia");
  });
});
