import { getApiKey } from "@/lib/keys";

export async function sendTelegramAlert(message: string): Promise<boolean> {
  const botToken = await getApiKey("telegram_bot_token");
  const chatId = await getApiKey("telegram_chat_id");

  if (!botToken || !chatId) {
    console.warn("Telegram not configured — skipping alert");
    return false;
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
        }),
      }
    );

    if (!res.ok) {
      console.error("Telegram API error:", await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("Telegram send failed:", err);
    return false;
  }
}
