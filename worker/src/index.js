import { renderLivePage } from "./live.js";

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/live" || url.pathname === "/terminal") {
      return renderLivePage();
    }

    return new Response("Not found", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=UTF-8" },
    });
  },
};
