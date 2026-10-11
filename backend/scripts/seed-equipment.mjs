import sql from 'mssql/msnodesqlv8.js';

async function seedEquipment() {
  const pool = new sql.ConnectionPool({
    connectionString: 'Driver={ODBC Driver 18 for SQL Server};Server=(local);Database=ScoutsDB;Trusted_Connection=yes;TrustServerCertificate=yes;'
  });
  await pool.connect();
  console.log('Connected to ScoutsDB to seed equipment...');

  // Check if equipment already seeded
  const check = await pool.request().query('SELECT COUNT(*) as cnt FROM equipment');
  if (check.recordset[0].cnt > 0) {
    console.log('Equipment already contains', check.recordset[0].cnt, 'items.');
    await pool.close();
    return;
  }

  const items = [
    { cat: 1, name: 'Tent 4-Person Heavy Duty (خيمة 4 أفراد مقاومة للمطر)', sku: 'TNT-001', qty: 25, bay: 'Bay A-1', cond: 'good' },
    { cat: 1, name: 'Marquee Mess Tent 20x10m (صيوان طعام كبير)', sku: 'TNT-002', qty: 3, bay: 'Bay A-2', cond: 'good' },
    { cat: 2, name: 'Propane Camp Stove 2-Burner (موقد غاز مع شعلتين)', sku: 'CKG-001', qty: 10, bay: 'Bay B-1', cond: 'good' },
    { cat: 2, name: 'Stainless Cooking Pots 50L (حلل طهي طعام جماعي)', sku: 'CKG-002', qty: 8, bay: 'Bay B-2', cond: 'good' },
    { cat: 3, name: 'Manila Pioneering Rope 200m (حبل مانيلا ريادة 14مم)', sku: 'ROP-001', qty: 15, bay: 'Bay C-1', cond: 'good' },
    { cat: 3, name: 'Carabiners & Pulleys Set (أطقم شناكل وبكرات تسلق)', sku: 'ROP-002', qty: 20, bay: 'Bay C-2', cond: 'good' },
    { cat: 4, name: 'LED Floodlight 100W with Stand (كشاف ليد ستاند خارجي)', sku: 'LGT-001', qty: 12, bay: 'Bay D-1', cond: 'good' },
    { cat: 4, name: 'Heavy Duty Extension Reel 50m (بكرة سلك تيار مقاومة)', sku: 'LGT-002', qty: 10, bay: 'Bay D-2', cond: 'good' },
    { cat: 5, name: 'Portable PA System 200W + 2 Mics (سماعة متحركة مع مايكين)', sku: 'SND-001', qty: 4, bay: 'Bay E-1', cond: 'good' },
  ];

  for (const it of items) {
    await pool.request()
      .input('cat', sql.Int, it.cat)
      .input('name', sql.NVarChar(150), it.name)
      .input('sku', sql.NVarChar(50), it.sku)
      .input('qty', sql.Int, it.qty)
      .input('bay', sql.NVarChar(100), it.bay)
      .input('cond', sql.NVarChar(50), it.cond)
      .query(`
        INSERT INTO equipment (category_id, name, sku, total_quantity, storage_bay, condition)
        VALUES (@cat, @name, @sku, @qty, @bay, @cond)
      `);
  }

  console.log('Successfully inserted', items.length, 'equipment items into dbo.equipment.');
  await pool.close();
}

seedEquipment().catch(e => {
  console.error('Seed error:', e);
  process.exit(1);
});
