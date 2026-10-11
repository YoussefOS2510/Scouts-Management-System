import sql from 'mssql/msnodesqlv8.js';

async function seedHistoryAndAlbums() {
  const pool = new sql.ConnectionPool({
    connectionString: 'Driver={ODBC Driver 18 for SQL Server};Server=(local);Database=ScoutsDB;Trusted_Connection=yes;TrustServerCertificate=yes;'
  });
  await pool.connect();
  console.log('Connected to ScoutsDB to seed history and albums...');

  // 1. Seed member_unit_history for all current members
  const mems = await pool.request().query('SELECT id, unit_id, patrol_id, member_code FROM members');
  for (const m of mems.recordset) {
    const checkHist = await pool.request()
      .input('mid', sql.UniqueIdentifier, m.id)
      .input('uid', sql.Int, m.unit_id)
      .input('yr', sql.Int, 2026)
      .query('SELECT COUNT(*) as cnt FROM member_unit_history WHERE member_id = @mid AND unit_id = @uid AND year = @yr');

    if (checkHist.recordset[0].cnt === 0) {
      await pool.request()
        .input('mid', sql.UniqueIdentifier, m.id)
        .input('uid', sql.Int, m.unit_id)
        .input('pid', sql.Int, m.patrol_id)
        .input('yr', sql.Int, 2026)
        .input('notes', sql.NVarChar(sql.MAX), 'السنة الكشفية الحالية 2026')
        .query(`
          INSERT INTO member_unit_history (member_id, unit_id, patrol_id, year, notes)
          VALUES (@mid, @uid, @pid, @yr, @notes)
        `);
    }
  }
  console.log('Successfully ensured member_unit_history for all active members.');

  // 2. Seed canonical media_albums
  const checkAlb = await pool.request().query('SELECT COUNT(*) as cnt FROM media_albums');
  if (checkAlb.recordset[0].cnt === 0) {
    const albums = [
      { unit_id: 1, year: 2024, name: 'Summer_Camp_St_Mark_2024', name_ar: 'مخيم مارمرقس الصيفي للأشبال 2024', cover: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80', folder: '1drive_folder_ashbal_2024_camp' },
      { unit_id: 1, year: 2024, name: 'Promise_and_Investiture_2024', name_ar: 'حفل الوعد والقبول للأشبال 2024', cover: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=800&q=80', folder: '1drive_folder_ashbal_2024_promise' },
      { unit_id: 2, year: 2025, name: 'Wadi_Degla_Exploration_2025', name_ar: 'رحلة وادي دجلة الاستكشافية 2025', cover: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=800&q=80', folder: '1drive_folder_ashbal_2025_safari' },
      { unit_id: 5, year: 2026, name: 'Wadi_Rayan_Desert_Camp_2026', name_ar: 'مخيم وادي الريان الكشفي الكبير 2026', cover: 'https://images.unsplash.com/photo-1517824806704-9040b037703b?auto=format&fit=crop&w=800&q=80', folder: '1drive_folder_kashafa_2026_rayan' },
      { unit_id: 7, year: 2026, name: 'Morshdat_Leadership_Challenge_2026', name_ar: 'معسكر القيادة والتحدي للمرشدات 2026', cover: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80', folder: '1drive_folder_morshdat_2026_camp' },
    ];

    for (const a of albums) {
      await pool.request()
        .input('uid', sql.Int, a.unit_id)
        .input('yr', sql.Int, a.year)
        .input('en', sql.NVarChar(150), a.name)
        .input('ar', sql.NVarChar(150), a.name_ar)
        .input('cov', sql.NVarChar(sql.MAX), a.cover)
        .input('fid', sql.NVarChar(255), a.folder)
        .query(`
          INSERT INTO media_albums (unit_id, year, event_name, event_name_ar, cover_image_url, drive_folder_id)
          VALUES (@uid, @yr, @en, @ar, @cov, @fid)
        `);
    }
    console.log('Successfully seeded canonical media_albums in ScoutsDB.');
  }

  await pool.close();
}

seedHistoryAndAlbums().catch(e => {
  console.error('History/Albums seed error:', e);
  process.exit(1);
});
