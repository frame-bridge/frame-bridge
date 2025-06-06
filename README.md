# frame-bridge

> Libraries for consistent, one-way data flow between browser frames.

A lightweight, secure, and typed library for handling communication between iframes. It uses a `MessageChannel` to establish a clear client-server relationship, ensuring that all communication is isolated and secure.

## How it Works

`frame-bridge` is split into two packages: `@frame-bridge/client` and `@frame-bridge/server`.

1. The **client** (e.g., an iframe) initializes the connection by creating a `MessageChannel` and sending one of its ports to the server frame.
2. The **server** (e.g., the main window) listens for this initialization, validates the client's origin, and establishes a secure communication channel using the received port.
3. The client can then send `request`s with a specific `action` and `data` to the server.
4. The server has a set of registered action handlers. When a request is received, the server executes the corresponding handler and returns a response.
5. All communication is promise-based, so the client receives a `Promise` that resolves with the server's response or rejects with an error.

## Use Cases

- **Embedded Third-Party Widgets**: Securely embed widgets (like chat support, booking forms, or data dashboards) that need to communicate with the host page without giving them direct access to the `window` object.
- **Component Isolation**: Isolate complex or resource-intensive components in their own iframes to improve performance or security. These components can then use `frame-bridge` to request data or trigger actions in the main application.
- **Micro-Frontends**: Build applications using a micro-frontend architecture where different frames handle distinct business domains. `frame-bridge` can act as the communication layer between these independent frontends.

## Limitations

- **Unidirectional Data Flow**: The server cannot initiate requests to the client. Communication is always started by the client.
- **Asynchronous Only**: All requests are asynchronous and return Promises. There is no support for synchronous communication.
- **Browser Support**: Relies on `MessageChannel`, which is supported in all modern browsers but may not be available in older environments like Internet Explorer.
- **One-to-One Communication**: Designed for a single client to communicate with a single server. It does not support broadcasting messages to multiple frames.
