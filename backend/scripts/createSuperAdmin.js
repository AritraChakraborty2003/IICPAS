import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const Admin = await import('../models/Admin.js').then((m) => m.default);

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, '').split('=');
    return [key, rest.join('=')];
  })
);

const adminData = {
  name: args.name || 'Super Admin',
  email: args.email,
  password: args.password,
  role: 'superadmin',
};

if (!adminData.email || !adminData.password) {
  console.error('Usage: node scripts/createSuperAdmin.js --email=you@example.com --password=yourpass [--name="Full Name"]');
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function createSuperAdmin() {
  try {
    const existingAdmin = await Admin.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      return;
    }

    const hashedPassword = await bcrypt.hash(adminData.password, 10);

    const admin = new Admin({
      ...adminData,
      password: hashedPassword,
    });

    await admin.save();

    console.log('✅ Superadmin created successfully!');
    console.log('Email:', admin.email);
    console.log('Password:', adminData.password);
    console.log('Role:', admin.role);
  } catch (error) {
    console.error('❌ Error creating superadmin:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

createSuperAdmin();
