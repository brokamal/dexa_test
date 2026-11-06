require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const seedRows = [
  ['EMP001', 'Admin', 'admin@dexa.com', 'admin123', 'admin', 'HR Manager', 'Human Resource', '081200000001', '2022-01-10'],
  ['EMP002', 'Budi Santoso', 'budi@dexa.com', 'employee123', 'employee', 'Frontend Engineer', 'Engineering', '081200000002', '2023-03-01'],
  ['EMP003', 'Rani Wijaya', 'rani@dexa.com', 'employee123', 'employee', 'Backend Engineer', 'Engineering', '081200000003', '2023-08-15'],
];

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  for (const [nip, fullName, email, plain, role, position, department, phone, joinedAt] of seedRows) {
    const hash = await bcrypt.hash(plain, 10);
    await conn.execute(
      `INSERT INTO employees (nip, full_name, email, password, role, position, department, phone, is_active, joined_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
       ON DUPLICATE KEY UPDATE nip = nip`,
      [nip, fullName, email, hash, role, position, department, phone, joinedAt],
    );
  }

  const [rows] = await conn.execute('SELECT COUNT(*) AS n FROM employees');
  console.log('Seed done. Employees rows:', rows[0].n);
  console.log('Logins: admin@dexa.com/admin123, budi@dexa.com/employee123, rani@dexa.com/employee123');
  await conn.end();
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
