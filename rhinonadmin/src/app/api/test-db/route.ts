import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";

export async function GET() {
  try {
    await connectDB();
    return NextResponse.json({ status: "connected" });
  } catch (error) {
    return NextResponse.json({
      status: "error",
      error: (error as Error).message,
    });
  }
}
