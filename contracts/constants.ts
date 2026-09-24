export const Session = {
  cookieName: "whatsbot_sid",
  maxAgeMs: 30 * 24 * 60 * 60 * 1000, // 30 days
} as const;

export const ErrorMessages = {
  unauthenticated: "Authentication required",
  insufficientRole: "Insufficient permissions",
} as const;

export const Paths = {
  login: "/login",
  dashboard: "/dashboard",
  appointments: "/appointments",
  conversations: "/conversations",
} as const;

export const Roles = {
  admin: "admin",
  agent: "agent",
} as const;

export const AppointmentStatuses = {
  pendiente: "pendiente",
  confirmada: "confirmada",
  cancelada: "cancelada",
  completada: "completada",
} as const;
