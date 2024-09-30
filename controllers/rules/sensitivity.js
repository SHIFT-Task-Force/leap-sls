const { eq } = require("drizzle-orm");
const { db } = require("../../db/db");
const { sensitivityRules } = require("../../db/schema/sensitivityRules");
const {
  formatSensitivityRule,
  unformatSensitivityRule,
  internalError
} = require("../../lib/rules");

async function getAllRules(_req, res, next) {
  try {
    const rawRules = await db.query.sensitivityRules.findMany();
    const rules = rawRules.map(formatSensitivityRule);

    res.json(rules);
  } catch (e) {
    next(internalError("list", "sensitivity"));
  }
}

async function getRuleById(req, res, next) {
  try {
    const { id } = req.params;

    const rawRule = await db.query.sensitivityRules.findFirst({
      where: (rules, { eq }) => eq(rules.id, id)
    });

    if (!rawRule) {
      next({
        httpCode: 404,
        error: "not_found",
        errorMessage: "Sensitivity rule not found"
      });
    }

    const rule = formatSensitivityRule(rawRule);

    res.json(rule);
  } catch (e) {
    next(internalError("get", "sensitivity"));
  }
}

async function createRule(req, res, next) {
  try {
    const newSensitiveRule = unformatSensitivityRule(req.body);
    await db.insert(sensitivityRules).values(newSensitiveRule);

    res.json(req.body);
  } catch (e) {
    next(internalError("create", "sensitivity"));
  }
}

async function updateRule(req, res, next) {
  try {
    const { id } = req.params;
    const updatedSensitiveRule = unformatSensitivityRule({
      id,
      ...req.body
    });

    await db
      .update(sensitivityRules)
      .set(updatedSensitiveRule)
      .where(eq(sensitivityRules.id, id));

    res.json({
      id,
      ...req.body
    });
  } catch (e) {
    next(internalError("update", "sensitivity"));
  }
}

async function deleteRule(req, res, next) {
  try {
    const { id } = req.params;

    await db.delete(sensitivityRules).where(eq(sensitivityRules.id, id));

    res.json({
      id
    });
  } catch (e) {
    next(internalError("delete", "sensitivity"));
  }
}

module.exports = {
  getAllRules,
  getRuleById,
  createRule,
  updateRule,
  deleteRule
};
