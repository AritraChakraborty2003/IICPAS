// Updates the login used by /admin (POST /api/employees/login → Employee collection).
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const Employee = (await import('../models/Employee.js')).default;

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, '').split('=');
    return [key, rest.join('=')];
  })
);

// --old-email: which Admin-role employee to update (optional if only one exists)
// --email / --password / --name: new values (any subset)
const { 'old-email': oldEmail, email, password, name } = args;

if (!email && !password && !name) {
  console.error(
    'Usage: node scripts/updateAdminEmployee.js [--old-email=current@x.com] [--email=new@x.com] [--password=newpass] [--name="Full Name"]'
  );
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);

try {
  let emp;
  if (oldEmail) {
    emp = await Employee.findOne({ email: oldEmail.trim().toLowerCase() });
  } else {
    const admins = await Employee.find({ role: 'Admin' });
    if (admins.length !== 1) {
      console.error(
        admins.length
          ? `❌ ${admins.length} Admin employees found, pass --old-email=: ${admins.map((a) => `${a.email} (${a.status})`).join(', ')}`
          : '❌ No Admin employees found'
      );
      process.exitCode = 1;
    }
    emp = admins.length === 1 ? admins[0] : null;
  }

  if (!emp) {
    if (!process.exitCode) console.error('❌ Employee not found');
    process.exitCode = 1;
  } else {
    if (email) {
      const newEmail = email.trim().toLowerCase();
      if (newEmail !== emp.email) {
        const clash = await Employee.findOne({ email: newEmail });
        if (clash) throw new Error(`Another employee already uses ${newEmail}`);
        emp.email = newEmail;
      }
    }
    // Plain text on purpose: Employee's pre-save hook hashes it.
    if (password) emp.password = password;
    if (name) emp.name = name;

    await emp.save();

    console.log('✅ Admin employee updated');
    console.log('Email:', emp.email);
    console.log('Name:', emp.name);
    console.log('Role:', emp.role, '| Status:', emp.status);
    if (password) console.log('Password: (updated)');
  }
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exitCode = 1;
} finally {
  await mongoose.connection.close();
}
