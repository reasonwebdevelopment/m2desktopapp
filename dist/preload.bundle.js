/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./preload.js":
/*!********************!*\
  !*** ./preload.js ***!
  \********************/
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

eval("var _require = __webpack_require__(/*! electron */ \"electron\"),\n  contextBridge = _require.contextBridge,\n  ipcRenderer = _require.ipcRenderer;\nwindow.addEventListener('DOMContentLoaded', function () {\n  var replaceText = function replaceText(selector, text) {\n    var element = document.getElementById(selector);\n    if (element) element.innerText = text;\n  };\n  for (var _i = 0, _arr = ['chrome', 'node', 'electron']; _i < _arr.length; _i++) {\n    var dependency = _arr[_i];\n    replaceText(\"\".concat(dependency, \"-version\"), process.versions[dependency]);\n  }\n});\ncontextBridge.exposeInMainWorld('versions', {\n  node: function node() {\n    return process.versions.node;\n  },\n  chrome: function chrome() {\n    return process.versions.chrome;\n  },\n  electron: function electron() {\n    return process.versions.electron;\n  },\n  checkVastgoedmarkt: function checkVastgoedmarkt() {\n    return ipcRenderer.invoke('checkVastgoedmarkt');\n  },\n  checkPropertyNL: function checkPropertyNL() {\n    return ipcRenderer.invoke('checkPropertyNL');\n  }\n  // we can also expose variables, not just functions\n});\nvar fs = __webpack_require__(/*! fs */ \"fs\");\ncontextBridge.exposeInMainWorld('electronFs', {\n  readFileSync: fs.readFileSync,\n  existsSync: fs.existsSync,\n  readdirSync: fs.readdirSync,\n  statSync: fs.statSync,\n  isDirectory: function isDirectory(url) {\n    return fs.statSync(url).isDirectory();\n  }\n});\nvar os = __webpack_require__(/*! os */ \"os\");\ncontextBridge.exposeInMainWorld('electronOs', {\n  homedir: os.homedir\n});\nvar path = __webpack_require__(/*! path */ \"path\");\ncontextBridge.exposeInMainWorld('electronPath', {\n  join: path.join\n});\ncontextBridge.exposeInMainWorld('electronAPI', {\n  onUpdateStatus: function onUpdateStatus(callback) {\n    return ipcRenderer.on('update-status', function (_event, value) {\n      return callback(value);\n    });\n  },\n  statusValue: function statusValue(value) {\n    return ipcRenderer.send('status-value', value);\n  },\n  onResults: function onResults(callback) {\n    return ipcRenderer.on('update-results', function (_event, value) {\n      return callback(value);\n    });\n  },\n  resultValue: function resultValue(value) {\n    return ipcRenderer.send('results-value', value);\n  },\n  onGetDataComplete: function onGetDataComplete(callback) {\n    return ipcRenderer.on('update-complete', function (_event, value) {\n      return callback(value);\n    });\n  }\n});\n\n//# sourceURL=webpack://m2-automation-app/./preload.js?");

/***/ }),

/***/ "electron":
/*!***************************!*\
  !*** external "electron" ***!
  \***************************/
/***/ ((module) => {

"use strict";
module.exports = require("electron");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ "os":
/*!*********************!*\
  !*** external "os" ***!
  \*********************/
/***/ ((module) => {

"use strict";
module.exports = require("os");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./preload.js");
/******/ 	
/******/ })()
;