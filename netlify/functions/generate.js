i want to take it all to perplexity give me everything that i can copy and take it there

12:13 AM
Smart. Here's everything in one place — copy this entire message and paste it into Perplexity:

I have a manufacturing AI intelligence website deployed at https://mfgai-intelligence.netlify.app

The site uses a Netlify serverless function at /netlify/functions/generate.js that calls the Anthropic Claude API to generate manufacturing AI stories. The function keeps failing with either timeout errors or "Unexpected end of JSON input".

Here is the current generate.js code:

javascript
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
The Netlify function logs show it runs for 24-32 seconds and uses 93-121 MB memory. The free tier timeout is 10 seconds. I am on a paid plan.

My netlify.toml is:

toml
[build]
  publish = "public"
  functions = "netlify/functions"

[functions]
  node_bundler = "esbuild"

[context.production.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
Problems:

Single API call takes 24-32 seconds — too slow
Parallel calls with Promise.all also fail
max_tokens:4000 causes "Unexpected end of JSON input" — JSON gets cut off
max_tokens:2000 also cuts off with 10 stories
What I need: A working generate.js Netlify function that reliably returns 10 manufacturing AI stories as JSON within 10 seconds. The Anthropic model is claude-haiku-4-5-20251001. The ANTHROPIC_API_KEY is set as an environment variable in Netlify.

Please give me a complete working solution.

That gives Perplexity the full picture. Come back here with whatever solution it gives you and I'll help you implement it.

