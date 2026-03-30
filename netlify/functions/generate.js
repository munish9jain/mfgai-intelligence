exports.handler = async function(event, context) {
  const C = {"Access-Control-Allow-Origin":"*","Content-Type":"application/json"};
  if (event.httpMethod === "OPTIONS") return {statusCode:200,headers:C,body:""};
  const k = process.env.ANTHROPIC_API_KEY;
  if (!k) return {statusCode:500,headers:C,body:JSON.stringify({error:"API key not configured"})};

  const p1 = "Generate 10 manufacturing AI stories, 1 each for: Process Automation, Quality & Inspection, Inventory & Logistics, Predictive Maintenance, Scheduling & Planning, Plant Floor Optimization, Safety & Compliance, Workforce & Training, Energy & Sustainability, Supply Chain Resilience. Use big companies: Siemens, Rockwell, FANUC, Cognex, SAP, ABB, Honeywell, Emerson, Aveva, Microsoft. Cover industries: Automotive, Food & Beverage, Metals & Fabrication, Electronics. Title is the problem solved. Include ROI. Return ONLY a JSON array. No markdown. Each item: id(1-10),title,category,industry(array),impact(High/Medium/Low),roi,summary(3 sentences),source,tip,tags(array),searchQ,smallShop(false),bigCompany(company name string)";

  const p2 = "Generate 10 manufacturing AI stories, 1 each for: Process Automation, Quality & Inspection, Inventory & Logistics, Predictive Maintenance, Scheduling & Planning, Plant Floor Optimization, Safety & Compliance, Workforce & Training, Energy & Sustainability, Supply Chain Resilience. Focus on small manufacturers under 100 employees. Cover industries: Plastics & Compounding, Pharma & Medical, Oil Gas & Chemicals, Metals & Fabrication. Title is the problem solved. Include ROI. Return ONLY a JSON array. No markdown. Each item: id(11-20),title,category,industry(array),impact(High/Medium/Low),roi,summary(3 sentences),source,tip,tags(array),searchQ,smallShop(true),bigCompany(null)";

  function getText(d) {
    return (d.content||[]).filter(function(b){return b.type==="text";}).map(function(b){return b.text;}).join("");
  }

  function parse(text) {
    var t = text.replace(/```json/g,"").replace(/```/g,"").trim();
    var a = t.indexOf("["), z = t.lastIndexOf("]");
    if (a<0||z<0) return [];
    try { return JSON.parse(t.slice(a,z+1)); } catch(e) { return []; }
  }

  try {
    var res = await Promise.all([
      fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":k,"anthropic-version":"2023-06-01"},body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:2500,messages:[{role:"user",content:p1}]})}),
      fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":k,"anthropic-version":"2023-06-01"},body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:2500,messages:[{role:"user",content:p2}]})})
    ]);

    var data = await Promise.all([res[0].json(), res[1].json()]);
    var articles = parse(getText(data[0])).concat(parse(getText(data[1])));

    if (!articles.length) return {statusCode:500,headers:C,body:JSON.stringify({error:"No articles parsed"})};
    return {statusCode:200,headers:C,body:JSON.stringify({articles:articles,generated:new Date().toISOString()})};

  } catch(e) {
    return {statusCode:500,headers:C,body:JSON.stringify({error:e.message})};
  }
};
