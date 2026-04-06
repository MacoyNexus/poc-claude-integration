import { NextResponse } from "next/server";

export function GET() {
  console.log("debug: hello route called"); // forgotten debug log
  console.log("request data:", Date.now()); // another forgotten log
  return NextResponse.json({ message: "Hello from POC!" });
}