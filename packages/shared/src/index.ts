export type Action = string;

// Message type enum (strict since there are only 2 values)
export enum MessageType {
	REQUEST = 'REQUEST',
	RESPONSE = 'RESPONSE',
}

// Branded string type for source/destination validation
export type NodeId = string & { readonly __brand: unique symbol };

// Helper function to create validated node IDs
export function createNodeId(id: string): NodeId {
	if (!id || typeof id !== 'string' || id.trim() === '') {
		throw new Error('Node ID must be a non-empty string');
	}
	return id as NodeId;
}

// Helper function to validate existing node IDs (for migration compatibility)
export function validateNodeId(id: string): NodeId {
	return createNodeId(id);
}

export interface RequestPayload<T = unknown> {
	id: string;
	source: NodeId;
	destination: NodeId;
	action: Action;
	data: T;
	type: MessageType.REQUEST;
}

export interface ResponsePayload<T = unknown> {
	id: string;
	source: NodeId;
	destination: NodeId;
	data?: T;
	error?: {
		message: string;
		stack?: string;
	};
	type: MessageType.RESPONSE;
}

export type MessagePayload = RequestPayload | ResponsePayload;
