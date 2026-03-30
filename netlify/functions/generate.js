exports.handler = async function(event, context) {
  const C = {"Access-Control-Allow-Origin":"*","Content-Type":"application/json"};
  if (event.httpMethod === "OPTIONS") return {statusCode:200,headers:C,body:""};
  const k = process.env.ANTHROPIC_API_KEY;
  if (!k) return {statusCode:500,headers:C,body:JSON.stringify({error:"API key not configured"})};

  const cats1 = "Process Automation, Quality & Inspection, Inventory & Logistics, Predictive Maintenance, Scheduling & Planning";
  const cats2 = "Plant Floor Optimization, Safety & Compliance, Workforce & Training, Energy & Sustainability, Supply Chain Resilience";

  const makePrompt = (cats, startId) => "Generate exactly 10 manufacturing AI stories, 2 per category: " + cats + ". Mix big companies (Siemens, Rockwell, FANUC, Cognex, SAP, Blue Yonder, SKF, Augury, Microsoft, ABB, Honeywell, Emerson, Aveva, Nvidia) with small manufacturers under 100 employees. At least 3 must be small shops. Always include stories from: Automotive, Food & Beverage, Pharma & Medical, Metals & Fabrication, Plastics & Compounding, Electronics, Oil Gas & Chemicals. Title must be the problem solved. Include specific ROI. Return ONLY raw JSON array, no markdown, no backticks. Start with [ end with ]. IDs start at " + startId + ". Each object: id,title,category,industry(array),impact(High/Medium/Low),roi,summary(3 sentences),source,tip,tags(array),searchQ,smallShop(boolean),bigCompany(string or null)";

  const callAPI = function(prompt) {
    return fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {"Content-Type":"application/json","x-api-key":k,"anthropic-version":"2023-06-01"},
      body: JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:2500,messages:[{role:"user",content:prompt}]})
    });
  };

  const extract = function(text) {
    const clean = text.replace(/```json/g,"").replace(/```/g,"").trim();
    const a = clean.indexOf("[");
    const z = clean.lastIndexOf("]");
    if (a < 0 || z < 0) return [];
    try { return JSON.parse(clean.slice(a, z+1)); } catch(e) { return []; }
  };

  try {
    const results = await Promise.all([
      callAPI(makePrompt(cats1, 1)),
      callAPI(makePrompt(cats2, 11))
    ]);

    const jsons = await Promise.all([results[0].json(), results[1].json()]);

    const t1 = (jsons[0].content||[]).filter(function(b){return b.type==="text";}).map(function(b){return b.text;}).join("");
    const t2 = (jsons[1].content||[]).filter(function(b){return b.type==="text";}).map(function(b){return b.text;}).join("");

    const articles = extract(t1).concat(extract(t2));

    if (!articles.length) return {statusCode:500,headers:C,body:JSON.stringify({error:"No articles returned",t1:t1.slice(0,200),t2:t2.slice(0,200)})};

    return {statusCode:200,headers:C,body:JSON.stringify({articles:articles,generated:new Date().toISOString()})};

  } catch(e) {
    return {statusCode:500,headers:C,body:JSON.stringify({error:e.message})};
  }
};
