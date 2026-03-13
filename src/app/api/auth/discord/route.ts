import { NextResponse } from "next/server";

/**
 * Initiates Discord OAuth2 flow.
 * Called when user clicks "JOIN THE BUILDING" on the result page.
 * Requests guilds.join scope so we can add them to the server.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sortingData = searchParams.get("sorting");

  // Store sorting data in the state parameter so we get it back after OAuth
  const state = sortingData
    ? Buffer.from(sortingData).toString("base64url")
    : "";

  const { origin } = new URL(request.url);
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID!,
    redirect_uri: `${origin}/api/auth/callback/discord`,
    response_type: "code",
    scope: "identify guilds.join",
    state,
  });

  return NextResponse.redirect(
    `https://discord.com/api/oauth2/authorize?${params.toString()}`
  );
}
