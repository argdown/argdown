import "@argdown/web-components";
import "@argdown/web-components/style.css";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import { remark } from "remark";
import remarkRehype from "remark-rehype";
import { remarkArgdownPlugin } from "../src/argdown-remark-plugin";

const rm = remark()
  .use(remarkArgdownPlugin, {
    argdownConfig: {
      webComponent: {
        // withoutHeader: true
      }
    }
  })
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeStringify);

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
  rm.process(input, (e, f) => {
    if (e) {
      console.log(e);
    } else {
      output.innerHTML = String(f);
    }
  });
};
document.querySelector("textarea")!.value = initialInput;
updateOutput();
document.querySelector("#submit")?.addEventListener("click", () => {
  updateOutput();
});
