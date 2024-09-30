const APIS_INTERNAL_ERROR = {
  list: (type) => `Error getting all ${type} rules`,
  get: (type) => `Error getting ${type} rule by id`,
  create: (type) => `Error creating ${type} rule`,
  update: (type) => `Error updating ${type} rule`,
  delete: (type) => `Error deleting ${type} rule`
};

function formatSensitivityRule(rawRule) {
  const { id, basis_system, basis_code, basis_display, labels, code_sets } =
    rawRule;
  return {
    id,
    basis: {
      system: basis_system,
      code: basis_code,
      display: basis_display
    },
    labels,
    codeSets: code_sets
  };
}

function unformatSensitivityRule(rule) {
  const { id, basis, labels, codeSets } = rule;
  const result = removeUndefinedProperties({
    id,
    basis_system: basis.system,
    basis_code: basis.code,
    basis_display: basis.display,
    labels,
    code_sets: codeSets
  });

  return result;
}

function formatConfidentialityRule(rawRule) {
  const { id, basis_system, basis_code, basis_display, labels, codes } =
    rawRule;
  return {
    id,
    basis: {
      system: basis_system,
      code: basis_code,
      display: basis_display
    },
    labels,
    codes
  };
}

function unformatConfidentialityRule(rule) {
  const { id, basis, labels, codes } = rule;
  const result = removeUndefinedProperties({
    id,
    basis_system: basis.system,
    basis_code: basis.code,
    basis_display: basis.display,
    labels,
    codes
  });

  return result;
}

function removeUndefinedProperties(obj) {
  Object.keys(obj).forEach((key) => {
    if (obj[key] === undefined) {
      delete obj[key];
    }
  });
  return obj;
}

function internalError(type, ruleType) {
  return {
    httpCode: 500,
    error: "internal_error",
    errorMessage: APIS_INTERNAL_ERROR[type](ruleType)
  };
}

module.exports = {
  formatSensitivityRule,
  unformatSensitivityRule,
  formatConfidentialityRule,
  unformatConfidentialityRule,
  internalError
};
