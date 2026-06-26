import mongoose from 'mongoose';
import About from './models/Website/About.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkAboutDocs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/iicpa');
    console.log('Connected to DB');
    const docs = await About.find();
    console.log('Total About documents found:', docs.length);
    for (const doc of docs) {
      console.log('---------------------------');
      console.log('ID:', doc._id);
      console.log('Title:', doc.title);
      console.log('Content:', doc.content);
      console.log('IsActive:', doc.isActive);
      console.log('Colors:', doc.colors);
      console.log('Video:', doc.video);
      console.log('Button:', doc.button);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

checkAboutDocs();
