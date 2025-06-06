// Client library entry point
console.log('Hello from @frame-bridge/client');

import type { Action, MessagePayload, RequestPayload } from '@frame-bridge/shared';

type PendingRequest = {
	resolve: (value: unknown) => void;
	reject: (reason?: any) => void;
	timeout: number;
};

type ClientConfig = {
	serverFrame: Window;
	targetOrigin: string;
	sourceName: string;
	destinationName: string;
};

export function init({ serverFrame, targetOrigin, sourceName, destinationName }: ClientConfig) {
	const channel = new MessageChannel();
	const port = channel.port1;
	let connected = false;

	const pendingRequests = new Map<string, PendingRequest>();

	// 1. Initial connection message
	serverFrame.postMessage(
		{
			type: 'frame-bridge-init',
			sourceName,
		},
		targetOrigin,
		[channel.port2],
	);

	// 2. Listen for connection confirmation and responses
	port.onmessage = (event: MessageEvent<MessagePayload>) => {
		const payload = event.data;

		if (payload.type === 'RESPONSE') {
			// Handle connection confirmation
			if (payload.data === 'frame-bridge-connected' && !connected) {
				connected = true;
				return;
			}

			// Handle standard responses
			const pending = pendingRequests.get(payload.id);
			if (pending) {
				window.clearTimeout(pending.timeout);
				if (payload.error) {
					pending.reject(payload.error);
				} else {
					pending.resolve(payload.data);
				}
				pendingRequests.delete(payload.id);
			}
		}
	};

	const request = <T = unknown>(action: Action, data: unknown, timeoutMs = 5000): Promise<T> => {
		return new Promise((resolve, reject) => {
			if (!connected) {
				return reject(new Error('Bridge is not connected to the server frame.'));
			}

			const id = crypto.randomUUID();
			const payload: RequestPayload = {
				id,
				source: sourceName,
				destination: destinationName,
				action,
				data,
				type: 'REQUEST',
			};

			const timeout = window.setTimeout(() => {
				pendingRequests.delete(id);
				reject(new Error(`Request timed out after ${timeoutMs}ms`));
			}, timeoutMs);

			pendingRequests.set(id, { resolve: resolve as (value: unknown) => void, reject, timeout });

			port.postMessage(payload);
		});
	};

	const destroy = () => {
		port.close();
		pendingRequests.forEach((p) => {
			window.clearTimeout(p.timeout);
			p.reject(new Error('Client was destroyed.'));
		});
		pendingRequests.clear();
	};

	return {
		request,
		destroy,
	};
}
