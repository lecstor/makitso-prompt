const _forEach = require("lodash/forEach");
const _isObject = require("lodash/isObject");
const _isFunction = require("lodash/isFunction");

/**
 * immutably patch an object
 *
 * @param {Object} state - app state
 * @param {Object} patch - patch to apply
 * @returns {Object} updated state
 */
function applyPatch(state, patch) {
  _forEach(patch, (value, key) => {
    if (_isObject(value) && !_isFunction(value) && !Array.isArray(value)) {
      if (state[key]) {
        state = { ...state, [key]: applyPatch(state[key], value) };
      } else {
        state[key] = value;
      }
    } else {
      state = { ...state, [key]: value };
    }
  });
  return { ...state };
}

module.exports = { applyPatch };
