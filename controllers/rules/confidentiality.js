const { eq } = require("drizzle-orm");
const { db } = require("../../db/db");
const {
  confidentialityRules
} = require("../../db/schema/confidentialityRules");
const {
  formatConfidentialityRule,
  unformatConfidentialityRule,
  internalError
} = require("../../lib/rules");

async function getAllRules(_req, res, next) {
  try {
    const rawRules = await db.query.confidentialityRules.findMany();
    const rules = rawRules.map(formatConfidentialityRule);

    res.json(rules);
  } catch (e) {
    next(internalError("list", "confidentiality"));
  }
}

async function getRuleById(req, res, next) {
  try {
    const { id } = req.params;

    const rawRule = await db.query.confidentialityRules.findFirst({
      where: (rules, { eq }) => eq(rules.id, id)
    });

    if (!rawRule) {
      next({
        httpCode: 404,
        error: "not_found",
        errorMessage: "Confidentiality rule not found"
      });
    }

    const rule = formatConfidentialityRule(rawRule);

    res.json(rule);
  } catch (e) {
    next(internalError("get", "confidentiality"));
  }
}

async function createRule(req, res, next) {
  try {
    const newConfidentialityRule = unformatConfidentialityRule(req.body);
    await db.insert(confidentialityRules).values(newConfidentialityRule);

    res.json(req.body);
  } catch (e) {
    console.log("error", e);
    next(internalError("create", "confidentiality"));
  }
}

async function updateRule(req, res, next) {
  try {
    const { id } = req.params;
    const updatedConfidentialityRule = unformatConfidentialityRule({
      id,
      ...req.body
    });

    await db
      .update(confidentialityRules)
      .set(updatedConfidentialityRule)
      .where(eq(confidentialityRules.id, id));

    res.json(req.body);
  } catch (e) {
    next(internalError("update", "confidentiality"));
  }
}

async function deleteRule(req, res, next) {
  try {
    const { id } = req.params;

    await db
      .delete(confidentialityRules)
      .where(eq(confidentialityRules.id, id));

    res.json({
      id
    });
  } catch (e) {
    next(internalError("delete", "confidentiality"));
  }
}

module.exports = {
  getAllRules,
  getRuleById,
  createRule,
  updateRule,
  deleteRule
};
