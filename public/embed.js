(function () {
  "use strict";

  var script = document.currentScript;
  if (!script) return;

  var token = script.getAttribute("data-token");
  if (!token) {
    console.error("[ShopFlow] Missing data-token attribute");
    return;
  }

  var origin = script.src.replace(/\/embed\.js.*$/, "");
  var widgetOpen = false;
  var conversationId = null;
  var sessionEmail = null;

  // --- Styles ---
  var css = document.createElement("style");
  css.textContent =
    "#sf-btn{position:fixed;bottom:24px;right:24px;z-index:99999;width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(37,99,235,.4);transition:transform .2s}" +
    "#sf-btn:hover{transform:scale(1.08)}" +
    "#sf-win{position:fixed;bottom:96px;right:24px;z-index:99999;width:380px;height:520px;border-radius:16px;overflow:hidden;display:none;flex-direction:column;background:#fff;box-shadow:0 8px 32px rgba(0,0,0,.18);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}" +
    "#sf-win.open{display:flex}" +
    "#sf-hdr{background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;padding:16px;font-size:15px;font-weight:600}" +
    "#sf-hdr small{display:block;font-size:11px;opacity:.8;margin-top:2px;font-weight:400}" +
    "#sf-msgs{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px}" +
    ".sf-msg{max-width:80%;padding:10px 14px;border-radius:14px;font-size:13px;line-height:1.4;word-wrap:break-word}" +
    ".sf-msg.ai{background:#f1f5f9;color:#1e293b;align-self:flex-start;border-bottom-left-radius:4px}" +
    ".sf-msg.user{background:#2563eb;color:#fff;align-self:flex-end;border-bottom-right-radius:4px}" +
    "#sf-form{display:flex;border-top:1px solid #e2e8f0;padding:8px}" +
    "#sf-inp{flex:1;border:none;outline:none;padding:10px 12px;font-size:13px;background:transparent}" +
    "#sf-send{background:#2563eb;color:#fff;border:none;padding:0 16px;cursor:pointer;font-size:14px;font-weight:600;border-radius:0 0 12px 0}" +
    "#sf-email-gate{padding:24px;display:flex;flex-direction:column;gap:12px;align-items:center;justify-content:center;flex:1}" +
    "#sf-email-gate h4{margin:0;font-size:16px;color:#1e293b}" +
    "#sf-email-gate p{margin:0;font-size:13px;color:#64748b;text-align:center}" +
    "#sf-email-gate input{width:100%;padding:10px 12px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;outline:none}" +
    "#sf-email-gate input:focus{border-color:#2563eb}" +
    "#sf-email-gate button{width:100%;padding:10px;background:#2563eb;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer}";
  document.head.appendChild(css);

  // --- Toggle Button ---
  var btn = document.createElement("button");
  btn.id = "sf-btn";
  btn.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  btn.onclick = function () {
    widgetOpen = !widgetOpen;
    win.classList.toggle("open", widgetOpen);
  };
  document.body.appendChild(btn);

  // --- Chat Window ---
  var win = document.createElement("div");
  win.id = "sf-win";

  var hdr = document.createElement("div");
  hdr.id = "sf-hdr";
  hdr.innerHTML = "ShopFlow Support<small>Ask us anything about our products</small>";
  win.appendChild(hdr);

  // Email gate
  var gate = document.createElement("div");
  gate.id = "sf-email-gate";
  gate.innerHTML =
    "<h4>Welcome!</h4><p>Enter your email to start chatting with our AI assistant.</p>" +
    '<input id="sf-email-inp" type="email" placeholder="your@email.com" />' +
    "<button id=\"sf-email-btn\">Start Chat</button>";
  win.appendChild(gate);

  var msgsDiv = document.createElement("div");
  msgsDiv.id = "sf-msgs";
  msgsDiv.style.display = "none";
  win.appendChild(msgsDiv);

  var form = document.createElement("form");
  form.id = "sf-form";
  form.style.display = "none";
  form.innerHTML = '<input id="sf-inp" placeholder="Type a message..." autocomplete="off" /><button id="sf-send" type="submit">Send</button>';
  win.appendChild(form);

  document.body.appendChild(win);

  // Email gate handler
  gate.querySelector("#sf-email-btn").onclick = function () {
    var emailInp = gate.querySelector("#sf-email-inp");
    var email = (emailInp.value || "").trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      emailInp.style.borderColor = "#ef4444";
      return;
    }
    sessionEmail = email;
    gate.style.display = "none";
    msgsDiv.style.display = "flex";
    form.style.display = "flex";
    addMsg("ai", "Hi! I'm the AI assistant. How can I help you today?");
  };

  function addMsg(role, text) {
    var el = document.createElement("div");
    el.className = "sf-msg " + role;
    el.textContent = text;
    msgsDiv.appendChild(el);
    msgsDiv.scrollTop = msgsDiv.scrollHeight;
  }

  form.onsubmit = function (e) {
    e.preventDefault();
    var inp = form.querySelector("#sf-inp");
    var text = (inp.value || "").trim();
    if (!text) return;
    inp.value = "";
    addMsg("user", text);

    fetch(origin + "/api/plugin/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: token,
        email: sessionEmail,
        message: text,
        conversationId: conversationId,
      }),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.conversationId) conversationId = data.conversationId;
        addMsg("ai", data.reply || "Sorry, something went wrong.");
      })
      .catch(function () {
        addMsg("ai", "Connection error. Please try again.");
      });
  };
})();
