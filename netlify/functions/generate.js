exports.handler = async function(event, context) {
  const C = {"Access-Control-Allow-Origin":"*","Content-Type":"application/json"};
  if (event.httpMethod === "OPTIONS") return {statusCode:200,headers:C,body:""};
  const k = process.env.ANTHROPIC_API_KEY;
  if (!k) return {statusCode:500,headers:C,body:JSON.stringify({error:"API key not configured"})};

  const cats1 = "Process Automation, Quality & Inspection, Inventory & Logistics, Predictive Maintenance, Scheduling & Planning";
  const cats2 = "Plant Floor Optimization, Safety & Compliance, Workforce & Training, Energy & Sustainability, Supply Chain Resilience";

  const makePrompt = (cats, startId) =>
    `Generate exactly 10 manufacturing AI stories, 2 per category: ${cats}. Mix big companies (Siemens, Rockwell, FANUC, Cognex, SAP, Blue Yonder, SKF, Augury, Microsoft, ABB, Honeywell, Emerson, Aveva, Nvidia) with small manufacturers under 100 employees. At least 3 must be small shops. Always include at least 1 story from each of these industries: Automotive, Food & Beverage, Pharma & Medical, Metals & Fabrication, Plastics & Compounding, Electronics, Oil Gas & Chemicals.


  const callAPI = (prompt) => fetch("https://api.anthropic.com/v1/messages", {
    method:"POST",
    headers:{"Content-Type":"application/json","x-api-key":k,"anthropic-version":"2023-06-01"},
    body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:2500,messages:[{role:"user",content:prompt}]})
  });

  const extract = (text) => {
    const clean = text.replace(/```json/g,"").replace(/```/g,"").trim();
    const a = clean.indexOf("["), z = clean.lastIndexOf("]");
    if (a < 0 || z < 0) return [];
    try { return JSON.parse(clean.slice(a, z+1)); } catch(e) { return []; }
  };

  try {
    const [r1, r2] = await Promise.all([
      callAPI(makePrompt(cats1, 1)),
      callAPI(makePrompt(cats2, 11))
    ]);

    const [d1, d2] = await Promise.all([r1.json(), r2.json()]);

    const t1 = (d1.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("");
    const t2 = (d2.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("");

    const articles = [...extract(t1), ...extract(t2)];

    if (!articles.length) return {
      statusCode:500,headers:C,
      body:JSON.stringify({error:"No articles parsed",t1:t1.slice(0,150),t2:t2.slice(0,150)})
    };

    return {statusCode:200,headers:C,body:JSON.stringify({articles,generated:new Date().toISOString()})};

  } catch(e) {
    return {statusCode:500,headers:C,body:JSON.stringify({error:e.message})};
  }
};
