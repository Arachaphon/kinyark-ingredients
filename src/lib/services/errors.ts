/**
 * Shared service-layer errors.
 * Each error carries a machine-readable `code` so API routes and tests
 * can map them to HTTP statuses (404 / 403 / 409 / 400) without
 * string-matching Thai/English messages.
 */

export class NotFoundError extends Error {
  readonly code = "NOT_FOUND" as const;
  constructor(message = "Not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ForbiddenError extends Error {
  readonly code = "FORBIDDEN" as const;
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class DuplicateError extends Error {
  readonly code = "DUPLICATE" as const;
  constructor(message = "Duplicate") {
    super(message);
    this.name = "DuplicateError";
  }
}

export class ServiceValidationError extends Error {
  readonly code = "VALIDATION" as const;
  constructor(message = "Invalid input") {
    super(message);
    this.name = "ServiceValidationError";
  }
}

/** Prisma unique-constraint violation (e.g. duplicate favorite / username). */
export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

/** Prisma "record not found" (delete/update on a missing row). */
export function isRecordNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2025"
  );
}
