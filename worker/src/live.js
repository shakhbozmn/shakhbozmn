import { PROMPT, RESPONSE_LINES, TIME_ZONE, THEMES } from "./clock.js";

const PAGE_TITLE = "shakhbozmn — live card";

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function styleFor(theme) {
  return `:root {
    color-scheme: ${theme.bg === "#0d1117" ? "dark" : "light"};
    --bg: ${theme.bg};
    --surface: ${theme.surface};
    --border: ${theme.border};
    --fg: ${theme.fg};
    --dim: ${theme.dim};
    --accent: ${theme.accent};
    --prompt: ${theme.prompt};
    --response: ${theme.response};
  }`;
}

export function renderLivePage(themeName = "light") {
  const theme = THEMES[themeName] || THEMES.light;
  const prompt = escapeHtml(PROMPT);
  const responseLines = RESPONSE_LINES.map(escapeHtml);
  const timezone = escapeHtml(TIME_ZONE);
  const jsonTimeZone = JSON.stringify(TIME_ZONE);
  const jsonLines = JSON.stringify(RESPONSE_LINES);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(PAGE_TITLE)}</title>
    <meta name="description" content="Live card with terminal and Asia/Tashkent clock" />
    <style>${styleFor(theme)}
      html, body { margin: 0; padding: 0; background: var(--bg); color: var(--fg); font-family: ui-monospace, Menlo, monospace; }
      .wrap { max-width: 760px; margin: 0 auto; padding: 24px; }
      .card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 22px; }
      .label { color: var(--dim); font-size: 13px; margin-bottom: 6px; }
      .terminal-header { color: var(--accent); font-size: 14px; font-weight: 600; }
      .prompt { color: var(--prompt); font-size: 16px; margin: 6px 0 2px; }
      .response { color: var(--response); font-size: 14px; line-height: 1.55; min-height: 1.55em; white-space: pre-wrap; }
      .cursor { display: inline-block; width: 8px; background: var(--accent); animation: blink 1s steps(2) infinite; margin-left: 2px; }
      @keyframes blink { 50% { opacity: 0; } }
      .divider { border: 0; border-top: 1px solid var(--border); margin: 18px 0; }
      .clock { font-size: 26px; font-weight: 600; }
      .meta { color: var(--accent); font-size: 13px; margin-top: 4px; }
      .tz { color: var(--dim); font-size: 13px; }
      .controls { margin-top: 16px; display: flex; gap: 8px; }
      .controls a, .controls button { background: var(--surface); color: var(--fg); border: 1px solid var(--border); border-radius: 8px; padding: 6px 12px; font-family: inherit; font-size: 13px; cursor: pointer; text-decoration: none; }
      .controls a:hover, .controls button:hover { border-color: var(--accent); color: var(--accent); }
      pre.terminal { background: var(--bg); border: 1px solid var(--border); border-radius: 8px; padding: 12px; overflow-x: auto; font-size: 13px; line-height: 1.5; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card" id="card">
        <div class="label">$ date --time-zone "${timezone}"</div>
        <div class="terminal-header">shakhbozmn@portfolio</div>
        <div class="prompt" id="prompt">${prompt}</div>
        <div class="response" id="line-0"></div>
        <div class="response" id="line-1"></div>
        <div class="response" id="line-2"></div>
        <hr class="divider" />
        <div class="clock" id="clock" aria-live="polite">--:--:--</div>
        <div class="meta" id="meta">-- · Tashkent, UZ</div>
        <div class="tz">open for collaboration · tap card to replay terminal</div>
        <div class="controls">
          <button type="button" id="replay" aria-label="Replay terminal animation">Replay terminal</button>
          <a href="/card?theme=${escapeHtml(themeName)}" aria-label="Open combined card SVG">Card SVG</a>
        </div>
        <pre class="terminal" aria-label="Raw prompt and lines">${escapeHtml(PROMPT + "  " + RESPONSE_LINES.join("  "))}</pre>
      </div>
    </div>
    <script>
      (function () {
        var timeZone = ${jsonTimeZone};
        var lines = ${jsonLines};

        function start() {
          var cursor = document.createElement('span');
          cursor.className = 'cursor';
          cursor.setAttribute('aria-hidden', 'true');
          document.getElementById('prompt').appendChild(cursor);
        }

        function clearLines() {
          for (var i = 0; i < lines.length; i++) {
            document.getElementById('line-' + i).textContent = '';
          }
        }

        function typeLine(index) {
          return new Promise(function (resolve) {
            var text = lines[index];
            var el = document.getElementById('line-' + index);
            var j = 0;
            var timer = setInterval(function () {
              j++;
              el.textContent = text.slice(0, j);
              if (j >= text.length) {
                clearInterval(timer);
                resolve();
              }
            }, 18);
          });
        }

        function typeAll() {
          var chain = Promise.resolve();
          for (var i = 0; i < lines.length; i++) {
            (function (idx) {
              chain = chain.then(function () { return typeLine(idx); });
            })(i);
          }
          return chain;
        }

        function updateClock() {
          var now = new Date();
          var fmt = new Intl.DateTimeFormat('en-GB', {
            timeZone: timeZone,
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
          });
          var parts = {};
          fmt.formatToParts(now).forEach(function (p) {
            if (p.type !== 'literal') parts[p.type] = p.value;
          });
          var weekday = new Intl.DateTimeFormat('en-US', { timeZone: timeZone, weekday: 'short' }).format(now);
          document.getElementById('clock').textContent = parts.year + '-' + parts.month + '-' + parts.day + '  ' + parts.hour + ':' + parts.minute + ':' + parts.second;
          document.getElementById('meta').textContent = weekday + ' · Tashkent, UZ · open for collaboration';
        }

        start();
        typeAll();
        updateClock();
        setInterval(updateClock, 1000);

        document.getElementById('replay').addEventListener('click', function () {
          clearLines();
          typeAll();
        });

        document.getElementById('card').addEventListener('click', function (event) {
          if (event.target.tagName === 'A' || event.target.tagName === 'BUTTON') return;
          clearLines();
          typeAll();
        });
      })();
    </script>
  </body>
</html>`;
}
