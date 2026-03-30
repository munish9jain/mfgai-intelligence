const fs = require("fs");
const path = require("path");

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Uses Netlify Blobs or env-based counter
// We'll use a simple approach: store in /tmp and return count
// For production: replace with Netlify Blobs or FaunaDB free tier

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS, body: "" };
  }

  // We use an external free counter service (countapi.xyz)
  const https = require("https");
  const NAMESPACE = process.env.COUNTER_NAMESPACE || "mfgai-intelligence";
  const KEY = process.env.COUNTER_KEY || "visits";

  const isHit = event.httpMethod === "POST";
  const endpoint = isHit
    ? `https://api.countapi.xyz/hit/${NAMESPACE}/${KEY}`
    : `https://api.countapi.xyz/get/${NAMESPACE}/${KEY}`;

  return new Promise((resolve) => {
    https.get(endpoint, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          resolve({
            statusCode: 200,
            headers: { ...CORS, "Content-Type": "application/json" },
            body: JSON.stringify({ count: json.value || 0 }),
          });
        } catch {
          resolve({
            statusCode: 200,
            headers: CORS,
            body: JSON.stringify({ count: 0 }),
          });
        }
      });
    }).on("error", () => {
      resolve({ statusCode: 200, headers: CORS, body: JSON.stringify({ count: 0 }) });
    });
  });
};
