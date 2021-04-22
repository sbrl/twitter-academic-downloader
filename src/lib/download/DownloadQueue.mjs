"use strict";

import EventEmitter from 'events';

class DownloadQueueItem {
	constructor(query, next_param) {
		this.query = query;
		this.next_param = next_param;
	}
}

class DownloadQueue extends EventEmitter {
	constructor() {
		super();
		
		this._queue = [];
	}
	
	/**
	 * Adds something to the end of the queue.
	 * @param {DownloadQueueItem} item The item to add to the queue.
	 */
	add(item) {
		if(!(item instanceof DownloadQueueItem))
			throw new Error(`[DownloadQueue:add_and_wait] Error: Expected instance of DownloadQueueItem.`);
		
		this._queue.push(item);
	}
	
	/**
	 * Removes an item from the queue.
	 * @return {DownloadQueueItem|null}      A download queue item - or null if there's nothing left in the queue.
	 */
	remove() {
		if(this._queue.length == 0)
			return null;
		
		
		let next_item = this._queue.shift();
		
		this.emit("remove");
		
		return next_item;
	}
	
	/**
	 * Returns the next item in the queue, but does not remove therefrom.
	 * @return	{DownloadQueueItem}	The next item in the queue.
	 */
	peek() {
		if(this._queue.length == 0) return null;
		return this._queue[0];
	}
	
	wait(item) {
		return new Promise((resolve, _reject) => {
			this.add(item);
			
			// If this is the next item in the queue anyway, then return immediately
			if(this.peek() === item) {
				resolve();
				return;
			}
			
			// If not, then wait for our turn
			this.once("remove", () => {
				if(this.peek() === item) {
					// This is the next item in the queue!
					this.remove();
					resolve();
				}
			});
		});
	}
}

export { DownloadQueue, DownloadQueueItem };
