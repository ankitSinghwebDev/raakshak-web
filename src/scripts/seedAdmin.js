/**
 * Run this once to seed the admin account in Firebase.
 * Open browser console on your running app and call: seedAdminData()
 *
 * This seeds a Super Admin with HASHED password.
 * After seeding, the credentials will be provided in the console.
 */

import { db, ref, set } from '../config/firebase'
import { hashPassword } from '../utils/hashPassword'

export const seedAdminData = async (empId, password, name) => {
  if (!empId || !password || !name) {
    console.error('Usage: seedAdminData("empId", "password", "Full Name")')
    return false
  }

  try {
    const hashedPwd = await hashPassword(password)
    await set(ref(db, 'admins/admin1'), {
      empId: empId,
      password: hashedPwd,
      name: name,
      role: 'Super Admin',
      status: 'active',
      createdAt: new Date().toISOString(),
    })
    console.log('Admin seeded successfully!')
    console.log('Employee ID:', empId)
    console.log('Password: [the one you provided]')
    console.log('Password hash:', hashedPwd)
    return true
  } catch (err) {
    console.error('Failed to seed admin:', err)
    return false
  }
}
