import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "./errors";

export function success<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { success: false, message: error.message, details: error.details },
      { status: error.statusCode }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      { success: false, message: "Invalid input", details: error.flatten() },
      { status: 400 }
    );
  }

  console.error(error);
  return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
}
