import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Staff from '#models/staff'
import StaffPermission, { VALID_PERMISSIONS } from '#models/staff_permission'

export default class StaffAdminSeeder extends BaseSeeder {
  async run() {
    const email = 'admin@ecoamazonia.app'

    const existing = await Staff.findBy('email', email)
    if (existing) return

    const admin = await Staff.create({
      name: 'Administrador',
      email,
      password: 'admin1234',
    })

    await StaffPermission.createMany(
      VALID_PERMISSIONS.map((p) => ({
        staffId: admin.id,
        permission: p,
      }))
    )
  }
}
