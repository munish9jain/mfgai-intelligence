exports.handler = async function(event, context) {
  const C = {"Access-Control-Allow-Origin":"*","Content-Type":"application/json"};
  if (event.httpMethod === "OPTIONS") return {statusCode:200,headers:C,body:""};
  const k = process.env.ANTHROPIC_API_KEY;
  if (!k) return {statusCode:500,headers:C,body:JSON.stringify({error:"API key not configured"})};
  const p = "List 10 manufacturing AI success stories as a JSON array. One story per category: Process Automation, Quality Inspection, Inventory Logistics, Predictive Maintenance, Scheduling Planning, Plant Optimization, Safety Compliance, Workforce Training, Energy Sustainability, Supply Chain. Each story: id, title, category, industry(array), impact, roi, summary, source, tip, tags(array), searchQ, smallShop(boolean), bigCompany(string). Return only the JSON array.";
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":k,"anthropic-version":"2023-06-01"},body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:4000,messages:[{role:"user",content:p}]})});
    const d = await r.json();
    if (!r.ok) return {statusCode:r.status,headers:C,body:JSON.stringify({error:d.error?.message||"API error"})};
    const t = (d.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("");
    const clean = t.replace(/```json/g,"").replace(/```/g,"").trim();
    const a=clean.indexOf("["),z=clean.lastIndexOf("]");
    if (a<0||z<0) return {statusCode:500,headers:C,body:JSON.stringify({error:"No JSON",preview:t.slice(0,200)})};
    return {statusCode:200,headers:C,body:JSON.stringify({articles:JSON.parse(clean.slice(a,z+1)),generated:new Date().toISOString()})};
  } catch(e) {
    return {statusCode:500,headers:C,body:JSON.stringify({error:e.message})};
  }
};
