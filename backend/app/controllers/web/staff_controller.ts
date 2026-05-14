import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Staff from '#models/staff'
import StaffPermission from '#models/staff_permission'
import { apiError } from '#helpers/api_response'
import {
  createStaffValidator,
  updateStaffValidator,
  updateStaffPermissionsValidator,
} from '#validators/web/staff'

export default class StaffController {
  async index({ response }: HttpContext) {
    const staffList = await Staff.query()
      .whereNull('deleted_at')
      .preload('permissions')
      .orderBy('created_at', 'desc')

    return response.send({
      data: staffList.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        is_active: s.isActive,
        permissions: s.permissionSlugs,
        created_at: s.createdAt?.toISO() ?? null,
      })),
    })
  }

  async store({ request, response }: HttpContext) {
    const body = await request.validateUsing(createStaffValidator)

    const existing = await Staff.query()
      .where('email', body.email)
      .whereNull('deleted_at')
      .first()
    if (existing) {
      return response.status(409).send(apiError('Email already in use', 'E_DUPLICATE', 'email'))
    }

    const staff = await db.transaction(async (trx) => {
      const created = await Staff.create(
        { name: body.name, email: body.email, password: body.password },
        { client: trx }
      )

      await StaffPermission.createMany(
        body.permissions.map((p) => ({ staffId: created.id, permission: p })),
        { client: trx }
      )

      return created
    })

    await staff.load('permissions')

    return response.status(201).send({
      id: staff.id,
      name: staff.name,
      email: staff.email,
      is_active: staff.isActive,
      permissions: staff.permissionSlugs,
      created_at: staff.createdAt?.toISO() ?? null,
    })
  }

  async show({ params, response }: HttpContext) {
    const staff = await Staff.query()
      .where('id', params.id)
      .whereNull('deleted_at')
      .preload('permissions')
      .first()

    if (!staff) {
      return response.status(404).send(apiError('Staff not found', 'E_NOT_FOUND'))
    }

    return response.send({
      id: staff.id,
      name: staff.name,
      email: staff.email,
      is_active: staff.isActive,
      permissions: staff.permissionSlugs,
      created_at: staff.createdAt?.toISO() ?? null,
    })
  }

  async update({ params, request, response }: HttpContext) {
    const staff = await Staff.query()
      .where('id', params.id)
      .whereNull('deleted_at')
      .first()

    if (!staff) {
      return response.status(404).send(apiError('Staff not found', 'E_NOT_FOUND'))
    }

    const body = await request.validateUsing(updateStaffValidator)

    if (body.email && body.email !== staff.email) {
      const dup = await Staff.query()
        .where('email', body.email)
        .whereNull('deleted_at')
        .whereNot('id', staff.id)
        .first()
      if (dup) {
        return response.status(409).send(apiError('Email already in use', 'E_DUPLICATE', 'email'))
      }
    }

    if (body.name !== undefined) staff.name = body.name
    if (body.email !== undefined) staff.email = body.email
    if (body.password !== undefined) staff.password = body.password
    if (body.is_active !== undefined) staff.isActive = body.is_active

    await staff.save()

    if (body.password !== undefined) {
      await Staff.accessTokens.delete(staff, staff.currentAccessToken?.identifier as number)
    }

    await staff.load('permissions')

    return response.send({
      id: staff.id,
      name: staff.name,
      email: staff.email,
      is_active: staff.isActive,
      permissions: staff.permissionSlugs,
      created_at: staff.createdAt?.toISO() ?? null,
    })
  }

  async destroy({ params, response }: HttpContext) {
    const staff = await Staff.query()
      .where('id', params.id)
      .whereNull('deleted_at')
      .first()

    if (!staff) {
      return response.status(404).send(apiError('Staff not found', 'E_NOT_FOUND'))
    }

    staff.deletedAt = new (await import('luxon')).DateTime.now()
    staff.isActive = false
    await staff.save()

    return response.send({ ok: true })
  }

  async restore({ params, response }: HttpContext) {
    const staff = await Staff.query()
      .where('id', params.id)
      .whereNotNull('deleted_at')
      .first()

    if (!staff) {
      return response.status(404).send(apiError('Staff not found', 'E_NOT_FOUND'))
    }

    staff.deletedAt = null
    staff.isActive = true
    await staff.save()

    await staff.load('permissions')

    return response.send({
      id: staff.id,
      name: staff.name,
      email: staff.email,
      is_active: staff.isActive,
      permissions: staff.permissionSlugs,
      created_at: staff.createdAt?.toISO() ?? null,
    })
  }

  async updatePermissions({ params, request, response }: HttpContext) {
    const staff = await Staff.query()
      .where('id', params.id)
      .whereNull('deleted_at')
      .first()

    if (!staff) {
      return response.status(404).send(apiError('Staff not found', 'E_NOT_FOUND'))
    }

    const body = await request.validateUsing(updateStaffPermissionsValidator)

    await db.transaction(async (trx) => {
      await StaffPermission.query({ client: trx }).where('staff_id', staff.id).delete()
      await StaffPermission.createMany(
        body.permissions.map((p) => ({ staffId: staff.id, permission: p })),
        { client: trx }
      )
    })

    await staff.load('permissions')

    return response.send({
      id: staff.id,
      name: staff.name,
      email: staff.email,
      is_active: staff.isActive,
      permissions: staff.permissionSlugs,
      created_at: staff.createdAt?.toISO() ?? null,
    })
  }
}
