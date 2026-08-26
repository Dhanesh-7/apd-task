import { connectDB, disconnectDB } from '../db.js';
import { seedDatabase } from './seedData.js';

async function run() {
  try {
    await connectDB();
    await seedDatabase();
    console.log('Seed completed successfully.');
    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

run();
