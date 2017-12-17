const _forEach = require("lodash/forEach");
const _isObject = require("lodash/isObject");
const _isFunction = require("lodash/isFunction");

/**
 * immutably set a value for a deep path
 *
 * @param {Object} state - app state
 * @param {String|Array} path - path to value
 * @param {*} value - new value
 * @returns {Object} updated state
 */
function setPath(state, path, value) {
  let pathArray = path;
  if (!Array.isArray(path)) {
    pathArray = path.split(".");
  }
  if (pathArray.length === 1) {
    return { ...state, [pathArray[0]]: value };
  }
  const next = pathArray.shift();
  return {
    ...state,
    [next]: setPath(state[next], pathArray, value)
  };
}

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

module.exports = { setPath, applyPatch };
