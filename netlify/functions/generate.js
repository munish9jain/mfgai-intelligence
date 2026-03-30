exports.handler = async function(event, context) {
  const CORS = {"Access-Control-Allow-Origin":"*","Content-Type":"application/json"};
  if (event.httpMethod === "OPTIONS") return {statusCode:200,headers:CORS,body:""};
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return {statusCode:500,headers:CORS,body:JSON.stringify({error:"API key not configured"})};

  const prompt1 = "Generate exactly 10 manufacturing AI stories, 2 each for these categories: Process Automation, Quality and Inspection, Inventory and Logistics, Predictive Maintenance, Scheduling and Planning. Include stories from Automotive, Food and Beverage, Plastics, Electronics industries. Mix Siemens, Rockwell, FANUC, Cognex, SAP with small shops under 100 employees. Title is the problem solved. Include ROI number. Return only a JSON array starting with [ and ending with ]. No markdown. Each item has: id, title, category, industry, impact, roi, summary, source, tip, tags, searchQ, smallShop, bigCompany";

  const prompt2 = "Generate exactly 10 manufacturing AI stories, 2 each for these categories: Plant Floor Optimization, Safety and Compliance, Workforce and Training, Energy and Sustainability, Supply Chain Resilience. Include stories from Metals, Pharma, Oil and Gas, Automotive industries. Mix ABB, Honeywell, Emerson, Aveva, Blue Yonder with small shops under 100 employees. Title is the problem solved. Include ROI number. Return only a JSON array starting with [ and ending with ]. No markdown. Each item has: id, title, category, industry, impact, roi, summary, source, tip, tags, searchQ, smallShop, bigCompany";

  function callClaude(prompt) {
    return fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2500,
        messages: [{role: "user", content: prompt}]
      })
    });
  }

  function parseArticles(text) {
    var start = text.indexOf("[");
    var end = text.lastIndexOf("]");
    if (start === -1 || end === -1) return [];
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch(e) {
      return [];
    }
  }

  try {
    var r1 = await callClaude(prompt1);
    var r2 = await callClaude(prompt2);
    var d1 = await r1.json();
    var d2 = await r2.json();

    var text1 = "";
    var text2 = "";
    for (var i = 0; i < (d1.content || []).length; i++) {
      if (d1.content[i].type === "text") text1 += d1.content[i].text;
    }
    for (var j = 0; j < (d2.content || []).length; j++) {
      if (d2.content[j].type === "text") text2 += d2.content[j].text;
    }

    var articles1 = parseArticles(text1);
    var articles2 = parseArticles(text2);
    var all = articles1.concat(articles2);

    if (all.length === 0) {
      return {statusCode:500,headers:CORS,body:JSON.stringify({error:"Parse failed",preview1:text1.slice(0,200),preview2:text2.slice(0,200)})};
    }

    return {statusCode:200,headers:CORS,body:JSON.stringify({articles:all,generated:new Date().toISOString()})};

  } catch(err) {
    return {statusCode:500,headers:CORS,body:JSON.stringify({error:err.message})};
  }
};
