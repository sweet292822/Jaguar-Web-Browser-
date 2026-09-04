export async function onRequestGet(context) {
  const { request } = context;
  const urlObj = new URL(request.url);
  const targetUrl = urlObj.searchParams.get("url");

  if (!targetUrl) {
    return new Response("Missing target URL parameter", { status: 400 });
  }

  try {
    const validatedTargetUrl = new URL(targetUrl).toString();

    // Fetch the target website server-side
    const response = await fetch(validatedTargetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      },
      redirect: "follow"
    });

    const contentType = response.headers.get("content-type") || "";
    
    // If it's not HTML (like an image or script), pass it right through
    if (!contentType.includes("text/html")) {
      return response;
    }

    // Rewrite HTML to fix relative paths and strip camera capture locks
    return new HTMLRewriter()
      .on("head", {
        element(element) {
          element.prepend(`<base href="${validatedTargetUrl}">`, { html: true });
        }
      })
      .on("input[type='file']", {
        element(element) {
          if (element.hasAttribute("capture")) {
            element.removeAttribute("capture");
          }
        }
      })
      .transform(response);

  } catch (err) {
    return new Response("Proxy Error: " + err.message, { status: 500 });
  }
}
