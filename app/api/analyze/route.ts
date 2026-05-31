import { NextResponse } from "next/server";
import { z } from "zod";
import WebSocket from "ws";

const ProbabilitySchema = z.enum(["high", "medium", "low"]);

const DetectedSignalSchema = z.object({
  type: z.string(),
  probability: ProbabilitySchema.optional(),
  start: z.number().optional(),
  end: z.number().optional(),
  source: z.enum(["signal", "engagement"]).optional(),
});

export const AnalyzeResultSchema = z.object({
  signals: z.array(DetectedSignalSchema),
  correlation_id: z.string().optional(),
  event_count: z.number(),
});

export type AnalyzeResult = z.infer<typeof AnalyzeResultSchema>;

const INTERHUMAN_WS_URL = "wss://api.interhuman.ai/v1/stream/analyze";
const MIN_CHUNK_BYTES = 10 * 1024;
const MAX_CHUNK_BYTES = 32 * 1024 * 1024;
const ANALYSIS_TIMEOUT_MS = 30000;
const IDLE_CLOSE_MS = 8000;

const V1EnvelopeSchema = z.object({
  type: z.string(),
  timestamp: z.string().optional(),
  correlation_id: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

function mapEngagementState(state: string): string | null {
  if (state === "engaged") return "engagement";
  if (state === "disengaged") return "disengagement";
  return null;
}

function upsertSignal(
  signals: z.infer<typeof DetectedSignalSchema>[],
  entry: z.infer<typeof DetectedSignalSchema>
) {
  const existing = signals.find((s) => s.type === entry.type);
  if (!existing) {
    signals.push(entry);
    return;
  }
  const rank = { high: 3, medium: 2, low: 1 };
  const existingRank = existing.probability ? rank[existing.probability] : 0;
  const entryRank = entry.probability ? rank[entry.probability] : 0;
  if (entryRank >= existingRank) {
    Object.assign(existing, entry);
  }
}

export async function POST(req: Request) {
  const apiKey = process.env.INTERHUMAN_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "INTERHUMAN_API_KEY not configured" }, { status: 500 });
  }

  let videoBuffer: Buffer;
  try {
    const arrayBuffer = await req.arrayBuffer();
    videoBuffer = Buffer.from(arrayBuffer);
  } catch {
    return NextResponse.json({ error: "Failed to read video data" }, { status: 400 });
  }

  if (videoBuffer.length < MIN_CHUNK_BYTES) {
    return NextResponse.json({ error: "Video chunk too small (min 10 KB)" }, { status: 400 });
  }
  if (videoBuffer.length > MAX_CHUNK_BYTES) {
    return NextResponse.json({ error: "Video chunk too large (max 32 MB)" }, { status: 400 });
  }

  return new Promise<NextResponse>((resolve) => {
    const ws = new WebSocket(INTERHUMAN_WS_URL, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    const allSignals: z.infer<typeof DetectedSignalSchema>[] = [];
    let correlationId: string | undefined;
    let eventCount = 0;
    let settled = false;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;

    const timeout = setTimeout(() => {
      finishWithResult();
    }, ANALYSIS_TIMEOUT_MS);

    function resetIdleTimer() {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        finishWithResult();
      }, IDLE_CLOSE_MS);
    }

    function finish(response: NextResponse) {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (idleTimer) clearTimeout(idleTimer);
      ws.terminate();
      resolve(response);
    }

    function finishWithResult() {
      const result: AnalyzeResult = {
        signals: allSignals,
        correlation_id: correlationId,
        event_count: eventCount,
      };
      finish(NextResponse.json(AnalyzeResultSchema.parse(result)));
    }

    ws.on("open", () => {
      console.log("[analyze] WS connected, sending", videoBuffer.length, "bytes");
      ws.send(videoBuffer);
      resetIdleTimer();
    });

    ws.on("message", (data: WebSocket.RawData) => {
      try {
        const raw = data.toString();
        console.log("[analyze] WS message:", raw.slice(0, 300));
        const parsed = V1EnvelopeSchema.safeParse(JSON.parse(raw));
        if (!parsed.success) return;

        const msg = parsed.data;
        eventCount += 1;
        if (msg.correlation_id) correlationId = msg.correlation_id;

        if (msg.type === "signal.detected" && msg.data) {
          const signalType = msg.data.signal_type;
          if (typeof signalType === "string") {
            upsertSignal(allSignals, {
              type: signalType,
              probability:
                typeof msg.data.probability === "string"
                  ? (ProbabilitySchema.safeParse(msg.data.probability).success
                      ? (msg.data.probability as z.infer<typeof ProbabilitySchema>)
                      : undefined)
                  : undefined,
              start: typeof msg.data.start === "number" ? msg.data.start : undefined,
              end: typeof msg.data.end === "number" ? msg.data.end : undefined,
              source: "signal",
            });
          }
        }

        if (msg.type === "engagement.updated" && msg.data) {
          const state = msg.data.state;
          if (typeof state === "string") {
            const mapped = mapEngagementState(state);
            if (mapped) {
              upsertSignal(allSignals, {
                type: mapped,
                start: typeof msg.data.start === "number" ? msg.data.start : undefined,
                end: typeof msg.data.end === "number" ? msg.data.end : undefined,
                source: "engagement",
              });
            }
          }
        }

        if (msg.type === "error" && msg.data) {
          const message =
            typeof msg.data.message === "string"
              ? msg.data.message
              : "Interhuman analysis error";
          const code = typeof msg.data.code === "string" ? msg.data.code : undefined;
          finish(
            NextResponse.json(
              { error: message, error_id: code, correlation_id: correlationId },
              { status: 422 }
            )
          );
          return;
        }

        resetIdleTimer();
      } catch {
        // ignore parse errors on individual messages
      }
    });

    ws.on("error", (err) => {
      console.error("[analyze] WS error:", err.message);
      finish(NextResponse.json({ error: `WebSocket error: ${err.message}` }, { status: 502 }));
    });

    ws.on("close", (code, reason) => {
      console.log("[analyze] WS closed, code:", code, "reason:", reason?.toString(), "events:", eventCount, "signals:", allSignals.length);
      if (!settled) {
        finishWithResult();
      }
    });
  });
}
