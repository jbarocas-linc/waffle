import type { GridRecord } from "../types";

/**
 * Built-in demo grid, always available at /g/demo. Exercises every tile type
 * plus an empty cell (index 5) so the rubber-band and map read correctly.
 */
export const demoGrid: GridRecord = {
  id: "demo",
  viewId: "demo",
  editToken: "demo-not-editable",
  title: "Wait Time: The 3-Second Upgrade",
  description: "One tiny teaching move that changes who talks in your classroom — and how much they think first.",
  size: 3,
  startCell: 4,
  rowLabels: ["The idea", "In practice", "Go deeper"],
  colLabels: ["Big picture", "Detail", "Resources"],
  cells: [
    // Row 0 — the idea
    {
      type: "text",
      title: "What is wait time?",
      body: "After you ask a question, pause. Three full seconds before anyone answers — including you.\n\nMost teachers wait less than one second. That single second decides who gets to think.",
      bg: { kind: "color", value: "#F6EEDF" },
    },
    {
      type: "image",
      src: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1400&q=80",
      alt: "A classroom of students with hands raised",
      caption: "The fastest hand isn't always the deepest thought.",
    },
    {
      type: "video",
      source: "youtube",
      url: "https://www.youtube.com/watch?v=SFnMTHhKdkw",
      caption: "Rita Pierson — every kid needs a champion (7 min)",
    },
    // Row 1 — in practice
    {
      type: "text",
      title: "Why it works",
      body: "Longer answers — students say more, and in complete thoughts.\n\nMore voices — quieter students enter the conversation.\n\nBetter questions — you ask fewer, sharper ones.",
      bg: { kind: "gradient", from: "#F1D9A7", to: "#DE8B5F", angle: 150 },
    },
    {
      type: "text",
      title: "Wait Time",
      body: "A 90-second tour of one of the most researched moves in teaching.\n\nSwipe in any direction to explore.",
      bg: { kind: "gradient", from: "#2E4036", to: "#1E2A22", angle: 165 },
    },
    null, // deliberately empty — demos the rubber-band and the map's darker cell
    // Row 2 — go deeper
    {
      type: "link",
      url: "https://www.edutopia.org/search?query=wait%20time",
      title: "Wait time on Edutopia",
      description: "Research summaries and classroom stories about slowing the question-answer rhythm.",
      buttonLabel: "Read more",
    },
    {
      type: "file",
      src: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      filename: "wait-time-one-pager.pdf",
      label: "Download the one-pager",
      sizeBytes: 13264,
    },
    {
      type: "embed",
      source: "snippet",
      label: "Try it: a 3-second timer",
      html: `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>
        body{margin:0;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;background:#26222F;color:#FAF6EE;font-family:Georgia,serif;text-align:center}
        h1{font-size:22px;font-weight:600;max-width:26ch;line-height:1.3;margin:0 24px}
        button{font-size:18px;padding:14px 28px;border-radius:999px;border:0;background:#EE9E31;color:#2B211A;font-weight:700;cursor:pointer;font-family:inherit}
        #count{font-size:72px;font-variant-numeric:tabular-nums;min-height:88px}
      </style></head><body>
        <h1>How long is three seconds of silence, really?</h1>
        <div id="count"></div>
        <button id="go">Ask your question</button>
        <script>
          const count=document.getElementById('count'),go=document.getElementById('go');
          go.addEventListener('click',()=>{let n=3;go.disabled=true;count.textContent=n;
            const t=setInterval(()=>{n--;if(n>0){count.textContent=n}else{clearInterval(t);count.textContent='✓';go.textContent='Feel long? That\\'s the point.';go.disabled=false}},1000)});
        <\/script>
      </body></html>`,
    },
  ],
  coverUrl: null,
  published: true,
  createdAt: "2026-07-01T12:00:00.000Z",
  updatedAt: "2026-07-01T12:00:00.000Z",
};
