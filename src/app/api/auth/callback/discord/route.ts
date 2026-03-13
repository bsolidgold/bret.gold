import { NextResponse } from "next/server";

const DISCORD_API = "https://discord.com/api/v10";

type SortingPayload = {
  archetype: string;
  primaryFloorRoles: string[];
  gatewayFloorRoles: string[];
};

/**
 * Discord OAuth2 callback.
 * Exchanges code for token, adds user to server, assigns roles.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code) {
    return NextResponse.redirect(new URL("/result?error=no_code", request.url));
  }

  try {
    // 1. Exchange code for access token
    const tokenRes = await fetch(`${DISCORD_API}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: "authorization_code",
        code,
        redirect_uri: `${new URL(request.url).origin}/api/auth/callback/discord`,
      }),
    });

    if (!tokenRes.ok) {
      console.error("Token exchange failed:", await tokenRes.text());
      return NextResponse.redirect(
        new URL("/result?error=token_failed", request.url)
      );
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Get user info
    const userRes = await fetch(`${DISCORD_API}/users/@me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const user = await userRes.json();

    // 3. Decode sorting data from state
    let sorting: SortingPayload | null = null;
    if (state) {
      try {
        const decoded = Buffer.from(state, "base64url").toString();
        sorting = JSON.parse(decoded);
      } catch {
        console.error("Failed to decode sorting state");
      }
    }

    // 4. Add user to the guild using bot token + OAuth access token
    const guildId = process.env.DISCORD_GUILD_ID!;
    const botToken = process.env.DISCORD_BOT_TOKEN!;

    // Determine which roles to assign immediately (open floors + new-arrival + archetype)
    const rolesToAssign: string[] = [];

    // We need to fetch guild roles to map names to IDs
    const guildRolesRes = await fetch(`${DISCORD_API}/guilds/${guildId}/roles`, {
      headers: { Authorization: `Bot ${botToken}` },
    });
    const guildRoles = await guildRolesRes.json();
    const roleMap = new Map<string, string>();
    for (const role of guildRoles) {
      roleMap.set(role.name, role.id);
    }

    // Always assign new-arrival
    const newArrivalId = roleMap.get("new-arrival");
    if (newArrivalId) rolesToAssign.push(newArrivalId);

    // Always assign floor-8-new-wing (all arrivals)
    const newWingId = roleMap.get("floor-8-new-wing");
    if (newWingId) rolesToAssign.push(newWingId);

    // Assign archetype role
    if (sorting?.archetype) {
      const archetypeId = roleMap.get(sorting.archetype);
      if (archetypeId) rolesToAssign.push(archetypeId);
    }

    // Assign open floor roles from sorting result
    if (sorting?.primaryFloorRoles) {
      for (const roleName of sorting.primaryFloorRoles) {
        const roleId = roleMap.get(roleName);
        if (roleId) rolesToAssign.push(roleId);
      }
    }

    // Add user to guild with roles
    const addRes = await fetch(
      `${DISCORD_API}/guilds/${guildId}/members/${user.id}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bot ${botToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          access_token: accessToken,
          roles: rolesToAssign,
        }),
      }
    );

    if (!addRes.ok && addRes.status !== 204) {
      // 204 = already in guild, try adding roles directly
      if (addRes.status === 204 || addRes.status === 201) {
        // Success
      } else {
        // User might already be in the guild — try assigning roles directly
        for (const roleId of rolesToAssign) {
          await fetch(
            `${DISCORD_API}/guilds/${guildId}/members/${user.id}/roles/${roleId}`,
            {
              method: "PUT",
              headers: { Authorization: `Bot ${botToken}` },
            }
          );
        }
      }
    }

    // 5. Handle gated floor requests (send to approval system)
    if (sorting?.gatewayFloorRoles && sorting.gatewayFloorRoles.length > 0) {
      // Post to our internal API that the bot listens to
      await fetch(
        `${new URL(request.url).origin}/api/approve-request`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            username: user.username,
            archetype: sorting.archetype,
            floorRoles: sorting.gatewayFloorRoles,
            secret: process.env.DISCORD_BOT_TOKEN, // simple auth
          }),
        }
      ).catch(() => {
        // Non-critical — bot will handle this separately if available
        console.log("Approval request API not available, bot will handle via DM");
      });
    }

    // 6. Redirect to welcome page
    return NextResponse.redirect(
      new URL(
        `/welcome?user=${encodeURIComponent(user.username)}&archetype=${encodeURIComponent(sorting?.archetype || "")}`,
        request.url
      )
    );
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(
      new URL("/result?error=unknown", request.url)
    );
  }
}
