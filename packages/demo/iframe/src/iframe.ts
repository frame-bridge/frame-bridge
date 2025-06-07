import { init } from '@frame-bridge/client';

console.log('Client starting...');

const client = init({
	serverFrame: window.parent,
	targetOrigin: 'http://localhost:3000',
	sourceName: 'demo-client',
	destinationName: 'demo-server',
});

console.log('Client initialized.');

async function runDemos() {
	console.log('Requesting server time...');
	const time = await client.request('get-server-time', null);
	console.log('Server time:', time);

	console.log('Requesting to add 5 and 7...');
	const sum = await client.request('add-numbers', { a: 5, b: 7 });
	console.log('Sum:', sum);

	const button = document.getElementById('counter');
	button?.addEventListener('click', async () => {
		console.log('Requesting count...');
		const count = await client.request('count', null);
		console.log('client count:', count);
	});
}

// Wait for the connection to be established before making requests
setTimeout(runDemos, 100);
