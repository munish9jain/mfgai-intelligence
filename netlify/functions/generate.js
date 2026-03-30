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

  const prompt = `
Return ONLY a valid JSON array of EXACTLY 10 VERY SHORT objects.

Each object MUST have:
- id: integer 1–10
- title: <= 40 chars
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
- industry: array of 1–2 very short strings
- impact: ONE sentence <= 15 words
- roi: short string like "15% scrap reduction"
- summary: ONE sentence <= 20 words
- source: very short string
- tip: ONE sentence <= 15 words
- tags: array of 3 very short strings
- searchQ: very short string
- smallShop: boolean
- bigCompany: very short string.

Rules:
- Exactly ONE story per category above.
- Keep ALL text extremely short.
- Entire JSON must be under 400 tokens.
- Output ONLY the JSON array, no markdown, no commentary, no backticks.
`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        temperature: 0.2,
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

    const cleaned = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const start = cleaned.indexOf("[");
    const end = cleaned.lastIndexOf("]");

    if (start < 0 || end < 0) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: "No JSON array found in model response",
          preview: cleaned.slice(0, 200)
        })
      };
    }

    const jsonSlice = 
