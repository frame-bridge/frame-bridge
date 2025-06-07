import { init } from '@frame-bridge/server';

console.log('Server starting...');

let count = 0;

init({
	sourceName: 'demo-server',
	allowedOrigins: ['http://localhost:3001'],
	allowedClients: ['demo-client'],
	actions: {
		'get-server-time': async () => {
			return new Date().toLocaleTimeString();
		},
		'add-numbers': async (data: { a: number; b: number }) => {
			return data.a + data.b;
		},
		async count() {
			console.log('server count:', ++count);
			return count;
		},
	},
});

console.log('Server initialized.');
