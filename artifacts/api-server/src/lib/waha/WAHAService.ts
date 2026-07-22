interface SendTextInput {
  phone: string;
  text: string;
}

interface WAHAResponse {
  id?: string;
  [key: string]: unknown;
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export class WAHAService {
  private readonly baseUrl: string;
  private readonly session: string;
  private readonly apiKey?: string;

  constructor() {
    this.baseUrl =
      process.env.WAHA_BASE_URL?.replace(/\/$/, "") ??
      "http://localhost:3000";

    this.session = process.env.WAHA_SESSION ?? "default";
    this.apiKey = process.env.WAHA_API_KEY;
  }

  async sendText(input: SendTextInput): Promise<WAHAResponse> {
    const phone = normalizePhone(input.phone);
    const text = input.text.trim();

    if (!phone) {
      throw new Error("WAHA phone is required.");
    }

    if (!text) {
      throw new Error("WAHA message text is required.");
    }

    const response = await fetch(`${this.baseUrl}/api/sendText`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.apiKey
          ? {
              "X-Api-Key": this.apiKey,
            }
          : {}),
      },
      body: JSON.stringify({
        session: this.session,
        chatId: `${phone}@c.us`,
        text,
      }),
    });

    if (!response.ok) {
      const responseText = await response.text();

      throw new Error(
        `WAHA sendText failed with status ${response.status}: ${responseText}`,
      );
    }

    return (await response.json()) as WAHAResponse;
  }
}