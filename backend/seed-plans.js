require('dotenv').config();
const db = require('./src/config/db');

async function seedPlans() {
  try {
    console.log('Seeding gym_plans with sample data...');

    const plans = [
      {
        name: 'Basic',
        description: 'Perfect for beginners',
        price: 499,
        duration: '1 Month',
        duration_months: 1,
        trainer_included: false,
        facilities: JSON.stringify(['Gym Equipment Access', 'Locker Facility', 'Open 24/7'])
      },
      {
        name: 'Silver',
        description: 'Popular choice for fitness enthusiasts',
        price: 1299,
        duration: '3 Months',
        duration_months: 3,
        trainer_included: true,
        facilities: JSON.stringify(['Gym Equipment Access', 'Personal Trainer Session (4x/month)', 'Locker Facility', 'Open 24/7', 'Swimming Pool Access'])
      },
      {
        name: 'Gold',
        description: 'Premium plan with all features',
        price: 2999,
        duration: '6 Months',
        duration_months: 6,
        trainer_included: true,
        facilities: JSON.stringify(['Gym Equipment Access', 'Personal Trainer Session (8x/month)', 'Locker Facility', 'Open 24/7', 'Swimming Pool Access', 'Sauna & Steam Room', 'Nutritionist Consultation'])
      },
      {
        name: 'Platinum',
        description: 'Ultimate fitness experience',
        price: 4999,
        duration: '12 Months',
        duration_months: 12,
        trainer_included: true,
        facilities: JSON.stringify(['Gym Equipment Access', 'Personal Trainer Session (12x/month)', 'Locker Facility', 'Open 24/7', 'Swimming Pool Access', 'Sauna & Steam Room', 'Nutritionist Consultation', 'Unlimited Classes', 'VIP Access'])
      }
    ];

    for (const plan of plans) {
      try {
        await db.query(
          `INSERT INTO gym_plans (name, description, price, duration, trainer_included, facilities) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [plan.name, plan.description, plan.price, plan.duration, plan.trainer_included, plan.facilities]
        );
        console.log(`✅ Added plan: ${plan.name}`);
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.log(`⏭️  Skipping duplicate: ${plan.name}`);
        } else {
          throw err;
        }
      }
    }

    console.log('✅ Sample plans seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

seedPlans();
