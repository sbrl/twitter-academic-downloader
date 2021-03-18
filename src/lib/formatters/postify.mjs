"use strict";

export default function postify(obj) {
	return Object.keys(obj).map(function(key) {
		return [key, encodeURIComponent(obj[key])].join("=");
	}).join("&");
}
