// netlify/functions/gofundme.js
exports.handler = async function () {
  const VERSION = "gfm-debug-v1"; // <-- this must show up in the response
  const url = "https://gofund.me/08df813d1"; // we'll swap to full URL after

  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });

    const text = await res.text();
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify({
        ok: true,
        version: VERSION,
        fetched: url,
        finalUrl: res.url,
        status: res.status,
        statusText: res.statusText,
        contentType: res.headers.get("content-type") || "",
        snippet: text.slice(0, 300)
      })
    };
  } catch (e) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify({
        ok: false,
        version: VERSION,
        fetched: url,
        error: String(e?.message || e)
      })
    };
  }
};
