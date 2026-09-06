import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { logger } from "@/server/logging/logger";

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400,
  ) {
    super(message);
  }
}

export function apiError(error: unknown) {
  if (error instanceof SyntaxError) {
    return NextResponse.json({ error: "Malformed request body", code: "INVALID_BODY" }, { status: 400 });
  }
  if (error instanceof AppError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Invalid input", code: "VALIDATION_ERROR", fields: error.flatten().fieldErrors },
      { status: 422 },
    );
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return NextResponse.json({ error: "This value is already in use", code: "CONFLICT" }, { status: 409 });
  }
  logger.error({ err: error }, "Unhandled request error");
  return NextResponse.json({ error: "Something went wrong", code: "INTERNAL_ERROR" }, { status: 500 });
}
