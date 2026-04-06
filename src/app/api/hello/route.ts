import { NextResponse } from "next/server";

export function GET() {
  console.log("debug: hello route called"); 
  console.log("request data:", Date.now()); 
  return NextResponse.json({ message: "Hello from POC!" });
}