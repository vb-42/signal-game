import { z } from "zod";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const QuerySchema = z.object({
  text: z.string().min(1).max(200),
});

const VOICE_ID = "JBFqnCBsd6RMkjVDRZzb"; // ElevenLabs "George" voice - clear and neutral

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = QuerySchema.safeParse({ text: searchParams.get("text") ?? "" });

  if (!parsed.success) {
    return new Response("Missing or invalid text parameter", { status: 400 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return new Response("ELEVENLABS_API_KEY not configured", { status: 500 });
  }

  try {
    const client = new ElevenLabsClient({ apiKey });
    const audioStream = await client.textToSpeech.convert(VOICE_ID, {
      text: parsed.data.text,
      modelId: "eleven_turbo_v2_5",
      voiceSettings: {
        stability: 0.5,
        similarityBoost: 0.8,
        style: 0.2,
        useSpeakerBoost: true,
      },
    });

    const chunks: Buffer[] = [];
    const reader = (audioStream as unknown as ReadableStream<Uint8Array>).getReader();
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(Buffer.from(value));
    }
    const buffer = Buffer.concat(chunks);

    return new Response(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("TTS error:", err);
    return new Response("Failed to generate speech", { status: 500 });
  }
}
