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

  try {
    const prompt = `
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

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 800,
        temperature: 0.3,
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          error: data.error?.message || "Anthropic API error"
        })
      };
    }

    const text = (data.content || [])
      .filter(p => p.type === "text")
      .map(p => p.text)
      .join("")
      .trim();

    // DO NOT PARSE HERE – just return raw JSON text for the UI to handle
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        raw: text
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Failed to call model",
        message: err.message
      })
    };
  }
};
