const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticate, isAdmin } = require('../middleware/auth');
const { query, queryOne } = require('../config/database');

// Get all cars (with filters)
router.get('/', async (req, res) => {
  try {
    const { car_make, type, minPrice, maxPrice, location, search } = req.query;
    let sql = 'SELECT * FROM cars WHERE 1=1';
    const params = [];

    if (car_make) {
      sql += ' AND car_make LIKE ?';
      params.push(`%${car_make}%`);
    }
    if (type) {
      sql += ' AND car_type = ?';
      params.push(type);
    }
    if (minPrice) {
      sql += ' AND car_hourly_rate >= ?';
      params.push(minPrice);
    }
    if (maxPrice) {
      sql += ' AND car_hourly_rate <= ?';
      params.push(maxPrice);
    }
    if (location) {
      sql += ' AND car_location LIKE ?';
      params.push(`%${location}%`);
    }
    if (search) {
      sql += ' AND (car_make LIKE ? OR car_model LIKE ? OR car_description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    sql += ' ORDER BY created_at DESC';

    const cars = await query(sql, params);
    
    // Transform to match frontend expectations
    const transformedCars = cars.map(car => ({
      id: car.car_id,
      car_make: car.car_make,
      car_model: car.car_model,
      type: car.car_type,
      year: car.car_year,
      color: car.car_color,
      price_per_day: car.car_hourly_rate,
      location: car.car_location,
      description: car.car_description,
      image_url: car.car_image_url,
      available: car.car_status === 'available' ? 1 : 0,
      status: car.car_status,
      mileage: car.car_mileage,
      reg_no: car.car_reg_no,
      created_at: car.created_at
    }));

    res.json(transformedCars);
  } catch (error) {
    console.error('Get cars error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single car
router.get('/:id', async (req, res) => {
  try {
    const car = await queryOne('SELECT * FROM cars WHERE car_id = ?', [req.params.id]);
    
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    // Transform to match frontend expectations
    res.json({
      id: car.car_id,
      car_make: car.car_make,
      car_model: car.car_model,
      type: car.car_type,
      year: car.car_year,
      color: car.car_color,
      price_per_day: car.car_hourly_rate,
      location: car.car_location,
      description: car.car_description,
      image_url: car.car_image_url,
      available: car.car_status === 'available' ? 1 : 0,
      status: car.car_status,
      mileage: car.car_mileage,
      reg_no: car.car_reg_no,
      created_at: car.created_at
    });
  } catch (error) {
    console.error('Get car error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add car (admin only)
router.post('/', authenticate, isAdmin, [
  body('car_make').trim().notEmpty().withMessage('Car make (brand) is required'),
  body('car_model').trim().notEmpty().withMessage('Car model is required'),
  body('type').trim().notEmpty().withMessage('Type is required'),
  body('year').isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage('Valid year is required'),
  body('price_per_day').isFloat({ min: 0 }).withMessage('Valid price is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('reg_no').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { car_make, car_model, type, year, color, price_per_day, location, description, image_url, available, reg_no, mileage } = req.body;
    
    // Validate required fields
    if (!car_make) {
      return res.status(400).json({ message: 'Car make (brand) is required' });
    }
    if (!car_model) {
      return res.status(400).json({ message: 'Car model is required' });
    }
    
    // Generate reg_no if not provided
    const registrationNumber = reg_no || `${car_make.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;

    // Check if reg_no already exists
    const existingCar = await queryOne('SELECT car_id FROM cars WHERE car_reg_no = ?', [registrationNumber]);
    if (existingCar) {
      return res.status(400).json({ message: 'Car with this registration number already exists' });
    }

    // Insert car - use database pool directly to get insertId
    const db = require('../config/database').getDb();
    const [result] = await db.execute(
      `INSERT INTO cars (car_reg_no, car_make, car_model, car_year, car_type, car_hourly_rate, car_color, car_location, car_description, car_image_url, car_status, car_mileage) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        registrationNumber,
        car_make,
        car_model,
        year,
        type,
        price_per_day,
        color || null,
        location,
        description || null,
        image_url || null,
        available !== undefined && available === 1 ? 'available' : 'unavailable',
        mileage || 0
      ]
    );

    const carId = result.insertId;
    
    if (!carId) {
      throw new Error('Failed to create car - no insertId returned');
    }
    
    const newCar = await queryOne('SELECT * FROM cars WHERE car_id = ?', [carId]);

    // Return response with car_make and car_model
    res.status(201).json({
      id: newCar.car_id,
      car_make: newCar.car_make,
      car_model: newCar.car_model,
      type: newCar.car_type,
      year: newCar.car_year,
      color: newCar.car_color,
      price_per_day: parseFloat(newCar.car_hourly_rate),
      location: newCar.car_location,
      description: newCar.car_description,
      image_url: newCar.car_image_url,
      available: newCar.car_status === 'available' ? 1 : 0,
      status: newCar.car_status,
      mileage: newCar.car_mileage,
      reg_no: newCar.car_reg_no,
      created_at: newCar.created_at
    });
  } catch (error) {
    console.error('Add car error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update car (admin only)
router.put('/:id', authenticate, isAdmin, [
  body('car_make').optional().trim().notEmpty().withMessage('Car make cannot be empty'),
  body('car_model').optional().trim().notEmpty().withMessage('Car model cannot be empty'),
  body('price_per_day').optional().isFloat({ min: 0 }).withMessage('Valid price is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { car_make, car_model, type, year, color, price_per_day, location, description, image_url, available, reg_no, mileage } = req.body;
    const updates = [];
    const values = [];

    if (car_make) { updates.push('car_make = ?'); values.push(car_make); }
    if (car_model) { updates.push('car_model = ?'); values.push(car_model); }
    if (type) { updates.push('car_type = ?'); values.push(type); }
    if (year) { updates.push('car_year = ?'); values.push(year); }
    if (color !== undefined) { updates.push('car_color = ?'); values.push(color); }
    if (price_per_day) { updates.push('car_hourly_rate = ?'); values.push(price_per_day); }
    if (location) { updates.push('car_location = ?'); values.push(location); }
    if (description !== undefined) { updates.push('car_description = ?'); values.push(description); }
    if (image_url !== undefined) { updates.push('car_image_url = ?'); values.push(image_url); }
    if (available !== undefined) { 
      updates.push('car_status = ?'); 
      values.push(available === 1 ? 'available' : 'unavailable'); 
    }
    if (reg_no) { updates.push('car_reg_no = ?'); values.push(reg_no); }
    if (mileage !== undefined) { updates.push('car_mileage = ?'); values.push(mileage); }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(req.params.id);

    await query(
      `UPDATE cars SET ${updates.join(', ')} WHERE car_id = ?`,
      values
    );

    const updatedCar = await queryOne('SELECT * FROM cars WHERE car_id = ?', [req.params.id]);
    
    if (!updatedCar) {
      return res.status(404).json({ message: 'Car not found' });
    }

    // Transform response
    res.json({
      id: updatedCar.car_id,
      car_make: updatedCar.car_make,
      car_model: updatedCar.car_model,
      type: updatedCar.car_type,
      year: updatedCar.car_year,
      color: updatedCar.car_color,
      price_per_day: updatedCar.car_hourly_rate,
      location: updatedCar.car_location,
      description: updatedCar.car_description,
      image_url: updatedCar.car_image_url,
      available: updatedCar.car_status === 'available' ? 1 : 0,
      status: updatedCar.car_status,
      mileage: updatedCar.car_mileage,
      reg_no: updatedCar.car_reg_no,
      created_at: updatedCar.created_at
    });
  } catch (error) {
    console.error('Update car error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete car (admin only)
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const result = await query('DELETE FROM cars WHERE car_id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Car not found' });
    }
    
    res.json({ message: 'Car deleted successfully' });
  } catch (error) {
    console.error('Delete car error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get car types and car_makes for filters
router.get('/meta/filters', async (req, res) => {
  try {
    const types = await query('SELECT DISTINCT car_type as type FROM cars ORDER BY car_type');
    const car_makes = await query('SELECT DISTINCT car_make as car_make FROM cars ORDER BY car_make');
    const locations = await query('SELECT DISTINCT car_location as location FROM cars WHERE car_location IS NOT NULL ORDER BY car_location');

    res.json({
      types: types.map(t => t.type),
      car_makes: car_makes.map(b => b.car_make),
      locations: locations.map(l => l.location)
    });
  } catch (error) {
    console.error('Get filters error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
