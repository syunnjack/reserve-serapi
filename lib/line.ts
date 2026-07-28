export async function sendLineMessage(channelAccessToken: string, lineUserId: string, text: string) {
  try {
    await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${channelAccessToken}`,
      },
      body: JSON.stringify({
        to: lineUserId,
        messages: [{ type: "text", text }],
      }),
    });
  } catch {
    // LINE通知の失敗で予約自体を止めない
  }
}

export function lineLoginAuthorizeUrl(state: string, redirectUri: string): string {
  const channelId = process.env.LINE_LOGIN_CHANNEL_ID;
  const params = new URLSearchParams({
    response_type: "code",
    client_id: channelId ?? "",
    redirect_uri: redirectUri,
    state,
    scope: "profile openid",
  });
  return `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;
}

export async function exchangeLineLoginCode(code: string, redirectUri: string): Promise<{ lineUserId: string } | null> {
  const channelId = process.env.LINE_LOGIN_CHANNEL_ID;
  const channelSecret = process.env.LINE_LOGIN_CHANNEL_SECRET;
  if (!channelId || !channelSecret) return null;

  const response = await fetch("https://api.line.me/oauth2/v2.1/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: channelId,
      client_secret: channelSecret,
    }),
  });
  if (!response.ok) return null;
  const data = await response.json();

  const profileResponse = await fetch("https://api.line.me/v2/profile", {
    headers: { Authorization: `Bearer ${data.access_token}` },
  });
  if (!profileResponse.ok) return null;
  const profile = await profileResponse.json();
  return { lineUserId: profile.userId };
}
