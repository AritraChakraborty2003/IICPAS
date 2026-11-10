import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const Admin = (await import('../models/Admin.js')).default;

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, '').split('=');
    return [key, rest.join('=')];
  })
);

// --old-email: which superadmin to update (optional if only one superadmin exists)
// --email / --password / --name: new values (any subset)
const { 'old-email': oldEmail, email, password, name } = args;

if (!email && !password && !name) {
  console.error(
    'Usage: node scripts/updateSuperAdmin.js [--old-email=current@x.com] [--email=new@x.com] [--password=newpass] [--name="Full Name"]'
  );
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);

try {
  let admin;
  if (oldEmail) {
    admin = await Admin.findOne({ email: oldEmail, role: 'superadmin' });
  } else {
    const supers = await Admin.find({ role: 'superadmin' });
    if (supers.length > 1) {
      console.error('❌ Multiple superadmins found, pass --old-email=:', supers.map((a) => a.email).join(', '));
      process.exit(1);
    }
    admin = supers[0];
  }

  if (!admin) {
    console.error('❌ Superadmin not found');
    process.exit(1);
  }

  if (email && email !== admin.email) {
    const clash = await Admin.findOne({ email });
    if (clash) {
      console.error(`❌ Another admin already uses ${email}`);
      process.exit(1);
    }
    admin.email = email;
  }
  if (password) admin.password = await bcrypt.hash(password, 10);
  if (name) admin.name = name;
  admin.updatedAt = new Date();

  await admin.save();

  console.log('✅ Superadmin updated');
  console.log('Email:', admin.email);
  console.log('Name:', admin.name);
  if (password) console.log('Password: (updated)');
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exitCode = 1;
} finally {
  await mongoose.connection.close();
}
