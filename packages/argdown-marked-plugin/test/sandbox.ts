import "@argdown/web-components/style.css";
import "@argdown/web-components";
import { marked, MarkedOptions } from "marked";
import { addArgdownSupportToMarked } from "../src/argdown-marked-plugin";
const markedWithArgdown = addArgdownSupportToMarked(
  async (src: string, options?: MarkedOptions) =>
    await marked.parse(src, { ...(options || {}), async: true }),
  new marked.Renderer()
);
const initialInput = `
# Try out the new Markdown-Argdown Workflow!

Some *Markdown* **Text**

\`\`\`argdown-map
[s1]
   - <a1>
\`\`\`

Some more Markdown Text

\`\`\`argdown-map
===
webComponent:
    initialView: "source"
color:
    colorScheme: iwanthue-red-roses
===

[s1]
   - <a1>
   + <a2>
      - <a3>
\`\`\`

And a link to [Argdown](https://argdown.org).

\`\`\`argdown-map
[s1]
   - <a1>
      + <a4>
   + <a2>
      - <a3>
\`\`\`
`;
const updateOutput = async () => {
  const input = document.querySelector("textarea")!.value;
  const output = document.querySelector("#output")!;
  output.innerHTML = await markedWithArgdown(input);
};
document.querySelector("textarea")!.value = initialInput;
updateOutput();
document.querySelector("#submit")!.addEventListener("click", () => {
  updateOutput();
});
