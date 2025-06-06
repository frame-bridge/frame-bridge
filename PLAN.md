# Frame Bridge Implementation Plan

This document outlines the implementation details for the `@frame-bridge/client` and `@frame-bridge/server` libraries.

## Core Concepts

- **Unidirectional Data Flow**: Requests originate from the client and are handled by the server. The server sends a response back to the client. The server cannot initiate requests to the client.
- **`MessageChannel`**: Communication is established using a `MessageChannel` for secure and isolated messaging between frames.
- **Typed Payloads**: All messages sent over the channel are JSON strings conforming to a strict `MessagePayload` interface.

## Message Payload Interface

All messages will adhere to this structure:

```typescript
// packages/shared/types.ts (We will create this later)

export type Action = string; // This will become a union of literal types

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
```

## `@frame-bridge/client` Implementation

### `initClient(config)`

- **`config` object:**
  - `serverFrame`: A reference to the iframe window (`HTMLIFrameElement.contentWindow`).
  - `targetOrigin`: The expected origin of the server frame for security.
  - `sourceName`: A unique identifier for this client instance.
- **Functionality:**
  1.  Create a `new MessageChannel()`.
  2.  Store `mc.port1` within the client library's scope.
  3.  Send `mc.port2` to the `serverFrame` via `postMessage(message, targetOrigin, [mc.port2])`.
      - The `message` will be a simple object like `{ type: 'frame-bridge-init' }`.
  4.  Set up a listener on `mc.port1` to handle incoming responses. This listener will be responsible for resolving or rejecting promises created by the `request` function.
  5.  Return an object containing the `request` method and a `destroy` method.

### `client.request(action, data)`

- **Parameters:**
  - `action`: The string identifying the action to be performed by the server.
  - `data`: The payload to send with the request.
- **Functionality:**
  1.  Generate a unique request ID (e.g., using `crypto.randomUUID()`).
  2.  Create the `RequestPayload` object.
  3.  Return a `new Promise((resolve, reject) => { ... })`.
  4.  Store the `resolve` and `reject` functions in a map, keyed by the request ID.
  5.  Post the message through `port1`.
  6.  The main listener on `port1` (from `initClient`) will find the corresponding promise from the map using the response `id` and resolve/reject it.
      - If `response.error` exists, `reject(response.error)`.
      - Otherwise, `resolve(response.data)`.
  7.  Implement a timeout for requests. If a response isn't received within a certain period, the promise should be rejected.

### `client.destroy()`

- Closes `port1` (`port1.close()`).
- Clears any pending request promises.
- Removes event listeners.

## `@frame-bridge/server` Implementation

### `initServer(config)`

- **`config` object:**
  - `sourceName`: The unique name for this server instance.
  - `allowedOrigins`: An array of strings of allowed client origins.
  - `actions`: An object where keys are action names and values are the handler functions. Example: `{ 'user:get': (data) => { ... } }`.
- **Functionality:**
  1.  Add a `message` event listener to the `window`.
  2.  This listener will wait for the `{ type: 'frame-bridge-init' }` message.
  3.  **Security:** When the message is received, it **must** validate `event.origin` against the `allowedOrigins` array.
  4.  If the origin is valid, it retrieves the `MessagePort` from `event.ports[0]`.
  5.  It then creates a "router" that listens for messages on this new port.
  6.  The router parses the incoming `RequestPayload`.
  7.  It looks up the handler function in the `actions` object using `request.action`.
  8.  It calls the handler, passing in `request.data`.
  9.  It wraps the handler call in a `try...catch` block.

### Action Handlers & `respond`

- Each action handler will be an `async` function.
- The return value of the handler will be used as the `data` for the success response.
- If the handler throws an error, the `catch` block in the router will create a `ResponsePayload` with the `error` property set.
- The router constructs the `ResponsePayload` with the original `id`, swapped `source`/`destination`, and posts it back to the client via the port.

### `server.destroy()`

- Closes the message port.
- Removes the `window` message listener.
