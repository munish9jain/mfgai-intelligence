exports.handler = async function(event, context) {
  const C = {"Access-Control-Allow-Origin":"*","Content-Type":"application/json"};
  if (event.httpMethod === "OPTIONS") return {statusCode:200,headers:C,body:""};
  const k = process.env.ANTHROPIC_API_KEY;
  if (!k) return {statusCode:500,headers:C,body:JSON.stringify({error:"API key not configured"})};

  const cats1 = "Process Automation, Quality & Inspection, Inventory & Logistics, Predictive Maintenance, Scheduling & Planning";
  const cats2 = "Plant Floor Optimization, Safety & Compliance, Workforce & Training, Energy & Sustainability, Supply Chain Resilience";

  const makePrompt = (cats, startId) =>
    `Generate exactly 10 manufacturing AI stories, 2 per category: ${cats}. Mix big companies (Siemens, Rockwell, FANUC, Cognex, SAP, Blue Yonder, SKF, Augury, Microsoft, ABB, Honeywell, Emerson, Aveva, Nvidia) with small manufacturers under 100 employees. At least 3 must be small shops. Title=problem solved. Include specific ROI. Return ONLY JSON array, no markdown. IDs start at ${startId}. Each object: id,title,category,industry(array),impact(High/Medium/Low),roi,summary(3 sentences),source,tip,tags(array),searchQ,smallShop(boolean),bigCompany(string or null)`;

  const callAPI = (prompt) => fetch("https://api.anthropic.com/v1/messages", {
    method:"POST",
    headers:{"Content-Type":"application/json","x-api-key":k,"anthropic-version":"2023-06-01"},
    body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:2500,messages:[{role:"user",content:prompt}]})
  });

  const extract = (text) => {
    const a = text.indexOf("["), z = text.lastIndexOf("]");
    if (a < 0 || z < 0) return [];
    try { return JSON.parse(text.slice(a, z+1)); } catch(e) { return []; }
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

    if (!articles.length) return {statusCode:500,headers:C,body:JSON.stringify({error:"No articles parsed",r1:t1.slice(0,100),r2:t2.slice(0,100)})};

    return {statusCode:200,headers:C,body:JSON.stringify({articles,generated:new Date().toISOString()})};

  } catch(e) {
    return {statusCode:500,headers:C,body:JSON.stringify({error:e.message})};
  }
};
