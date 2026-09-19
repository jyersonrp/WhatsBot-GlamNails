# WhatsBot — Sistema Automatizado de Atención al Cliente vía WhatsApp
## Salón de Belleza y Uñas: **Glam Nails Maturín**

<p align="center">
  <img src="https://img.shields.io/badge/License-CC%20BY--NC--ND%204.0-lightgrey.svg?style=flat-square&logo=creative-commons" alt="CC BY-NC-ND 4.0" />
  <img src="https://img.shields.io/badge/TypeScript-5.7%2B-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Hono-4.6%2B-E36002?style=flat-square&logo=hono&logoColor=white" alt="Hono" />
  <img src="https://img.shields.io/badge/Drizzle_ORM-0.38-C5F74F?style=flat-square&logo=drizzle&logoColor=black" alt="Drizzle ORM" />
</p>

**Universidad de Oriente — Núcleo de Monagas**  
**Escuela de Ingeniería y Ciencias Aplicadas — Departamento de Ingeniería de Sistemas**  
**Cátedra:** Dirección de Operaciones (071-5963)  
**Profesor:** Ing. Heickel Loreto  
**Bachilleres:**
- Yerrison Peinado (CI: 30.265.660)
- Luis Guatarasma (CI: 31.615.255)
- Yerson Rodríguez (CI: 30.624.650)
- Diana Flores (CI: 30.223.425)
- José Rodríguez (CI: 27.719.820)
*Maturín, Agosto 2026*

---

## 📌 Descripción del Proyecto

**WhatsBot** es una solución integral de CRM y Bot de WhatsApp orientada a automatizar la atención al cliente de **Glam Nails Maturín**, salón especializado en el cuidado de uñas ubicado en el Centro Comercial Las Cascadas (Maturín, Estado Monagas).

El bot resuelve de forma 100% inmediata y automatizada las consultas informativas de alta demanda:
- **Catálogo de Servicios**: Manicura clásica/rusa, acrílico, polygel, semipermanente, pedicura spa, nail art.
- **Precios y Tarifas**: Lista actualizada de precios ($5 a $22).
- **Horario de Atención**: Martes a Sábado de 9:00 am a 5:00 pm.
- **Ubicación**: C.C. Las Cascadas, Nivel 1, Local 14 (frente a la feria de comida).
- **Promociones del Mes**: Combos especiales y descuentos de cumpleaños.

### 🚨 Criterio de Escalado a Asesora Humana
El bot deriva la atención a una recepcionista/asesora humana únicamente cuando la solicitud exige consultar la agenda en tiempo real para:
1. **Agendar una nueva cita**.
2. **Cancelar o reprogramar una cita existente**.
3. **Solicitud explícita de hablar con una persona**.

---

## 🏗️ Arquitectura y Stack Tecnológico

- **Frontend CRM**: React 18 + Vite + Tailwind CSS + Lucide Icons (Dark Mode elegante con identidad visual Glam Nails).
- **Backend API**: Hono framework con Node.js / TypeScript.
- **Base de Datos & ORM**: Drizzle ORM + SQLite / MySQL schema compatible (`users`, `whatsapp_config`, `bot_configuration`, `bot_rules`, `message_templates`, `contacts`, `conversations`, `messages`, `webhook_logs`).
- **Motor de Reglas**: 12 reglas ordenadas por prioridad con activadores por `keyword`, `contains`, `exact` y `regex`.
- **Integración Externa**: WhatsApp Business Cloud API (Meta) con verificación de webhook y endpoints de mensajería.
- **Simulador Interactivo**: Entorno de pruebas WhatsApp Web integrado en el CRM con telemetría en tiempo real.

---

## 📋 Las 12 Reglas del Bot (Bot Builder)

| # | Regla | Tipo | Disparadores | Respuesta / Acción |
|---|---|---|---|---|
| **1** | Saludo de bienvenida | `keyword` | `hola`, `buenas`, `buenos dias`, `buenas tardes` | Menú inicial y bienvenida al salón. |
| **2** | Catálogo de servicios | `contains` | `catalogo`, `servicios`, `que ofrecen` | Lista de servicios detallada. |
| **3** | Precios y tarifas | `contains` | `precio`, `costo`, `cuanto cuesta`, `acrilico`, `gel` | Lista de precios en USD ($5 - $22). |
| **4** | Horario de atención | `keyword` | `horario`, `abren`, `cierran`, `a que hora` | Mar a Sáb 9:00 am a 5:00 pm. |
| **5** | Ubicación | `keyword` | `ubicacion`, `donde estan`, `direccion`, `local` | C.C. Las Cascadas Nivel 1 Local 14. |
| **6** | Agendar cita | `keyword` | `cita`, `agendar`, `reservar`, `turno` | 🚨 **Escala a Asesora** (Solicita datos). |
| **7** | Cancelar o reprogramar | `contains` | `cancelar`, `reprogramar`, `cambiar cita` | 🚨 **Escala a Asesora** (Modificación). |
| **8** | Promociones | `keyword` | `promocion`, `oferta`, `descuento`, `combo` | Combo Glam Star 15% desc., 2x1 semi. |
| **9** | Hablar con asesora | `keyword` | `asesora`, `persona`, `humano`, `operador` | 🚨 **Escala a Asesora** (Atención directa). |
| **10** | Despedida | `keyword` | `gracias`, `muchas gracias`, `adios`, `chao` | Agradecimiento y despedida cordial. |
| **11** | Ayuda | `keyword` | `ayuda`, `menu`, `opciones`, `comandos` | Lista de palabras clave disponibles. |
| **12** | Respuesta por defecto | `exact` | `*` (fallback) | Orientación guiada de opciones. |

---

## 🚀 Instalación y Puesta en Marcha

### 1. Clonar e Instalar Dependencias
```bash
npm install
```

### 2. Sembrar los Datos Reales de Glam Nails Maturín
```bash
npm run db:seed:salon
# O alternativamente:
npx tsx server/db/seed-salon-unas.ts
```

### 3. Ejecutar las Pruebas del Motor de Reglas (Tabla 10)
```bash
npm run test:rules
```

### 4. Iniciar el Servidor Backend y la Interfaz CRM
```bash
# Iniciar servidor backend Hono (puerto 4000)
npm run dev

# En otra terminal, iniciar el cliente Vite (puerto 3000)
npm run dev:client
```

Acceder a:
- **CRM & Dashboard**: [http://localhost:3000](http://localhost:3000)
- **API Backend**: [http://localhost:4000/api/health](http://localhost:4000/api/health)
- **Webhook de WhatsApp**: `http://localhost:4000/api/webhook`

---

## 🧪 Validación y Suite de Pruebas

El script `npm run test:rules` valida los 12 mensajes de prueba estandarizados del informe:
1. `Hola, buenas tardes` → Saludo de bienvenida ✅
2. `¿Qué servicios tienen?` → Catálogo de servicios ✅
3. `¿Cuánto cuesta el acrílico?` → Precios ✅
4. `¿A qué hora abren?` → Horario de atención ✅
5. `¿Dónde están ubicados?` → Ubicación ✅
6. `Quiero reservar una cita para el sábado` → Agendar cita ✅
7. `Necesito cancelar cita` → Cancelar o reprogramar cita ✅
8. `¿Tienen alguna promoción?` → Promociones ✅
9. `Quiero hablar con una persona` → Hablar con asesora ✅
10. `Muchas gracias, hasta luego` → Despedida ✅
11. `Cuánto vale el gel` → Precios ✅
12. `Quiero cancelar mi cita` → Cancelar o reprogramar cita ✅

---

## 📄 Licencia y Reconocimientos

Proyecto desarrollado con fines académicos y de optimización operativa para la cátedra de **Dirección de Operaciones** de la **Universidad de Oriente (UDO)**, Núcleo de Monagas.

Este proyecto está bajo la Licencia **Creative Commons Atribución-NoComercial-SinDerivadas 4.0 Internacional (CC BY-NC-ND 4.0)**.

- **Uso No Comercial (NC)**: No se permite la comercialización, reventa, empaquetado como producto SaaS ni monetización de este software o de la lógica operativa de Glam Nails Maturín sin autorización expresa.
- **Sin Derivadas (ND)**: No se autoriza la distribución de versiones modificadas, bifurcaciones (forks) comerciales ni obras derivadas.
- **Reconocimiento Académico (BY)**: Todo uso o referencia debe otorgar el debido crédito a los autores y a la **Universidad de Oriente (UDO)**.

Para más detalles, consulte el archivo [LICENSE](LICENSE).
