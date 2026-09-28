/**
 * Structured server logging (§49).
 *
 * One line of JSON per event so AI calls, routing decisions, payments, lawyer
 * assignments, signature events and failures can be filtered in any log
 * collector. Document contents and personal data are never logged.
 */

type Level = "debug" | "info" | "warn" | "error";

export interface LogFields {
  [key: string]: unknown;
}

const REDACTED_KEYS = [
  "content",
  "body",
  "bodyAr",
  "bodyFr",
  "documentContent",
  "password",
  "passwordHash",
  "token",
  "tokenHash",
  "nationalId",
  "authorization",
  "apiKey",
  "secret",
];

function redact(fields: LogFields): LogFields {
  const out: LogFields = {};
  for (const [key, value] of Object.entries(fields)) {
    if (REDACTED_KEYS.includes(key)) {
      out[key] = "[redacted]";
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      out[key] = redact(value as LogFields);
    } else if (typeof value === "string" && value.length > 400) {
      out[key] = `${value.slice(0, 400)}…[truncated ${value.length}]`;
    } else {
      out[key] = value;
    }
  }
  return out;
}

function emit(level: Level, event: string, fields: LogFields = {}) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    event,
    ...redact(fields),
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (event: string, fields?: LogFields) => emit("debug", event, fields),
  info: (event: string, fields?: LogFields) => emit("info", event, fields),
  warn: (event: string, fields?: LogFields) => emit("warn", event, fields),
  error: (event: string, fields?: LogFields) => emit("error", event, fields),
};

/** Well-known event names so log queries stay stable across the codebase. */
export const LOG_EVENTS = {
  aiCall: "ai.call",
  aiFallback: "ai.fallback",
  aiInvalidOutput: "ai.invalid_output",
  intentClassified: "intent.classified",
  routingDecided: "routing.decided",
  routingUndetermined: "routing.undetermined",
  paymentEvent: "payment.event",
  paymentFailed: "payment.failed",
  assignmentAttempted: "lawyer.assignment.attempted",
  assignmentSucceeded: "lawyer.assignment.succeeded",
  assignmentFailed: "lawyer.assignment.failed",
  signatureEvent: "signature.event",
  signatureFailed: "signature.failed",
  documentGenerated: "document.generated",
  documentFailed: "document.failed",
  emailLogged: "email.logged",
  emailFailed: "email.failed",
  stateTransitionRejected: "contract.transition_rejected",
} as const;
