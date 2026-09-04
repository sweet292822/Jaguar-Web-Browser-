export async function onRequest(context) {
  const { request } = context;
  const urlObj = new URL(request.url);
  
  if (urlObj.pathname === "/proxy") {
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

  const frontendHtml = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Camera Bypass Launcher</title>
      <style>
          body { font-family: -apple-system, sans-serif; background: #f4f5f7; padding: 40px 20px; text-align: center; }
          .card { background: #fff; max-width: 400px; margin: 0 auto; padding: 30px; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
          input { width: 100%; padding: 12px; font-size: 16px; border: 1px solid #ccc; border-radius: 8px; margin-bottom: 16px; box-sizing: border-box; }
          button { width: 100%; background: #038AFD; border: none; padding: 14px; font-size: 16px; font-weight: bold; border-radius: 8px; cursor: pointer; color: white; }
      </style>
  </head>
  <body>
      <div class="card">
          <h2>Bypass Camera Lock</h2>
          <p style="color: #666; font-size: 14px;">Enter the URL of the site forcing your camera open:</p>
          <input type="url" id="targetUrl" placeholder="https://example.com/upload" value="https://">
          <button onclick="launchSite()">Open Clean Browser</button>
      </div>

      <script>
          function launchSite() {
              let url = document.getElementById('targetUrl').value;
              if(url && url !== "https://") {
                  window.location.href = "/proxy?url=" + encodeURIComponent(url);
              }
          }
      </script>
  </body>
  </html>
  `;

  return new Response(frontendHtml, {
    headers: { "Content-Type": "text/html;charset=UTF-8" },
  });
}
