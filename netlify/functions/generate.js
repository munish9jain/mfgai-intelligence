exports.handler = async function (event, context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "API key not configured" })
    };
  }

  async function callAnthropic(prompt, maxTokens) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: maxTokens,
        temperature: 0.3,
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || "Anthropic API error");
    }

    const text = (data.content || [])
      .filter(p => p.type === "text")
      .map(p => p.text)
      .join("")
      .trim();

    return text;
  }

  const basePrompt = `
You are a JSON generator for manufacturing AI success stories.

Return ONLY a valid JSON array of EXACTLY 10 objects, nothing before or after it.

Each object MUST have these fields:
- id: integer from 1 to 10
- title: short string (max 60 chars)
- category: one of:
  "Process Automation",
  "Quality Inspection",
  "Inventory Logistics",
  "Predictive Maintenance",
  "Scheduling Planning",
  "Plant Optimization",
  "Safety Compliance",
  "Workforce Training",
  "Energy Sustainability",
  "Supply Chain"
- industry: array of 1–2 short strings
- impact: ONE short sentence (max 30 words)
- roi: short string like "15% scrap reduction"
- summary: ONE short sentence (max 35 words)
- source: short string (e.g. "Internal project", "Vendor case study")
- tip: ONE short practical sentence (max 25 words)
- tags: array of 3–5 short strings
- searchQ: short string suitable as search query
- smallShop: boolean
- bigCompany: short string (e.g. "Global OEM", "Tier-2 supplier")

Rules:
- Exactly ONE story per category listed above.
- Use realistic but generic descriptions (no real company names).
- Keep everything concise so all 10 objects fit in under 800 tokens.
- Output ONLY the JSON array, no markdown, no commentary, no backticks.
`;

  try {
    // 1) First attempt: generate compact JSON
    let rawText = await callAnthropic(basePrompt, 800);

    const cleaned = rawText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const start = cleaned.indexOf("[");
    const end = cleaned.lastIndexOf("]");

    if (start < 0 || end < 0) {
      throw new Error("No JSON array found in model response");
    }

    let jsonSlice = cleaned.slice(start, end + 1);
    let articles;

    try {
      articles = JSON.parse(jsonSlice);
    } catch (parseErr) {
      // 2) Repair step: ask model to fix the partial JSON
      const repairPrompt = `
You will receive a PARTIAL or BROKEN JSON array of objects that should describe manufacturing AI success stories.

Your task:
- Repair the JSON so that it becomes a VALID JSON array.
- Ensure there are EXACTLY 10 objects, with the same schema as described below.
- If any fields are missing or cut off, recreate them reasonably.
- Output ONLY the fixed JSON array, no comments or backticks.

Schema (for each object):
- id: integer 1–10
- title: short string (max 60 chars)
- category: one of:
  "Process Automation",
  "Quality Inspection",
  "Inventory Logistics",
  "Predictive Maintenance",
  "Scheduling Planning",
  "Plant Optimization",
  "Safety Compliance",
  "Workforce Training",
  "Energy Sustainability",
  "Supply Chain"
- industry: array of 1–2 short strings
- impact: one short sentence
- roi: short string like "15% scrap reduction"
- summary: one short sentence
- source: short string
- tip: one short practical sentence
- tags: array of 3–5 short strings
- searchQ: short string
- smallShop: boolean
- bigCompany: short string.

Here is the broken JSON to repair:
${jsonSlice}
`;

      const repairedText = await callAnthropic(repairPrompt, 800);
      const repairedClean = repairedText
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();
      const rStart = repairedClean.indexOf("[");
      const rEnd = repairedClean.lastIndexOf("]");
      if (rStart < 0 || rEnd < 0) {
        throw new Error("Repair step: no JSON array found");
      }
      jsonSlice = repairedClean.slice(rStart, rEnd + 1);
      articles = JSON.parse(jsonSlice);
    }

    if (!Array.isArray(articles) || articles.length !== 10) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: "Model did not return exactly 10 stories after repair",
          count: Array.isArray(articles) ? articles.length : null
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        articles,
        generated: new Date().toISOString()
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Failed to parse JSON from model",
        message: err.message
      })
    };
  }
};
