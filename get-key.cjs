const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://medusa:medusa@127.0.0.1:5435/medusa',
});

console.log('Connecting to PostgreSQL on port 5435...');
client.connect()
  .then(() => {
    console.log('Connected! Fetching api_key rows...');
    return client.query('SELECT * FROM api_key');
  })
  .then(res => {
    console.log('API Keys in Database:');
    res.rows.forEach(row => {
      console.log(`- ID: ${row.id}, Title: ${row.title}, Type: ${row.type}, Token: ${row.token}`);
    });
    return client.end();
  })
  .catch(err => {
    console.error('Failed to query database:', err);
    process.exit(1);
  });
