function flattenNodes(nodes, result = []) {
  for (const node of nodes || []) {
    result.push(node);
    if (node.children) flattenNodes(node.children, result);
  }
  return result;
}

function renderedElementId(group) {
  return group.id || group.querySelector("title")?.textContent || "";
}

function nodeType(node) {
  if (node.type === "argument-map-node") return "argument";
  if (node.type === "group-map-node") return "group";
  return node.discussionPointType || "statement";
}

function endpointId(endpoint) {
  return typeof endpoint === "string" ? endpoint : endpoint?.id;
}

export function decorateGraph(svg, map) {
  if (!svg || !map) return;
  const nodesById = new Map(
    flattenNodes(map.nodes).map((node) => [node.id, node])
  );

  for (const group of svg.querySelectorAll("g.node, g.cluster")) {
    const id = renderedElementId(group);
    const node = nodesById.get(id);
    if (!node) continue;
    group.dataset.mapElementKind = "node";
    group.dataset.mapElementId = node.id;
    group.setAttribute("role", "button");
    group.setAttribute("tabindex", "0");
    const type = nodeType(node);
    group.dataset.mapElementType = type;
    group.setAttribute(
      "aria-label",
      `${type}: ${node.labelTitle || node.title}`
    );
  }

  const edgesById = new Map((map.edges || []).map((edge) => [edge.id, edge]));
  const edgeGroups = svg.querySelectorAll("g.edgePath, g.edge");
  edgeGroups.forEach((group) => {
    const edge = edgesById.get(renderedElementId(group));
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
    group.dataset.mapElementType = edge.relationType;
    group.dataset.mapFromId = endpointId(edge.from) || "";
    group.dataset.mapToId = endpointId(edge.to) || "";
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

export function syncGraphFilters(svg, filters) {
  if (!svg) return;
  const nodeTypes = new Set(filters?.nodeTypes || []);
  const relationTypes = new Set(filters?.relationTypes || []);
  const matchingNodeIds = new Set();

  for (const group of svg.querySelectorAll('[data-map-element-kind="node"]')) {
    const matches =
      nodeTypes.size === 0 || nodeTypes.has(group.dataset.mapElementType);
    group.classList.toggle("graph-filtered-out", !matches);
    if (matches) matchingNodeIds.add(group.dataset.mapElementId);
  }

  for (const group of svg.querySelectorAll('[data-map-element-kind="edge"]')) {
    const matchesRelation =
      relationTypes.size === 0 ||
      relationTypes.has(group.dataset.mapElementType);
    const matchesNode =
      nodeTypes.size === 0 ||
      matchingNodeIds.has(group.dataset.mapFromId) ||
      matchingNodeIds.has(group.dataset.mapToId);
    group.classList.toggle(
      "graph-filtered-out",
      !matchesRelation || !matchesNode
    );
  }
}
