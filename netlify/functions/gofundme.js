// netlify/functions/gofundme.js
// Returns JSON: { ok: true, raised: <number> } or { ok:false, error:"..." }

export async function handler() {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  };

  try {
    // ✅ Safer than the short gofund.me link (more consistent parsing)
    const GOFUNDME_URL = "https://www.gofundme.com/f/08df813d1";

    const response = await fetch(GOFUNDME_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Netlify Function)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ok: false,
          error: `Fetch failed: ${response.status} ${response.statusText || ""}`.trim(),
        }),
      };
    }

    const html = await response.text();

    // Try multiple common patterns GoFundMe may use.
    // Note: GoFundMe markup can change; if this breaks, we update patterns.
    const patterns = [
      // Example: $12,345 or $12,345.67
      /\$\s?([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?)/,

      // Sometimes embedded JSON fields:
      /"amountRaised"\s*:\s*([0-9]+(?:\.[0-9]+)?)/,
      /"current_amount"\s*:\s*([0-9]+(?:\.[0-9]+)?)/,
      /"donationAmount"\s*:\s*([0-9]+(?:\.[0-9]+)?)/,
    ];

    let raised = null;

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const value = Number(String(match[1]).replace(/,/g, ""));
        if (Number.isFinite(value) && value >= 0) {
          raised = value;
          break;
        }
      }
    }

    if (raised === null) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ok: false,
          error: "Could not find raised amount on GoFundMe page (markup may have changed).",
        }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, raised }),
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: false,
        error: (err && err.message) ? err.message : "Unknown error",
      }),
    };
  }
}
