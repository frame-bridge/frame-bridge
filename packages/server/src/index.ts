// Server library entry point
console.log('Hello from @frame-bridge/server');

import type { Action, RequestPayload, ResponsePayload } from '@frame-bridge/shared';

type ActionHandler = (data: any) => Promise<any>;

type ServerConfig = {
	sourceName: string;
	allowedOrigins: string[];
	allowedClients: string[];
	actions: Record<Action, ActionHandler>;
};

export function init({ sourceName, allowedOrigins, allowedClients, actions }: ServerConfig) {
	let port: MessagePort | null = null;
	let clientSource: string | null = null;

	const handleInitialMessage = (event: MessageEvent) => {
		// 1. Security: Check origin
		if (!allowedOrigins.includes(event.origin)) {
			console.error(`[${sourceName}] Discarding message from untrusted origin: ${event.origin}`);
			return;
		}

		// 2. Check for the correct initialization message type
		const { data, ports } = event;
		if (data?.type !== 'frame-bridge-init' || !ports[0]) {
			return;
		}

		// 3. Security: Check if the client source is allowed
		const clientSourceName = data.sourceName;
		if (!allowedClients.includes(clientSourceName)) {
			console.error(`[${sourceName}] Discarding message from unallowed client: ${clientSourceName}`);
			return;
		}

		// From this point, the connection is considered valid
		clientSource = clientSourceName;
		port = ports[0];
		port.onmessage = handleActionRequest;

		// 4. Send connection confirmation
		const connectionAck: ResponsePayload = {
			id: 'frame-bridge-init-ack',
			source: sourceName,
			destination: clientSource!, // Guaranteed to be a string here
			type: 'RESPONSE',
			data: 'frame-bridge-connected',
		};
		port.postMessage(connectionAck);

		console.log(`[${sourceName}] Connection established with client: ${clientSource}`);
	};

	const handleActionRequest = async (event: MessageEvent<RequestPayload>) => {
		if (!port || !clientSource) return;

		const { id, action, data, source, destination } = event.data;

		// Security: Ensure the request is from the connected client and for this server
		if (source !== clientSource || destination !== sourceName) {
			console.warn(`[${sourceName}] Discarding message with invalid source/destination.`);
			return;
		}

		const response: ResponsePayload = {
			id,
			source: sourceName,
			destination: source,
			type: 'RESPONSE',
		};

		const handler = actions[action];
		if (handler) {
			try {
				response.data = await handler(data);
			} catch (e: any) {
				response.error = {
					message: e.message,
					stack: e.stack,
				};
			}
		} else {
			response.error = {
				message: `Action "${action}" not found on server "${sourceName}".`,
			};
		}

		port.postMessage(response);
	};

	const destroy = () => {
		if (port) {
			port.close();
			port = null;
		}
		window.removeEventListener('message', handleInitialMessage);
	};

	window.addEventListener('message', handleInitialMessage);

	return {
		destroy,
	};
}
