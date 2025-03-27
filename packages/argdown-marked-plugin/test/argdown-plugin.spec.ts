import { expect } from "chai";
import {marked, MarkedOptions} from "marked";
import { addArgdownSupportToMarked } from "../src/argdown-marked-plugin";
import { describe, it } from "mocha";

describe("Marked Argdown Plugin", function() {
  const markedWithArgdown = addArgdownSupportToMarked(
    async (src: string, options?: MarkedOptions) => await marked.parse(src, { ...(options || {}), async: true }),
    new marked.Renderer()
  );
  this.timeout(5000);
  it("can replace code fences with argument maps", async function() {
    const result = await markedWithArgdown(`
# Markdown header

Some *Markdown* text before the Argdown code fences.

\`\`\`argdown-map
[s1]: text
    <- <a1>: text
\`\`\`

Some **Markdown** text after the Argdown code fences. And now another Argdown section: 

\`\`\`argdown-map
[s1]: text
    <- <a1>

<a1>

(1) asdds
(2) asdadasd
-----
(3) sadasd
\`\`\`
`);
    console.log(result);
    expect(result).to.contain(`<argdown-map `);
  });
});
