import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.THESPORTSDB_API_KEY;

  const res = await fetch(
    `https://www.thesportsdb.com/api/v1/json/${apiKey}/search_all_teams.php?l=English Premier League`
  );

  const data = await res.json();

  return NextResponse.json(data);
}
