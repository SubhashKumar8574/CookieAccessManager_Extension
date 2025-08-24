// Prevent duplicate overlay injection
if (!document.getElementById("cookie-overlay")) {
  const overlay = document.createElement("div");
  overlay.id = "cookie-overlay";
  overlay.style.display = "none";
  document.body.appendChild(overlay);

  overlay.innerHTML = `
    <div id="overlay-box">
      <button id="close-overlay">&times;</button>
      <h3>Page Info</h3>
      <p><b>URL:</b> ${window.location.href}</p>
      <p><b>Domain:</b> ${window.location.hostname}</p>
      <p><b>HTTPS:</b> ${window.location.protocol === "https:" ? "Yes" : "No"}</p>

      <button id="cookie-btn">Grant Cookie Access</button>
      <button id="revoke-btn" style="display:none;">Revoke Access</button>

      <div id="cookie-list"></div>
    </div>
  `;

  // Close overlay
  document.getElementById("close-overlay").addEventListener("click", () => {
    overlay.style.display = "none";
  });

  // Listen to messages
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "TOGGLE_OVERLAY") {
      overlay.style.display = overlay.style.display === "none" ? "block" : "none";
    }
    if (message.type === "COOKIE_DATA") {
      updateCookieList(message.cookies);
    }
    if (message.type === "COOKIE_CHANGED") {
      fetchCookies();
    }
  });

  // Grant / Show / Hide Cookies button with toggle
  document.getElementById("cookie-btn").addEventListener("click", () => {
    const btn = document.getElementById("cookie-btn");
    const cookieList = document.getElementById("cookie-list");

    // First time: request permission
    if (btn.innerText === "Grant Cookie Access") {
      const origin = window.location.origin;
      chrome.runtime.sendMessage({ type: "REQUEST_COOKIE_PERMISSION", origin }, (response) => {
        if (response && response.granted) {
          btn.innerText = "Hide Cookies"; // default after grant
          document.getElementById("revoke-btn").style.display = "inline-block";
          fetchCookies();
        } else {
          btn.innerText = "Access Denied";
          btn.disabled = true;
        }
      });
      return;
    }

    // Toggle Show/Hide cookies
    if (btn.innerText === "Show Cookies") {
      fetchCookies();
      btn.innerText = "Hide Cookies";
    } else if (btn.innerText === "Hide Cookies") {
      cookieList.innerHTML = "<p>Cookies hidden.</p>"; // hide message
      btn.innerText = "Show Cookies";
    }
  });

  // Revoke Cookies button
  document.getElementById("revoke-btn").addEventListener("click", () => {
    const origin = window.location.origin;
    chrome.runtime.sendMessage({ type: "REVOKE_COOKIE_PERMISSION", origin }, (res) => {
      const btn = document.getElementById("cookie-btn");
      btn.innerText = "Grant Cookie Access";
      btn.disabled = false;
      document.getElementById("revoke-btn").style.display = "none";

      // Show "No cookies found" when revoked
      document.getElementById("cookie-list").innerHTML = "<p>No cookies found.</p>";

      if (!res.removed) {
        console.warn("Permission revoke may have failed:", res);
      }
    });
  });

  // Fetch cookies from background
  function fetchCookies() {
    const domain = window.location.hostname;
    chrome.runtime.sendMessage({ type: "GET_COOKIES", domain }, (res) => {
      updateCookieList(res.cookies);
    });
  }

  // Update cookie list UI
  function updateCookieList(cookies) {
    const list = document.getElementById("cookie-list");
    if (!cookies || cookies.length === 0) {
      list.innerHTML = "<p>Cookies hidden.</p>"; // default empty after hide
      return;
    }
    list.innerHTML =
      "<h4>Cookies:</h4><ul>" +
      cookies.map((c) => `<li><b>${c.name}</b>=${c.value}</li>`).join("") +
      "</ul>";
  }

  // Notify popup.js that content.js is ready
  chrome.runtime.sendMessage({ type: "CONTENT_READY" });
}
