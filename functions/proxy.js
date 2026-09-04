export async function onRequest(context) {
  const { request } = context;
  const urlObj = new URL(request.url);
  const targetUrl = urlObj.searchParams.get("url");

  if (!targetUrl) {
    return new Response("Missing target URL", { status: 400 });
  }

  try {
    const validatedTargetUrl = new URL(targetUrl).toString();

    const response = await fetch(validatedTargetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
      }
    });

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      return response;
    }

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
    return new Response("Failed to load target site: " + err.message, { status: 500 });
  }
}
