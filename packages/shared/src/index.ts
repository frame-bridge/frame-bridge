export type Action = string;

export interface RequestPayload<T = unknown> {
	id: string;
	source: string;
	destination: string;
	action: Action;
	data: T;
	type: 'REQUEST';
}

export interface ResponsePayload<T = unknown> {
	id: string;
	source: string;
	destination: string;
	data?: T;
	error?: {
		message: string;
		stack?: string;
	};
	type: 'RESPONSE';
}

export type MessagePayload = RequestPayload | ResponsePayload;
