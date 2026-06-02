const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supportedTasks = new Set([
  "parse_transaction",
  "suggest_category",
  "detect_duplicate",
  "analyze_budget",
  "summarize_report",
  "generate_whatsapp_report",
  "scan_receipt",
  "extract_receipt_fields",
  "chat_finance",
]);

const maxPromptChars = 4000;
const maxPayloadChars = 12000;
const maxEstimatedTokens = 4500;

const systemPrompt = [
  "Kamu adalah asisten finance DOMPET PT.",
  "Jawab dalam Bahasa Indonesia.",
  "Fokus pada pemasukan, pengeluaran, budget, approval, laporan, dan kategori transaksi.",
  "Untuk nota, invoice, atau bukti transfer, ekstrak hanya field yang ada di payload atau hasil OCR provider.",
  "Jangan mengarang angka di luar payload. Jika data kurang, bilang data belum cukup.",
  "Untuk task structured, output harus JSON valid tanpa markdown.",
  "Jawaban ringkas dan langsung ke keputusan finance.",
].join(" ");

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function safeString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function estimateTokens(prompt: string, payloadText: string) {
  return Math.ceil((prompt.length + payloadText.length + systemPrompt.length) / 4);
}

function estimateCost(tokens: number) {
  // Estimasi konservatif ringan untuk budget guard, bukan billing resmi provider.
  return Number(((tokens / 1_000_000) * 0.5).toFixed(6));
}

function extractJson(content: string) {
  const cleaned = content
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function taskInstruction(task: string) {
  const instructions: Record<string, string> = {
    parse_transaction: "Ekstrak transaksi menjadi JSON: type, date, title, vendor_or_source, amount, tax_amount, payment_method, category_hint, project_hint, account_hint, status, note.",
    suggest_category: "Sarankan kategori transaksi. Balas JSON: category, confidence, reason, risk.",
    detect_duplicate: "Cek potensi duplikat dari transaksi pembanding. Balas JSON: duplicate, confidence, matches, reason.",
    analyze_budget: "Analisa dampak transaksi pada budget proyek/kategori. Balas JSON: risk, budget_status, recommendation, reason.",
    summarize_report: "Ringkas laporan finance dari payload. Balas JSON: summary, highlights, risks, recommendations.",
    generate_whatsapp_report: "Buat ringkasan WhatsApp yang rapi dari payload. Balas JSON: text.",
    scan_receipt: "Ekstrak nota/invoice/bukti transfer. Balas JSON: date, type, title, vendor_or_source, category, amount, tax_amount, payment_method, note, confidence. Jika gambar/teks tidak cukup, confidence rendah dan note jelaskan data belum cukup.",
    extract_receipt_fields: "Ekstrak field transaksi dari teks OCR. Balas JSON: date, type, title, vendor_or_source, category, amount, tax_amount, payment_method, note, confidence.",
    chat_finance: "Jawab sebagai konsultan finance operasional. Balas JSON: answer, next_action.",
  };
  return instructions[task] || instructions.chat_finance;
}

async function callDeepSeek(task: string, prompt: string, payload: unknown, usage: { estimated_tokens: number; estimated_cost: number }) {
  const apiKey = Deno.env.get("AI_API_KEY") || "";
  const model = Deno.env.get("AI_MODEL") || "deepseek-chat";
  if (!apiKey) {
    return jsonResponse({ ok: false, message: "AI_API_KEY belum diset di Supabase Edge Function secrets." }, 500);
  }

  const payloadText = JSON.stringify(payload ?? {}, null, 2);
  const userPrompt = [
    `Task: ${task}`,
    taskInstruction(task),
    `Prompt pengguna: ${prompt || "-"}`,
    `Payload ringkas:\n${payloadText || "{}"}`,
  ].join("\n\n");

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 900,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    return jsonResponse({ ok: false, message: `AI provider error: ${message.slice(0, 240)}` }, response.status);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content || "";
  const parsed = extractJson(content);

  return jsonResponse({
    ok: true,
    task,
    result: parsed || { text: content || "AI tidak mengembalikan jawaban." },
    usage: {
      estimated_tokens: data?.usage?.total_tokens || usage.estimated_tokens,
      estimated_cost: usage.estimated_cost,
    },
    mode: "real",
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ ok: false, message: "Method tidak didukung." }, 405);

  try {
    const body = await request.json();
    const task = safeString(body?.task, "chat_finance");
    const prompt = safeString(body?.prompt).slice(0, maxPromptChars);
    const payload = body?.payload ?? {};
    const payloadText = JSON.stringify(payload);

    if (!supportedTasks.has(task)) {
      return jsonResponse({ ok: false, message: `Task ${task} belum didukung.` }, 400);
    }

    if (safeString(body?.prompt).length > maxPromptChars) {
      return jsonResponse({ ok: false, message: "Prompt terlalu panjang. Kirim ringkasan saja agar budget AI hemat." }, 413);
    }

    if (payloadText.length > maxPayloadChars) {
      return jsonResponse({ ok: false, message: "Payload terlalu besar. Kirim data ringkas/relevan saja." }, 413);
    }

    const estimatedTokens = estimateTokens(prompt, payloadText);
    const usage = { estimated_tokens: estimatedTokens, estimated_cost: estimateCost(estimatedTokens) };

    if (estimatedTokens > maxEstimatedTokens) {
      return jsonResponse({ ok: false, message: "Request AI melewati batas token hemat. Ringkas filter/data dulu.", usage }, 413);
    }

    const monthlyBudget = Number(Deno.env.get("AI_MONTHLY_BUDGET") || 10);
    if (usage.estimated_cost > monthlyBudget) {
      return jsonResponse({ ok: false, message: "Estimasi biaya request melebihi budget bulanan AI.", usage }, 402);
    }

    const provider = (Deno.env.get("AI_PROVIDER") || "deepseek").toLowerCase();
    if (provider !== "deepseek") {
      return jsonResponse({ ok: false, message: "Provider AI belum didukung pada tahap teks ini." }, 400);
    }

    return await callDeepSeek(task, prompt, payload, usage);
  } catch (error) {
    return jsonResponse({ ok: false, message: error instanceof Error ? error.message : "AI router gagal memproses request." }, 500);
  }
});
