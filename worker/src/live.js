export function renderLivePage() {
  return new Response(TERMINAL_HTML, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}

const TERMINAL_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>shakhbozms@github:~$</title>
<style>
  :root {
    --bg: #0d1117;
    --fg: #e6edf3;
    --dim: #8b949e;
    --accent: #58a6ff;
    --green: #3fb950;
    --yellow: #d29922;
    --red: #f85149;
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    height: 100%;
    background: var(--bg);
    color: var(--fg);
    font-family: ui-monospace, "Cascadia Code", "SF Mono", Menlo, Consolas, monospace;
    font-size: 14px;
  }
  #term {
    max-width: 760px;
    margin: 0 auto;
    padding: 24px 20px 40px;
    min-height: 100%;
  }
  .titlebar {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 14px;
    color: var(--dim);
  }
  .dot { width: 11px; height: 11px; border-radius: 50%; display:inline-block; }
  .dot.r { background: #ff5f56; }
  .dot.y { background: #ffbd2e; }
  .dot.g { background: #27c93f; }
  #log { white-space: pre-wrap; word-break: break-word; line-height: 1.55; }
  .line-prompt { color: var(--green); }
  .path { color: var(--accent); }
  .cmd { color: var(--fg); }
  .dim { color: var(--dim); }
  .accent { color: var(--accent); }
  .yellow { color: var(--yellow); }
  .red { color: var(--red); }
  a { color: var(--accent); text-decoration: none; border-bottom: 1px dotted var(--accent); }
  a:hover { opacity: 0.8; }
  #inputRow { display: flex; align-items: center; margin-top: 4px; }
  #inputRow .prompt { color: var(--green); white-space: nowrap; }
  #inputRow .path { color: var(--accent); white-space: nowrap; margin-left: 2px; }
  #stdin {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: var(--fg);
    font: inherit;
    margin-left: 8px;
    caret-color: var(--fg);
  }
  ::selection { background: #264f78; }
  .hint { color: var(--dim); font-size: 12px; margin-top: 24px; }
</style>
</head>
<body>
<div id="term">
  <div class="titlebar">
    <span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>
    &nbsp;shakhbozms@github — 80×24
  </div>
  <div id="log"></div>
  <div id="inputRow">
    <span class="prompt">shakhbozms@github</span><span class="path">:~$</span>
    <input id="stdin" autocomplete="off" autocapitalize="off" spellcheck="false" autofocus />
  </div>
  <div class="hint">try: help · about · stack · projects · contact · stats · sudo hire-me</div>
</div>

<script>
const log = document.getElementById("log");
const stdin = document.getElementById("stdin");
const history = [];
let histPos = -1;

function print(html) {
  const div = document.createElement("div");
  div.innerHTML = html;
  log.appendChild(div);
  window.scrollTo(0, document.body.scrollHeight);
}

function promptLine(cmdText) {
  print('<span class="line-prompt">shakhbozms@github</span><span class="path">:~$</span> <span class="cmd">' + escapeHtml(cmdText) + '</span>');
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

const COMMANDS = {
  help() {
    return [
      "available commands:",
      "  about        who I am",
      "  stack        tech I build with",
      "  projects     shipped things (aka ls)",
      "  contact      how to reach me",
      "  stats        live GitHub stats (fetched right now)",
      "  resume       link to full background",
      "  clear        clear the screen",
      "  sudo hire-me ...",
    ].join("\\n");
  },
  about() {
    return [
      "Shahboz — product engineer, Tashkent, UZ.",
      "Working across product + engineering on <a href=\\"https://github.com/shakhbozmn\\" target=\\"_blank\\">Gnezdo</a>, a real-estate booking / PMS platform.",
      "Comfortable owning a feature end to end: spec, build, ship, monitor.",
    ].join("\\n");
  },
  stack() {
    return [
      "frontend:  React · React Native · Expo · Next.js",
      "backend:   Node.js · FeathersJS · MongoDB",
      "infra:     Docker · Traefik · Portainer · Grafana",
      "currently learning: Swift, Kotlin (going native)",
    ].join("\\n");
  },
  projects() {
    return [
      '<a href="https://github.com/shakhbozmn/feathers-board" target="_blank">feathers-board</a>          FeathersJS v5 playground',
      '<a href="https://github.com/shakhbozmn/4work" target="_blank">4work</a>                   two-sided portfolio marketplace (Next.js)',
      '<a href="https://github.com/shakhbozmn/scrap-fortress" target="_blank">scrap-fortress</a>          Unity tower defense',
      '<a href="https://github.com/shakhbozmn/flight-delay-prediction" target="_blank">flight-delay-prediction</a>  US flight-delay risk classifier',
    ].join("\\n");
  },
  ls() { return COMMANDS.projects(); },
  contact() {
    return [
      'telegram  <a href="https://t.me/shakhbozms" target="_blank">t.me/shakhbozms</a>   (fastest, ≤2h)',
      'email     <a href="mailto:shakhbozmn@gmail.com">shakhbozmn@gmail.com</a>',
      'linkedin  <a href="https://linkedin.com/in/shakhbozms" target="_blank">/in/shakhbozms</a>   (work stuff)',
      'website   <a href="https://shahbozms.uz" target="_blank">shahbozms.uz</a>   (long-form writeups)',
    ].join("\\n");
  },
  resume() {
    return 'full background → <a href="https://shahbozms.uz" target="_blank">shahbozms.uz</a>';
  },
  async stats() {
    print('<span class="dim">fetching live data from api.github.com...</span>');
    try {
      const res = await fetch("https://api.github.com/users/shakhbozmn");
      const remaining = res.headers.get("x-ratelimit-remaining");
      const resetHeader = res.headers.get("x-ratelimit-reset");

      if (res.status === 403 || res.status === 429) {
        const resetMsg = resetHeader
          ? " resets at " + new Date(parseInt(resetHeader, 10) * 1000).toLocaleTimeString()
          : "";
        return '<span class="red">rate-limited by GitHub (60 unauthenticated requests/hr, shared across your network).</span>' +
               (resetMsg ? '<br><span class="dim">' + resetMsg + '</span>' : "");
      }

      if (res.status === 404) {
        return '<span class="red">GitHub returned 404 — check the username in the stats command.</span>';
      }

      if (!res.ok) {
        return '<span class="red">GitHub API returned HTTP ' + res.status + ' (' + res.statusText + ').</span>';
      }

      const data = await res.json();
      return [
        "public_repos: " + data.public_repos,
        "followers:    " + data.followers,
        "following:     " + data.following,
        "profile created: " + new Date(data.created_at).toISOString().slice(0, 10),
        remaining ? '<span class="dim">(rate limit remaining: ' + remaining + '/60)</span>' : "",
      ].filter(Boolean).join("\\n");
    } catch (e) {
      return '<span class="red">network error reaching api.github.com: ' + escapeHtml(String(e.message || e)) + '</span>';
    }
  },
  clear() {
    log.innerHTML = "";
    return null;
  },
};

COMMANDS["sudo hire-me"] = () => [
  '<span class="yellow">[sudo] password for shakhbozms:</span>',
  "Nice try — no root access needed. Just use the <b>contact</b> command instead 🙂",
].join("\\n");

async function run(raw) {
  const cmdKey = raw.trim().toLowerCase();
  promptLine(raw);

  if (cmdKey === "") return;

  history.push(raw);
  histPos = history.length;

  const handler = COMMANDS[cmdKey];
  if (!handler) {
    print('<span class="red">command not found:</span> ' + escapeHtml(raw) + '  <span class="dim">(try "help")</span>');
    return;
  }

  const out = await handler();
  if (out !== null && out !== undefined) print(out);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function typeIntoInput(text) {
  for (let i = 0; i < text.length; i++) {
    stdin.value += text[i];
    await sleep(28 + Math.random() * 45);
  }
  await sleep(260);
}

let autoplaying = true;

const BOOT_SEQUENCE = ["whoami", "about", "stack", "projects"];

async function boot() {
  print('<span class="dim">connecting to shakhbozms@github ...</span>');
  await sleep(500);
  print('<span class="dim">autoplaying a quick tour — press any key to take over</span>');
  await sleep(700);

  for (const cmd of BOOT_SEQUENCE) {
    if (!autoplaying) break;
    await typeIntoInput(cmd);
    if (!autoplaying) break;
    const val = stdin.value;
    stdin.value = "";
    await run(val);
    await sleep(1100);
  }

  if (autoplaying) {
    print('<span class="dim">— tour complete. it\\'s your turn: try <span class="accent">contact</span>, <span class="accent">stats</span>, or <span class="accent">sudo hire-me</span> —</span>');
    autoplaying = false;
  }
  stdin.focus();
}

function interruptAutoplay() {
  if (autoplaying) {
    autoplaying = false;
    stdin.value = "";
    print('<span class="dim">— tour interrupted, you\\'ve got the wheel —</span>');
  }
}

stdin.addEventListener("keydown", async (e) => {
  if (autoplaying && e.key !== "Enter") interruptAutoplay();

  if (e.key === "Enter") {
    if (autoplaying) return;
    const val = stdin.value;
    stdin.value = "";
    await run(val);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    if (histPos > 0) { histPos--; stdin.value = history[histPos]; }
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    if (histPos < history.length - 1) { histPos++; stdin.value = history[histPos]; }
    else { histPos = history.length; stdin.value = ""; }
  }
});

document.addEventListener("click", () => stdin.focus());
document.addEventListener("keydown", () => stdin.focus());

boot();
</script>
</body>
</html>`;
