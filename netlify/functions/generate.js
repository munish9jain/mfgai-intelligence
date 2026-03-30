exports.handler = async function (event, context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: ""
    };
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
You are a JSON generator for manufacturing AI success stories.

Return ONLY a valid JSON array of EXACTLY 10 objects, nothing before or after it.

Each object MUST have these fields:
- id: integer from 1 to 10
- title: short string (max 80 chars)
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
- industry: array of 1–3 short strings
- impact: 1–2 sentence string
- roi: short string (like "15% scrap reduction", "2x throughput")
- summary: 2–3 sentence string
- source: short string (e.g. "Internal project", "Vendor case study")
- tip: 1–2 sentence practical tip
- tags: array of 3–7 short strings
- searchQ: short string suitable as a search query
- smallShop: boolean
- bigCompany: short string (company type, e.g. "Global OEM", "Tier-2 supplier")

Rules:
- Exactly ONE story per category listed above.
- Use realistic but generic descriptions (no real company names).
- Keep responses concise so that everything fits comfortably within ~1200 tokens.
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
        max_tokens: 1500,
        temperature: 0.4,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          error: data.error?.message || "Anthropic API error",
          raw: data
        })
      };
    }

    const text = (data.content || [])
      .filter(part => part.type === "text")
      .map(part => part.text)
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
          preview: cleaned.slice(0, 300)
        })
      };
    }

    const jsonSlice = cleaned.slice(start, end + 1);

    let articles;
    try {
      articles = JSON.parse(jsonSlice);
    } catch (parseErr) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: "Failed to parse JSON from model",
          message: parseErr.message,
          preview: jsonSlice.slice(0, 300)
        })
      };
    }

    if (!Array.isArray(articles) || articles.length !== 10) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: "Model did not return exactly 10 stories",
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
        error: "Server error calling Anthropic",
        message: err.message
      })
    };
  }
};
