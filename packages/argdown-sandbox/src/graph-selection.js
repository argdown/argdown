function flattenNodes(nodes, result = []) {
  for (const node of nodes || []) {
    result.push(node);
    if (node.children) flattenNodes(node.children, result);
  }
  return result;
}

export function decorateGraph(svg, map, getNodeId) {
  if (!svg || !map) return;
  const nodesById = new Map(
    flattenNodes(map.nodes).map((node) => [node.id, node])
  );

  for (const group of svg.querySelectorAll("g.node")) {
    const id = getNodeId(group);
    const node = nodesById.get(id);
    if (!node) continue;
    group.dataset.mapElementKind = "node";
    group.dataset.mapElementId = node.id;
    group.setAttribute("role", "button");
    group.setAttribute("tabindex", "0");
    const nodeType =
      node.type === "argument-map-node"
        ? "argument"
        : node.type === "group-map-node"
          ? "group"
          : node.discussionPointType || "statement";
    group.setAttribute(
      "aria-label",
      `${nodeType}: ${node.labelTitle || node.title}`
    );
  }

  const edgeGroups = svg.querySelectorAll("g.edgePath, g.edge");
  edgeGroups.forEach((group, index) => {
    const edge = map.edges[index];
    if (!edge) return;
    const path = group.querySelector("path");
    if (path && !group.querySelector(".edge-hit-target")) {
      const hitTarget = path.cloneNode(false);
      hitTarget.removeAttribute("id");
      hitTarget.removeAttribute("marker-start");
      hitTarget.removeAttribute("marker-end");
      hitTarget.removeAttribute("style");
      hitTarget.setAttribute("class", "edge-hit-target");
      hitTarget.setAttribute("aria-hidden", "true");
      path.parentNode.insertBefore(hitTarget, path);
    }
    group.dataset.mapElementKind = "edge";
    group.dataset.mapElementId = edge.id;
    group.setAttribute("role", "button");
    group.setAttribute("tabindex", "0");
    group.setAttribute(
      "aria-label",
      `${edge.relationType}: ${edge.from.title} to ${edge.to.title}`
    );
  });
}

export function selectionFromEvent(event) {
  const target = event.target;
  if (!(target instanceof Element)) return null;
  const group = target.closest("[data-map-element-kind]");
  if (!group) return null;
  return {
    kind: group.dataset.mapElementKind,
    id: group.dataset.mapElementId
  };
}

export function syncGraphSelection(svg, selection) {
  if (!svg) return;
  for (const group of svg.querySelectorAll(".graph-selected")) {
    group.classList.remove("graph-selected");
  }
  if (!selection) return;
  const group = [...svg.querySelectorAll("[data-map-element-kind]")].find(
    (item) =>
      item.dataset.mapElementKind === selection.kind &&
      item.dataset.mapElementId === selection.id
  );
  group?.classList.add("graph-selected");
}
