import { NextResponse } from "next/server";

export async function GET() {
  const API_KEY = process.env.THESPORTSDB_API_KEY;

  const url = `https://www.thesportsdb.com/api/v1/json/${API_KEY}/searchteams.php?t=Arsenal`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al llamar a TheSportsDB" },
      { status: 500 }
    );
  }
}
