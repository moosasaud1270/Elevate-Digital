export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Allow": "POST", "Content-Type": "application/json" }
    });
  }

  let payload;
  try {
    payload = await req.json();
  } catch (_error) {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const name = String(payload.name || "").trim();
  const email = String(payload.email || "").trim();
  const phone = String(payload.phone || "").trim();
  const company = String(payload.company || "").trim();
  const service = String(payload.service || "").trim();
  const message = String(payload.msg || "").trim();

  if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ error: "A valid name and email are required" }), {
      status: 422,
      headers: { "Content-Type": "application/json" }
    });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.SIGNUP_TO_EMAIL || "elevatedigital984@gmail.com";
  const from = process.env.SIGNUP_FROM_EMAIL || "Elevate Digital <onboarding@resend.dev>";

  if (!apiKey) {
    return new Response(JSON.stringify({
      error: "Email service is not configured on Vercel"
    }), {
      status: 503,
      headers: { "Content-Type": "application/json" }
    });
  }

  const safeText = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone || "Not provided"}`,
    `Company: ${company || "Not provided"}`,
    `Interested in: ${service || "Not specified"}`,
    "",
    "Message:",
    message || "No message provided"
  ].join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: email,
      subject: `Project inquiry from ${name}${company ? ` — ${company}` : ""}`,
      text: safeText
    })
  });

  if (!response.ok) {
    const details = await response.text();
    console.error("Resend API error:", response.status, details);
    return new Response(JSON.stringify({ error: "Unable to send inquiry" }), {
      status: 502,
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
