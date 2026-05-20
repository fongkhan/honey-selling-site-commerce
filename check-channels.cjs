const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://medusa:medusa@127.0.0.1:5435/medusa',
});

async function main() {
  try {
    await client.connect();
    console.log('Connected!');

    console.log('\n--- Sales Channels ---');
    const channels = await client.query('SELECT * FROM sales_channel');
    channels.rows.forEach(row => {
      console.log(`- ID: ${row.id}, Name: ${row.name}, Description: ${row.description}, IsDisabled: ${row.is_disabled}`);
    });

    console.log('\n--- API Key Sales Channel Mappings ---');
    // In Medusa v2, the mapping table is usually named 'api_key_sales_channel' or similar
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema='public' AND table_name LIKE '%api_key%'
    `);
    console.log('API Key related tables:', tables.rows.map(t => t.table_name));

    for (const t of tables.rows) {
      if (t.table_name.includes('sales_channel') || t.table_name.includes('channel')) {
        console.log(`\nContents of ${t.table_name}:`);
        const mapping = await client.query(`SELECT * FROM ${t.table_name}`);
        console.log(mapping.rows);
      }
    }

    await client.end();
  } catch (err) {
    console.error('Failed:', err);
    process.exit(1);
  }
}

main();
