const https = require("https");

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PROMPT = `You are a manufacturing AI intelligence analyst. Today is ${new Date().toDateString()}.

Generate exactly 20 recent AI productivity stories for manufacturing operations, 2 per category.
Categories (use exactly): Process Automation, Quality & Inspection, Inventory & Logistics, Predictive Maintenance, Scheduling & Planning, Plant Floor Optimization, Safety & Compliance, Workforce & Training, Energy & Sustainability, Supply Chain Resilience

Rules:
- At least 6 stories must feature small manufacturers (under 100 employees)
- Frame every title as the PROBLEM SOLVED, not the vendor name
- Every story needs a specific measurable ROI (%, $, time saved)
- Every story needs a concrete "tip" — one free or low-cost first step any ops manager can take tomorrow
- Reference real AI tools and companies: Cognex, Siemens, Rockwell, FANUC, Blue Yonder, SKF, Augury, SAP, Tulip, Landing AI, Poka, Intenseye, Protex, o9 Solutions, Sight Machine, Aveva, Augmentir, SparkCognition, etc.
- Industries: Automotive, Food & Beverage, Pharma & Medical, Metals & Fabrication, Plastics & Compounding, Electronics, Oil Gas & Chemicals

Return ONLY a valid JSON array. No markdown. No explanation. Start with [ end with ].

Each object must have exactly these fields:
{
  "id": number,
  "title": "problem-first compelling headline",
  "category": "exact category name",
  "industry": ["industry1", "industry2"],
  "impact": "High" or "Medium" or "Low",
  "roi": "specific ROI string e.g. Scrap: 4% to 0.8%",
  "summary": "3 sentences: problem, AI solution, measurable result",
  "source": "publication name",
  "tip": "one concrete actionable first step, free or low cost",
  "tags": ["tag1", "tag2", "tag3"],
  "searchQ": "google search query to find related real article"
}`;

function callClaude(apiKey) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4000,
      messages: [{ role: "user", content: PROMPT }],
    });

    const req = https.request(
      {
        hostname: "api.anthropic.com",
        path: "/v1/messages",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve({ status: res.statusCode, body: data }));
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS, body: "" };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: "API key not configured" }),
    };
  }

  try {
    const result = await callClaude(apiKey);
    const data = JSON.parse(result.body);

    if (result.status !== 200) {
      return {
        statusCode: result.status,
        headers: CORS,
        body: JSON.stringify({ error: data.error?.message || "API error" }),
      };
    }

    const text = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");

    const a = text.indexOf("[");
    const z = text.lastIndexOf("]");
    if (a < 0 || z < 0) {
      return {
        statusCode: 500,
        headers: CORS,
        body: JSON.stringify({ error: "No JSON array in response", raw: text.slice(0, 300) }),
      };
    }

    const articles = JSON.parse(text.slice(a, z + 1));
    return {
      statusCode: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
      body: JSON.stringify({ articles, generated: new Date().toISOString() }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
