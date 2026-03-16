const axios = require('axios');

async function test() {
    const urls = [
        'http://localhost:5000/api/health',
        'http://localhost:5000/api/orders',
        'http://localhost:5000/health',
        'http://localhost:5000/orders'
    ];

    for (const url of urls) {
        try {
            const res = await axios.get(url);
            console.log(`PASS: ${url} -> ${res.status}`);
        } catch (err) {
            console.log(`FAIL: ${url} -> ${err.response ? err.response.status : err.message}`);
            if (err.response && err.response.data) {
                console.log(`  Body: ${err.response.data}`);
            }
        }
    }
}

test();
