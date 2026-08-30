/**
 * widget.js — embeddable chat widget for Sez's AI agent.
 * Served automatically at https://<your-homesez-domain>/widget.js
 * because it lives in /public. No data-api needed — it calls /api/chat
 * on the same domain it's loaded from.
 */
(function () {
  var scriptTag = document.currentScript;
  var API_URL = (scriptTag && scriptTag.getAttribute("data-api")) || "/api/chat";

  var LAKE = "#344a57";
  var GOLD = "#c9a96e";
  var WHITE = "#ffffff";

  var history = []; // [{role, content}]
  var sessionId = (window.crypto && crypto.randomUUID)
    ? crypto.randomUUID()
    : "sez-" + Date.now() + "-" + Math.random().toString(36).slice(2);

  // ---- styles -------------------------------------------------------------
  var style = document.createElement("style");
  style.textContent = `
    #sez-chat-bubble {
      position: fixed; bottom: 24px; right: 24px; width: 62px; height: 62px;
      border-radius: 50%; background: ${LAKE}; box-shadow: 0 6px 20px rgba(0,0,0,.25);
      display: flex; align-items: center; justify-content: center; cursor: pointer;
      z-index: 999999; transition: transform .15s ease;
    }
    #sez-chat-bubble:hover { transform: scale(1.06); }
    #sez-chat-bubble svg { width: 28px; height: 28px; }
    #sez-chat-panel {
      position: fixed; bottom: 100px; right: 24px; width: 340px; max-width: 90vw;
      height: 460px; max-height: 70vh; background: ${WHITE}; border-radius: 14px;
      box-shadow: 0 12px 40px rgba(0,0,0,.3); display: none; flex-direction: column;
      overflow: hidden; z-index: 999999; font-family: Georgia, 'Times New Roman', serif;
    }
    #sez-chat-panel.open { display: flex; }
    #sez-chat-header {
      background: ${LAKE}; color: ${WHITE}; padding: 16px 18px; display: flex;
      flex-direction: column; gap: 2px;
    }
    #sez-chat-header .name { font-size: 15px; font-weight: 600; letter-spacing: .02em; }
    #sez-chat-header .tag { font-size: 11.5px; color: ${GOLD}; letter-spacing: .04em; text-transform: uppercase; }
    #sez-chat-messages {
      flex: 1; overflow-y: auto; padding: 14px; background: #faf9f7;
      display: flex; flex-direction: column; gap: 10px;
    }
    .sez-msg { max-width: 82%; padding: 9px 13px; border-radius: 12px; font-size: 13.5px; line-height: 1.45; }
    .sez-msg.bot { background: #eef1f3; color: #222; align-self: flex-start; border-bottom-left-radius: 3px; }
    .sez-msg.user { background: ${LAKE}; color: ${WHITE}; align-self: flex-end; border-bottom-right-radius: 3px; }
    .sez-msg.typing { background: #eef1f3; color: #888; align-self: flex-start; font-style: italic; }
    #sez-chat-inputrow { display: flex; border-top: 1px solid #e7e3dc; }
    #sez-chat-input {
      flex: 1; border: none; padding: 12px 14px; font-size: 13.5px; outline: none;
      font-family: inherit;
    }
    #sez-chat-send {
      background: ${LAKE}; color: ${WHITE}; border: none; padding: 0 18px;
      font-size: 13px; font-weight: 600; cursor: pointer; letter-spacing: .03em;
    }
    #sez-chat-send:hover { opacity: .92; }
  `;
  document.head.appendChild(style);

  // ---- bubble ---------------------------------------------------------------
  var bubble = document.createElement("div");
  bubble.id = "sez-chat-bubble";
  bubble.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M4 4h16v12H7l-3 3V4z" stroke="' + WHITE + '" stroke-width="1.6" stroke-linejoin="round"/>' +
    "</svg>";
  document.body.appendChild(bubble);

  // ---- panel ------------------------------------------------------------
  var panel = document.createElement("div");
  panel.id = "sez-chat-panel";
  panel.innerHTML =
    '<div id="sez-chat-header"><div class="name">Sez Sezer</div><div class="tag">Carmel Valley &middot; Del Mar &middot; Rancho Santa Fe</div></div>' +
    '<div id="sez-chat-messages"></div>' +
    '<div id="sez-chat-inputrow">' +
    '<input id="sez-chat-input" type="text" placeholder="Ask about a neighborhood, buying, or selling..." />' +
    '<button id="sez-chat-send">Send</button>' +
    "</div>";
  document.body.appendChild(panel);

  var messagesEl = panel.querySelector("#sez-chat-messages");
  var inputEl = panel.querySelector("#sez-chat-input");
  var sendBtn = panel.querySelector("#sez-chat-send");

  function addMessage(role, text) {
    var div = document.createElement("div");
    div.className = "sez-msg " + (role === "user" ? "user" : "bot");
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  var greeted = false;
  bubble.addEventListener("click", function () {
    panel.classList.toggle("open");
    if (panel.classList.contains("open") && !greeted) {
      greeted = true;
      addMessage(
        "bot",
        "Hi, I'm Sez's assistant. Ask me anything about Carmel Valley, Del Mar, or Rancho Santa Fe — or tell me what you're looking for and I'll get you connected with Sez."
      );
    }
  });

  async function sendMessage() {
    var text = inputEl.value.trim();
    if (!text) return;
    inputEl.value = "";
    addMessage("user", text);
    history.push({ role: "user", content: text });

    var typingEl = document.createElement("div");
    typingEl.className = "sez-msg typing";
    typingEl.textContent = "typing...";
    messagesEl.appendChild(typingEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    try {
      var res = await fetch(API_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: history,
          session_id: sessionId,
          page_url: window.location.href,
        }),
      });
      var data = await res.json();
      typingEl.remove();
      var reply = data.reply || "Sorry, something went wrong on my end — please try again in a moment.";
      addMessage("bot", reply);
      history.push({ role: "assistant", content: reply });
    } catch (e) {
      typingEl.remove();
      addMessage("bot", "Sorry, something went wrong on my end — please try again in a moment.");
    }
  }

  sendBtn.addEventListener("click", sendMessage);
  inputEl.addEventListener("keydown", function (e) {
    if (e.key === "Enter") sendMessage();
  });
})();
