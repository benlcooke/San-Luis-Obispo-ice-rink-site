// netlify/functions/gofundme.js
exports.handler = async function () {
  const GOFUNDME_URL = "https://gofund.me/08df813d1";

  try {
    const res = await fetch(GOFUNDME_URL, {
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });

    if (!res.ok) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        body: JSON.stringify({ ok: false, error: `Fetch failed: ${res.status} ${res.statusText}` })
      };
    }

    const html = await res.text();

    // Try a few common GoFundMe patterns (they can change markup over time)
    let raised = null;

    // 1) current_amount in embedded JSON
    let m = html.match(/"current_amount"\s*:\s*([0-9]+)/i);
    if (m) raised = Number(m[1]);

    // 2) amountRaised
    if (raised === null) {
      m = html.match(/"amountRaised"\s*:\s*([0-9]+)/i);
      if (m) raised = Number(m[1]);
    }

    // 3) Generic fallback: first $X,XXX pattern (less reliable)
    if (raised === null) {
      m = html.match(/\$\s*([0-9]{1,3}(?:,[0-9]{3})+|[0-9]+)/);
      if (m) raised = Number(String(m[1]).replace(/,/g, ""));
    }

    if (!Number.isFinite(raised)) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        body: JSON.stringify({
          ok: false,
          error: "Could not parse raised total from GoFundMe HTML"
        })
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        // cache 5 minutes to avoid hammering GoFundMe
        "Cache-Control": "public, max-age=300"
      },
      body: JSON.stringify({ ok: true, raised })
    };
  } catch (e) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify({ ok: false, error: String(e?.message || e) })
    };
  }
};
