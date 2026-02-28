const db = require('../config/db');

// Helper to safely parse JSON
const safeParsePoints = (pointsStr) => {
  try {
    return pointsStr ? JSON.parse(pointsStr) : [];
  } catch (err) {
    console.warn('Failed to parse points:', err.message);
    return [];
  }
};

async function generateServiceId(req, res) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const select = await client.query("SELECT current FROM counters WHERE name = 'services' FOR UPDATE");
    if (select.rows.length === 0) {
      await client.query("INSERT INTO counters(name, current) VALUES ('services', 1)");
      await client.query('COMMIT');
      return res.json({ serviceId: `SE${String(1).padStart(3, '0')}` });
    }

    const current = select.rows[0].current || 0;
    const next = current + 1;
    await client.query('UPDATE counters SET current = $1 WHERE name = $2', [next, 'services']);
    await client.query('COMMIT');
    return res.json({ serviceId: `SE${String(next).padStart(3, '0')}` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('generateServiceId error', err);
    res.status(500).json({ error: 'Failed to generate service id' });
  } finally {
    client.release();
  }
}

async function getAllServices(req, res) {
  try {
    const result = await db.query('SELECT * FROM services ORDER BY created_at DESC');
    const rows = result.rows.map(r => ({
      id: r.id,
      service_id: r.service_id,
      title: r.title,
      slug: r.slug,
      short_desc: r.short_desc,
      description: r.description,
      hero_image: r.hero_image,
      points: safeParsePoints(r.points),
      created_at: r.created_at,
      updated_at: r.updated_at
    }));
    res.json(rows);
  } catch (err) {
    console.error('getAllServices error:', err.message);
    res.status(500).json({ error: 'Query failed: ' + err.message });
  }
}

async function getServiceById(req, res) {
  try {
    const { id } = req.params;
    
    // Try to parse as integer, otherwise use as string
    const idNum = parseInt(id, 10);
    const isNum = !isNaN(idNum);
    
    const result = await db.query(
      `SELECT * FROM services WHERE ${isNum ? 'id = $1' : 'service_id = $1 OR slug = $1'}`,
      isNum ? [idNum] : [id, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    const row = result.rows[0];
    const service = {
      id: row.id,
      service_id: row.service_id,
      title: row.title,
      slug: row.slug,
      short_desc: row.short_desc,
      description: row.description,
      hero_image: row.hero_image,
      points: safeParsePoints(row.points),
      created_at: row.created_at,
      updated_at: row.updated_at
    };
    
    res.json(service);
  } catch (err) {
    console.error('getServiceById error:', err.message);
    res.status(500).json({ error: 'Query failed: ' + err.message });
  }
}

async function createService(req, res) {
  try {
    const body = req.body;
    const pointsJson = JSON.stringify(body.points || []);

    const result = await db.query(
      `INSERT INTO services (service_id, title, slug, short_desc, description, hero_image, points)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [body.service_id || null, body.title, body.slug, body.short_desc, body.description || null, body.hero_image || null, pointsJson]
    );

    if (result.rows.length === 0) return res.status(500).json({ error: 'Failed to create service' });
    
    const row = result.rows[0];
    const service = {
      id: row.id,
      service_id: row.service_id,
      title: row.title,
      slug: row.slug,
      short_desc: row.short_desc,
      description: row.description,
      hero_image: row.hero_image,
      points: safeParsePoints(row.points),
      created_at: row.created_at,
      updated_at: row.updated_at
    };
    
    res.status(201).json(service);
  } catch (err) {
    console.error('createService error:', err.message);
    res.status(500).json({ error: 'Failed to create service: ' + err.message });
  }
}

async function updateService(req, res) {
  try {
    const { id } = req.params;
    const body = req.body;
    const pointsJson = JSON.stringify(body.points || []);
    
    // Try to parse as integer, otherwise use as string
    const idNum = parseInt(id, 10);
    const isNum = !isNaN(idNum);

    const result = await db.query(
      `UPDATE services SET title = $1, slug = $2, short_desc = $3, description = $4, hero_image = $5, points = $6, updated_at = NOW()
       WHERE ${isNum ? 'id = $7' : 'service_id = $7'}
       RETURNING *`,
      [body.title, body.slug, body.short_desc, body.description || null, body.hero_image || null, pointsJson, isNum ? idNum : id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Service not found' });
    
    const row = result.rows[0];
    const service = {
      id: row.id,
      service_id: row.service_id,
      title: row.title,
      slug: row.slug,
      short_desc: row.short_desc,
      description: row.description,
      hero_image: row.hero_image,
      points: safeParsePoints(row.points),
      created_at: row.created_at,
      updated_at: row.updated_at
    };
    
    res.json(service);
  } catch (err) {
    console.error('updateService error:', err.message);
    res.status(500).json({ error: 'Failed to update service: ' + err.message });
  }
}

async function deleteService(req, res) {
  try {
    const { id } = req.params;
    
    // Try to parse as integer, otherwise use as string
    const idNum = parseInt(id, 10);
    const isNum = !isNaN(idNum);
    
    const result = await db.query(
      `DELETE FROM services WHERE ${isNum ? 'id = $1' : 'service_id = $1'}`,
      [isNum ? idNum : id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Service not found' });
    res.json({ message: 'Service deleted' });
  } catch (err) {
    console.error('deleteService error:', err.message);
    res.status(500).json({ error: 'Failed to delete service: ' + err.message });
  }
}

module.exports = {
  generateServiceId,
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
};
