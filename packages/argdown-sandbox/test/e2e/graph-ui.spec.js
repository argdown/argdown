import { expect, test } from "playwright/test";

const syntaxCases = [
  {
    name: "Classic",
    syntax: "argdown",
    input: `[Conclusion]: The city should expand its tree canopy.
  +> [Reason]: Trees provide shade.`
  },
  {
    name: "Argdown+",
    syntax: "argdown+",
    input: `[?Question]: Should the city expand its tree canopy?

[Answer]: The city should expand its tree canopy.
  !> [?Question]
  <+ <Reason>

<Reason>: Trees provide shade.`
  },
  {
    name: "Micro-Argdown+",
    syntax: "micro-argdown+",
    input: `CONTEXT-FREE DEFINITIONS:
[?Question]: Should the city expand its tree canopy?
[Answer]: The city should expand its tree canopy.
<Reason>: Trees provide shade.

DISCOURSE TREE:
[?Question]
    <! [Answer]
        <+ <Reason>`
  }
];

async function setDocument(page, syntax, input) {
  await page.locator("#syntax-mode").selectOption(syntax);
  await page.locator(".CodeMirror").evaluate((wrapper, value) => {
    wrapper.CodeMirror.setValue(value);
  }, input);
  // The editor intentionally debounces store updates to avoid parsing on every
  // keystroke. Wait past that boundary before interacting with rendered SVG.
  await page.waitForTimeout(200);
  await expect(page.getByTitle("Open diagnostics")).toContainText("0 errors");
}

for (const syntaxCase of syntaxCases) {
  for (const renderer of ["dagre-d3", "viz-js"]) {
    test(`${syntaxCase.name} exposes stable graph ids in ${renderer}`, async ({
      page
    }) => {
      await page.goto(`map/${renderer}`);
      await setDocument(page, syntaxCase.syntax, syntaxCase.input);

      const output = page.locator(`.${renderer}-output`);
      const nodes = output.locator('[data-map-element-kind="node"]');
      const edges = output.locator('[data-map-element-kind="edge"]');
      await expect(nodes.first()).toBeVisible();
      await expect(edges.first()).toBeAttached();
      expect(await nodes.count()).toBeGreaterThan(1);

      for (const element of [nodes.first(), edges.first()]) {
        const ids = await element.evaluate((group) => ({
          rendered: group.id,
          model: group.dataset.mapElementId
        }));
        expect(ids.rendered).toBe(ids.model);
      }
    });
  }
}

test("selection, source navigation, filters, and renderer switching work together", async ({
  page
}) => {
  await page.goto("map/dagre-d3");
  await setDocument(
    page,
    "argdown",
    `<Reason>: Trees provide shade.
  +> [Claim]: The city should expand its tree canopy.

<Reason>
  +> [Claim]`
  );

  const dagre = page.locator(".dagre-d3-output");
  const node = dagre.locator('[data-map-element-kind="node"]').first();
  await node.focus();
  await page.keyboard.press("Enter");
  await expect(dagre.locator(".graph-inspector")).toBeVisible();

  const relation = dagre.locator('[data-map-element-kind="edge"]').first();
  await relation.focus();
  await page.keyboard.press("Space");
  await expect(dagre.locator(".occurrence-list button")).toHaveCount(2);
  await dagre.locator(".occurrence-list button").nth(1).click();
  expect(
    await page
      .locator(".CodeMirror")
      .evaluate((wrapper) => wrapper.CodeMirror.getCursor().line + 1)
  ).toBe(5);

  await dagre.locator(".graph-legend summary").click();
  const relationFilter = dagre
    .locator(".graph-legend .relations .legend-item")
    .first();
  await relationFilter.click();
  await expect(relationFilter).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("link", { name: "Viz Js Map" }).click();
  const viz = page.locator(".viz-js-output");
  await expect(viz.locator(".graph-inspector")).toBeVisible();
  await expect(viz.locator(".graph-selected")).toHaveCount(1);
  await viz.locator(".graph-legend summary").click();
  await expect(
    viz.locator(".graph-legend .relations .legend-item").first()
  ).toHaveAttribute("aria-pressed", "true");
});

test("parallel and symmetric relations remain separate in both renderers", async ({
  page
}) => {
  await page.goto("map/dagre-d3");
  await setDocument(
    page,
    "argdown+",
    `[A]: Alpha
  => [B]: Beta
  >< [B]`
  );

  for (const outputSelector of [".dagre-d3-output", ".viz-js-output"]) {
    const output = page.locator(outputSelector);
    const edges = output.locator('[data-map-element-kind="edge"]');
    await expect(edges).toHaveCount(2);
    const renderedEdges = await edges.evaluateAll((groups) =>
      groups.map((group) => ({
        id: group.id,
        modelId: group.dataset.mapElementId,
        type: group.dataset.mapElementType
      }))
    );
    expect(new Set(renderedEdges.map((edge) => edge.id)).size).toBe(2);
    expect(renderedEdges.every((edge) => edge.id === edge.modelId)).toBe(true);
    expect(new Set(renderedEdges.map((edge) => edge.type))).toEqual(
      new Set(["implies", "contradictory"])
    );

    if (outputSelector === ".dagre-d3-output") {
      await page.getByRole("link", { name: "Viz Js Map" }).click();
    }
  }
});

test("the inspector remains docked below the graph at 1024px", async ({
  page
}) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("map/viz-js");
  await setDocument(page, "argdown", syntaxCases[0].input);

  const output = page.locator(".viz-js-output");
  await output.locator('[data-map-element-kind="node"]').first().click();
  const contentBox = await output.locator(".content").boundingBox();
  const inspectorBox = await output.locator(".graph-tools").boundingBox();
  expect(contentBox).not.toBeNull();
  expect(inspectorBox).not.toBeNull();
  expect(inspectorBox.y).toBeGreaterThanOrEqual(
    contentBox.y + contentBox.height - 1
  );
  expect(inspectorBox.x + inspectorBox.width).toBeLessThanOrEqual(1024);

  const svgStrokeAllowance = 12;
  for (const node of await output
    .locator('[data-map-element-kind="node"]')
    .all()) {
    const nodeBox = await node.boundingBox();
    expect(nodeBox).not.toBeNull();
    expect(nodeBox.x).toBeGreaterThanOrEqual(contentBox.x - svgStrokeAllowance);
    expect(nodeBox.y).toBeGreaterThanOrEqual(contentBox.y - svgStrokeAllowance);
    expect(nodeBox.x + nodeBox.width).toBeLessThanOrEqual(
      contentBox.x + contentBox.width + svgStrokeAllowance
    );
    expect(nodeBox.y + nodeBox.height).toBeLessThanOrEqual(
      contentBox.y + contentBox.height + svgStrokeAllowance
    );
  }
});
