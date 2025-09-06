const http = require('http');

const options = {
    host: 'localhost',
    port: process.env.PORT || 8080,
    path: '/health',
    timeout: 2000
};

const request = http.request(options, (res) => {
    console.log(`Status do health check: ${res.statusCode}`);
    if (res.statusCode === 200) {
        process.exit(0);
    } else {
        process.exit(1);
    }
});

request.on('error', (err) => {
    console.log('Erro no health check:', err.message);
    process.exit(1);
});

request.end();