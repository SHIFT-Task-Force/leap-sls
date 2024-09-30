const { JSONPath } = require("jsonpath-plus");
const { removeRedundantCodes, codesShortHand } = require("../codes");
const BASE_SENSITIVITY_RULES = require("./sensitivity-rules.json");
const BASE_CONFIDENTIALITY_RULES = require("./confidentiality-rules.json");
const { db } = require("../../db/db");
const {
  formatSensitivityRule,
  formatConfidentialityRule
} = require("../rules");

const DEV_SENSITIVITY_RULES = [
  ...BASE_SENSITIVITY_RULES,
  ...JSON.parse(process.env.SENSITIVITY_TAGGING_RULES || "[]")
];

const DEV_CONFIDENTIALITY_RULES = [
  ...BASE_CONFIDENTIALITY_RULES,
  ...JSON.parse(process.env.CONFIDENTIALITY_TAGGING_RULES || "[]")
];

const labelBundle = async (bundle) => ({
  ...bundle,
  entry: await Promise.all(
    bundle.entry.map(async (entry) => ({
      ...entry,
      resource: sanitizeResource(await labelResource(entry.resource))
    }))
  )
});

/**
 * remove the 'updated' attribute used to track which resources were update in the course of labeling.
 */
function sanitizeResource(resource) {
  const { updated, ...rest } = resource;
  return rest;
}

const labelBundleDiff = async (bundle) =>
  await Promise.all(
    bundle.entry
      .map(async ({ resource }) => await labelResource(resource))
      .filter((resource) => resource.updated)
      .map((resource) => sanitizeResource(resource))
  );

const labelResource = async (resource) =>
  await labelResourceConfidentiality(await labelResourceSensitivity(resource));

async function labelResourceConfidentiality(resource) {
  const sensitivityLabels = codesShortHand(resource.meta?.security || []);
  const CONFIDENTIALITY_RULES =
    process.env.NODE_ENV === "production"
      ? [
          ...BASE_CONFIDENTIALITY_RULES,
          ...(await db.query.confidentialityRules.findMany()).map(
            formatConfidentialityRule
          )
        ]
      : DEV_CONFIDENTIALITY_RULES;
  const applicableRules = CONFIDENTIALITY_RULES.filter((rule) =>
    rule.codes.some((code) => sensitivityLabels.includes(code))
  );
  const labels = applicableRules
    .map(({ labels, basis }) =>
      labels.map((label) => ({
        ...label,
        ...(basis && { extension: basisExtension(basis) })
      }))
    )
    .flat();
  return addUniqueLabelsToResource(
    { ...resource, updated: applicableRules.length > 0 },
    labels
  );
}

function addUniqueLabelsToResource(resource, labels) {
  const existingLabels = resource.meta?.security || [];
  const allLabels = removeRedundantCodes([...labels, ...existingLabels]);
  return {
    ...resource,
    meta: {
      ...(resource.meta || {}),
      security: allLabels
    }
  };
}

async function applicableSensitivityRules(resource) {
  const clinicalCodes = JSONPath({ path: "$..coding", json: resource }).flat();
  const canonicalCodes = codesShortHand(clinicalCodes);
  const SENSITIVITY_RULES =
    process.env.NODE_ENV === "production"
      ? [
          ...BASE_SENSITIVITY_RULES,
          ...(await db.query.sensitivityRules.findMany()).map(
            formatSensitivityRule
          )
        ]
      : DEV_SENSITIVITY_RULES;
  return SENSITIVITY_RULES.map((rule) => ({
    ...rule,
    codeSets: rule.codeSets.filter(({ codes }) =>
      codes.some((code) => canonicalCodes.includes(code))
    )
  })).filter(({ codeSets }) => codeSets.length > 0);
}

async function labelResourceSensitivity(resource) {
  const applicableRules = await applicableSensitivityRules(resource);
  const labels = applicableRules
    .map(({ id, basis, labels, codeSets }) =>
      labels.map((label) => ({
        ...label,
        ...{
          extension: [
            ...basisExtension(basis),
            ...codeSets
              .map(({ groupId }) =>
                basisExtension({ system: id, code: groupId })
              )
              .flat()
          ]
        }
      }))
    )
    .flat();
  return addUniqueLabelsToResource(
    { ...resource, updated: applicableRules.length > 0 },
    labels
  );
}

const SEC_LABEL_BASIS_URL =
  "http://hl7.org/fhir/uv/security-label-ds4p/StructureDefinition/extension-sec-label-basis";

const basisExtension = (basisCoding) =>
  basisCoding
    ? [
        {
          url: SEC_LABEL_BASIS_URL,
          valueCoding: basisCoding
        }
      ]
    : [];

const label = async (object) =>
  object?.resourceType === "Bundle"
    ? await labelBundle(object)
    : sanitizeResource(await labelResource(object));

module.exports = {
  labelBundle,
  labelBundleDiff,
  label
};
