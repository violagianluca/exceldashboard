// Funzione serverless Netlify universale (CommonJS exports.handler - funziona senza package.json)
exports.handler = async function (event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "OK" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: { message: "Metodo non consentito" } })
    };
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: { message: "Variabile GEMINI_API_KEY non configurata su Netlify." } })
      };
    }

    const body = JSON.parse(event.body || "{}");
    const { userQuery, systemPrompt } = body;

    const googleResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userQuery }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] }
        })
      }
    );

    const rawText = await googleResponse.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ error: { message: "Risposta non valida dai server Google Gemini." } })
      };
    }

    return {
      statusCode: googleResponse.status,
      headers,
      body: JSON.stringify(data)
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: { message: err.message || "Errore interno del server" } })
    };
  }
};