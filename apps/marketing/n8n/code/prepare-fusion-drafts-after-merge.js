// Put this Code node immediately after the Merge node that combines the
// three Blog Creation branches by position.
//
// Update BLOG_DRAFT_NODES if your node names are different.

const BLOG_DRAFT_NODES = [
  { field: "draft_1", model: "Blog Creation 1", nodeName: "Blog Creation1" },
  { field: "draft_2", model: "Blog Creation 2", nodeName: "Blog Creation" },
  { field: "draft_3", model: "Blog Creation 3", nodeName: "Blog Creation2" },
];

const source = $("Pick Today's Row").first().json;

function extractDraftText(json) {
  const content =
    json.output ||
    json.text ||
    json.content ||
    json.response ||
    json.message?.content ||
    json.choices?.[0]?.message?.content ||
    json.data?.choices?.[0]?.message?.content ||
    "";

  if (content) {
    return typeof content === "string" ? content : JSON.stringify(content, null, 2);
  }

  return JSON.stringify(json, null, 2);
}

function getNodeJson(nodeName) {
  try {
    return $(nodeName).first().json || {};
  } catch (error) {
    throw new Error(`Could not read "${nodeName}". Check the node name in BLOG_DRAFT_NODES.`);
  }
}

const drafts = {};

for (const draftNode of BLOG_DRAFT_NODES) {
  const nodeJson = getNodeJson(draftNode.nodeName);
  const draftText = extractDraftText(nodeJson);

  drafts[draftNode.field] = JSON.stringify(
    {
      model: draftNode.model,
      node_name: draftNode.nodeName,
      draft: draftText,
    },
    null,
    2,
  );
}

return [
  {
    json: {
      ...source,
      ...drafts,
    },
  },
];
