// export const functions = (functionsObjects, utils_) => {
// 	// functions = {};
// 	// functions can be specified with <object> or globals_   visibilty
// 	// for a type and name, the first found will be returned
// 	// functions may be defined in objects at different levels (locally, client, pivot grid, table...)
// 	// the object must be merged together
// 	const functionsObject = {};
// 	let currentVisibility;
// 	const utils = utils_;
// 	const mergeFunctionsObjects = functionsObjects => {
// 		(Array.isArray(functionsObjects)
// 			? functionsObjects.filter(f => f !== undefined)
// 			: [functionsObjects || {}]).forEach(f => {
// 			Object.keys(f).forEach(visibility => {
// 				Object.keys(f[visibility]).forEach(type => {
// 					Object.keys(f[visibility][type]).forEach(name => {
// 						setInitialFunction(
// 							visibility,
// 							type,
// 							name,
// 							name,
// 							f[visibility][type][name]
// 						);
// 					});
// 				});
// 			});
// 		});
// 	};
// 	const mergeFunctionsArray = functions => {
// 		functions.forEach(f => {
// 			setInitialFunction(
// 				f.visibility,
// 				f.tp,
// 				f.id,
// 				f.caption,
// 				f.functionText
// 			);
// 		});
// 	};
// 	const evalProtectedFunction = text => {
// 		let f;
// 		const functionText =
// 			"message => {try{ return (" +
// 			text +
// 			')(message)} catch (e){return "local function error"}}';
// 		try {
// 			eval("f = " + functionText);
// 		} catch (e) {
// 			f = () => {};
// 		}
// 		return f;
// 	};
// 	const initKey = (visibility, type, name) => {
// 		if (!functionsObject[visibility]) {
// 			functionsObject[visibility] = {};
// 		}
// 		if (!functionsObject[visibility][type]) {
// 			functionsObject[visibility][type] = {};
// 		}
// 		if (!functionsObject[visibility][type][name]) {
// 			functionsObject[visibility][type][name] = {};
// 		}
// 	};
// 	const getInitialFunction = (visibility, type, name) =>
// 		functionsObject[visibility][type][name].f0 ||
// 		functionsObject["globals_"][type][name].f0;
// 	const getFunction = (visibility = currentVisibility, type, name) =>
// 		(((functionsObject[visibility] || {})[type] || {})[name] || {}).f ||
// 		(((functionsObject.globals_ || {})[type] || {})[name] || {}).f;
// 	const setInitialFunction = (visibility, type, name, caption, f0) => {
// 		initKey(visibility, type, name);
// 		let f = f0,
// 			fText;
// 		if (typeof f === "string") {
// 			fText = f;
// 			f = evalProtectedFunction(f);
// 		}
// 		functionsObject[visibility][type][name] = {
// 			f0: f,
// 			f,
// 			fText,
// 			caption: caption || name
// 		};
// 		return f;
// 	};
// 	const setFunction = (visibility, type, name, f) => {
// 		initKey(visibility, type, name);
// 		functionsObject[visibility][type][name].f = f;
// 	};
// 	const composeFunction = (visibility, type, name, args) =>
// 		setFunction(
// 			visibility,
// 			type,
// 			name,
// 			(getInitialFunction(visibility, type, name) || (x => undefined))(
// 				args
// 			)
// 		);
// 	// get data array for "functions" tab table
// 	const functionToString = f => {
// 		if (f.fText) {
// 			return f.fText;
// 		} else if (typeof f.f === "function") {
// 			return String(f.f);
// 		}
// 	};
// 	const getFunctionsArray = (visibility, type) => {
// 		const functions = [];
// 		let keys = type ? [type] : Object.keys(functionsObject.globals_);
// 		if (keys && (!type || functionsObject.globals_[type])) {
// 			keys.forEach(type => {
// 				(Object.keys(functionsObject.globals_[type]) || [])
// 					.forEach(name => {
// 						if (
// 							!((functionsObject[visibility] || {})[type] || {})[
// 								name
// 							]
// 						) {
// 							const f = functionsObject.globals_[type][name];
// 							functions.push({
// 								id: name,
// 								caption: f.caption,
// 								visibility: "globals_",
// 								tp: type,
// 								functionJS: f.f,
// 								functionText: functionToString(f),
// 								isLocal: !!f.fText
// 							});
// 						}
// 					});
// 			});
// 		}
// 		keys = type ? [type] : Object.keys(functionsObject[visibility]);
// 		if (keys && (!type || functionsObject[visibility][type])) {
// 			keys.forEach(type => {
// 				(Object.keys(functionsObject[visibility][type]) || [])
// 					.forEach(name => {
// 						const f = functionsObject[visibility][type][name];
// 						functions.push({
// 							id: name,
// 							caption: f.caption,
// 							visibility,
// 							tp: type,
// 							functionJS: f.f,
// 							functionText: functionToString(f),
// 							isLocal: !!f.fText
// 						});
// 					});
// 			});
// 		}
// 		return functions;
// 	};
// 	const accessor = name => getFunction(currentVisibility, "accessors", name);
// 	mergeFunctionsObjects(functionsObjects || []);
// 	return {
// 		mergeFunctionsObjects,
// 		mergeFunctionsArray,
// 		getFunction,
// 		setFunction,
// 		setInitialFunction,
// 		composeFunction,
// 		getFunctionsArray,
// 		setVisibility: visibility => (currentVisibility = visibility)
// 	};
// };
