function cookieListener(changeInfo) {
  chrome.runtime.sendMessage({ type: "COOKIE_CHANGED", changeInfo });
}

// Normalize origin into a proper pattern: "https://example.com/*"
function toOriginPattern(origin) {
  try {
    const url = new URL(origin);
    return `${url.protocol}//${url.hostname}/*`;
  } catch (e) {
    console.error("Invalid origin:", origin, e);
    return origin; // fallback
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const originPattern = message.origin ? toOriginPattern(message.origin) : null;

  switch (message.type) {
    case "REQUEST_COOKIE_PERMISSION":
      chrome.permissions.request(
        { permissions: ["cookies"], origins: [originPattern] },
        (granted) => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
          }
          if (granted) {
            if (!chrome.cookies.onChanged.hasListener(cookieListener)) {
              chrome.cookies.onChanged.addListener(cookieListener);
            }
          }
          sendResponse({ granted });
        }
      );
      return true;

    case "GET_COOKIES":
      chrome.cookies.getAll({ domain: message.domain }, (cookies) => {
        if (chrome.runtime.lastError) console.error(chrome.runtime.lastError);
        sendResponse({ cookies });
      });
      return true;

    case "CLEAR_COOKIES":
      chrome.cookies.getAll({ domain: message.domain }, (cookies) => {
        cookies.forEach((cookie) => {
          const url = (cookie.secure ? "https://" : "http://") + cookie.domain + cookie.path;
          chrome.cookies.remove({ url, name: cookie.name }, (res) => {
            if (chrome.runtime.lastError) console.error(chrome.runtime.lastError);
          });
        });
        sendResponse({ cleared: true });
      });
      return true;

    case "REVOKE_COOKIE_PERMISSION":
      chrome.permissions.remove(
        { permissions: ["cookies"], origins: [originPattern] },
        (removed) => {
          if (chrome.runtime.lastError) {
            console.error("Revoke failed:", chrome.runtime.lastError);
          }
          // Remove listener if revoke succeeded
          if (removed && chrome.cookies.onChanged.hasListener(cookieListener)) {
            chrome.cookies.onChanged.removeListener(cookieListener);
          }
          sendResponse({ removed });
        }
      );
      return true;

    default:
      sendResponse({ error: "Unknown message type" });
  }
});
