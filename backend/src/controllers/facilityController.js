const db = require('../config/db');

async function getAllFacilities(req, res) {
  try {
    // ensure active column exists, fallback to true for older rows
    const result = await db.query(
      'SELECT *, COALESCE(active, true) AS active FROM gym_facilities ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getAllFacilities error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

async function getFacilityById(req, res) {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);
    const isNum = !isNaN(idNum);
    
    const result = await db.query(
      `SELECT *, COALESCE(active, true) AS active FROM gym_facilities WHERE ${isNum ? 'id = $1' : 'slug = $1'}`,
      [isNum ? idNum : id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Facility not found' });
    }
    
    const facility = result.rows[0];
    // Parse JSON fields if they're strings
    if (typeof facility.equipments === 'string') facility.equipments = JSON.parse(facility.equipments);
    if (typeof facility.workouts === 'string') facility.workouts = JSON.parse(facility.workouts);
    if (typeof facility.facilities === 'string') facility.facilities = JSON.parse(facility.facilities);
    if (typeof facility.gallery === 'string') facility.gallery = JSON.parse(facility.gallery);
    
    res.json(facility);
  } catch (err) {
    console.error('getFacilityById error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

async function createFacility(req, res) {
  console.log('=== CREATE FACILITY REQUEST ===');
  console.log('Raw body keys:', Object.keys(req.body));
  
  const {
    title, slug, shortDesc, description, heroImage,
    equipments, workouts, facilities, gallery,
    active // new boolean flag
  } = req.body;

  console.log('Extracted fields:', {
    title: typeof title,
    shortDesc: typeof shortDesc,
    description: typeof description,
    heroImage: heroImage ? `${heroImage.substring(0, 50)}...` : null,
    equipments: Array.isArray(equipments) ? `array[${equipments.length}]` : typeof equipments,
    workouts: Array.isArray(workouts) ? `array[${workouts.length}]` : typeof workouts,
    facilities: Array.isArray(facilities) ? `array[${facilities.length}]` : typeof facilities,
    gallery: Array.isArray(gallery) ? `array[${gallery.length}]` : typeof gallery
  });

  try {
    // Validate required fields
    if (!title || !shortDesc) {
      console.log('Validation failed: title or shortDesc missing');
      return res.status(400).json({ message: "Title and short description are required" });
    }

    const facilitySlug = slug || title.toLowerCase().replace(/\s+/g, "-");
    console.log('Generated slug:', facilitySlug);

    const equipmentsJson = JSON.stringify(Array.isArray(equipments) ? equipments : []);
    const workoutsJson = JSON.stringify(Array.isArray(workouts) ? workouts : []);
    const facilitiesJson = JSON.stringify(Array.isArray(facilities) ? facilities : []);
    const galleryJson = JSON.stringify(Array.isArray(gallery) ? gallery : []);

    console.log('About to execute INSERT with:', {
      title, facilitySlug, shortDesc, 
      equipmentsJsonLength: equipmentsJson.length,
      workoutsJsonLength: workoutsJson.length,
      facilitiesJsonLength: facilitiesJson.length,
      galleryJsonLength: galleryJson.length
    });

    const result = await db.query(
      `INSERT INTO gym_facilities
      (title, slug, short_description, description, hero_image, 
       equipments, workouts, facilities, gallery, active)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *`,
      [
        title, 
        facilitySlug, 
        shortDesc, 
        description || null, 
        heroImage || null,
        equipmentsJson,
        workoutsJson,
        facilitiesJson,
        galleryJson,
        active === false ? false : true // default true
      ]
    );

    console.log('✅ Facility created successfully! ID:', result.rows[0].id);
    res.json(result.rows[0]);

  } catch (err) {
    console.error('❌ createFacility error:', err.message);
    console.error('Stack:', err.stack);
    console.error('Code:', err.code);
    console.error('Detail:', err.detail);
    res.status(500).json({ 
      message: "Server error", 
      error: err.message,
      detail: err.detail,
      code: err.code 
    });
  }
}

async function updateFacility(req, res) {
  const { id } = req.params;
  const idNum = parseInt(id, 10);
  const isNum = !isNaN(idNum);
  
  // require full payload; callers should provide all fields or use toggle endpoint
  const {
    title, slug, shortDesc, description, heroImage,
    equipments, workouts, facilities, gallery,
    active
  } = req.body;

  try {
    const facilitySlug = slug || title.toLowerCase().replace(/\s+/g, "-");

    const result = await db.query(
      `UPDATE gym_facilities SET
        title=$1, slug=$2, short_description=$3, description=$4,
        hero_image=$5, equipments=$6, workouts=$7, facilities=$8,
        gallery=$9, active=$10, updated_at=NOW()
       WHERE ${isNum ? 'id=$11' : 'slug=$11'} RETURNING *`,
      [
        title, 
        facilitySlug, 
        shortDesc, 
        description || null, 
        heroImage || null,
        JSON.stringify(Array.isArray(equipments) ? equipments : []),
        JSON.stringify(Array.isArray(workouts) ? workouts : []),
        JSON.stringify(Array.isArray(facilities) ? facilities : []),
        JSON.stringify(Array.isArray(gallery) ? gallery : []),
        active === false ? false : true,
        isNum ? idNum : id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Facility not found' });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error('updateFacility error', err);
    res.status(500).json({ message: "Server error" });
  }
}

async function deleteFacility(req, res) {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);
    const isNum = !isNaN(idNum);
    
    const result = await db.query(
      `DELETE FROM gym_facilities WHERE ${isNum ? 'id = $1' : 'slug = $1'} RETURNING id`,
      [isNum ? idNum : id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Facility not found' });
    }
    res.json({ success: true, message: 'Facility deleted successfully' });
  } catch (err) {
    console.error('deleteFacility error', err);
    res.status(500).json({ error: 'Delete failed' });
  }
}

// flip active flag without touching other fields
async function toggleFacilityActive(req, res) {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);
    const isNum = !isNaN(idNum);
    
    const result = await db.query(
      `UPDATE gym_facilities SET active = NOT COALESCE(active, true) WHERE ${isNum ? 'id = $1' : 'slug = $1'} RETURNING active`,
      [isNum ? idNum : id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Facility not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('toggleFacilityActive error', err);
    res.status(500).json({ error: 'Update failed' });
  }
}

module.exports = { getAllFacilities, getFacilityById, createFacility, updateFacility, deleteFacility, toggleFacilityActive };
