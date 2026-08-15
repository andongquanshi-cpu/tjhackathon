import { NextResponse } from "next/server";
import { getProfile } from "@/lib/store";

export async function GET() {
  return NextResponse.json({ profile: getProfile() });
}