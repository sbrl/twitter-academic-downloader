"use strict";

/**
 * Merges 2 object trees, overwriting keys in target with those of source.
 * Note that target will be mutated!
 * @param  {object} source	The source object to merge.
 * @param  {object} target	The target object to merge.
 */
function obj_assign_recursive(source, target) {
	for(let key in source) {
		if(typeof source[key] == "object") {
			if(typeof target[key] == "undefined")
				target[key] = {};
			
			obj_assign_recursive(source[key], target[key]);
			continue;
		}
		
		target[key] = source[key];
	}
}

export {
	obj_assign_recursive
}
