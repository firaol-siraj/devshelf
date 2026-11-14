import { NextResponse } from "next/server";
export function GET() {
  return NextResponse.json(
    {
      success: true,
      message: "DevShelf API is healthy",
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
    },
  );
}
