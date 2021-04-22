"use strict";

class ConversationIdsQueue {
	constructor(query_postfix, query_max_length) {
		this.query_postfix = query_postfix;
		this.query_max_length = query_max_length;
		
		this._queue = [];
	}
	
	/**
	 * Pushes the given conversation id onto the stack.
	 * @param  {[type]} id [description]
	 * @return {[type]}    [description]
	 */
	push(id) {
		this._queue.push(id);
	}
	
	/**
	 * Gets a query string to search Twitter with.
	 * If there aren't enough conversation ids in the queue, then null is returned.
	 * If you're calling this to clean up at the end, then pass finish = true
	 * @param	{Boolean}	[finished=false]	If true, then return a query string even if it isn't long enough to max out the query string length. Useful at the end when you're cleaning up.
	 * @return	{string|null}	A query string for some (or all) of the conversation ids in the queue, or null if the calculated query string wasn't long enough yet.
	 */
	get_query(finished = false) {
		if(this._queue.length == 0) return null;
		let parts = [], query_prev = "";
		let i = 0;
		while(i < this._queue.length) {
			parts.push(`conversation_id:${this._queue[i]}`);
			
			let query = this._make_query(parts);
			// We made it too long
			if(query.length > this.query_max_length) {
				// Delete the items from the queue
				this._queue.splice(0, i); // i starts at 0, not 1
				
				return query_prev;
			}
			
			query_prev = query;
			i++;
		}
		
		if(finished) {
			this._queue.length = 0;
			return query_prev;
		}
		
		// console.log(`[DEBUG:ConversationIdsQueue] query_prev.length: ${query_prev.length}, queue length: ${this._queue.length}\n`);
		
		return null;
	}
	
	_make_query(parts) {
		return parts.join(" OR ") + ` ${this.query_postfix}`;
	}
}

export default ConversationIdsQueue;
