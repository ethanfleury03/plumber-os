// Put this Code node after each Blog Creation node before the Merge node.
// Change DRAFT_NUMBER to 1, 2, or 3 for each branch.
// Change MODEL_NAME to the model used by that branch.

const DRAFT_NUMBER = 1;
const MODEL_NAME = "model-name-here";

const source = $("Pick Today's Row").first().json;
const item = $input.first() || { json: {} };
const json = item.json || {};

const rawDraft =
  json.output ||
  json.text ||
  json.content ||
  json.message?.content ||
  json.choices?.[0]?.message?.content ||
  JSON.stringify(json);

return [
  {
    json: {
      ...source,
      [`draft_${DRAFT_NUMBER}`]: JSON.stringify(
        {
          model: MODEL_NAME,
          draft: rawDraft,
        },
        null,
        2,
      ),
    },
  },
];
