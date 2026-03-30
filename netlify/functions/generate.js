exports.handler = async function (event, context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json"
  };

  // Simple test function to confirm syntax is OK
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      ok: true,
      message: "Test function is working"
    })
  };
};
