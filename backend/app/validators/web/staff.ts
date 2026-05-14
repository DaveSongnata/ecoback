import vine from '@vinejs/vine'
import { VALID_PERMISSIONS } from '#models/staff_permission'

export const createStaffValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(120),
    email: vine.string().email().normalizeEmail(),
    password: vine.string().minLength(8).maxLength(128),
    permissions: vine.array(vine.enum(VALID_PERMISSIONS)).minLength(1),
  })
)

export const updateStaffValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(120).optional(),
    email: vine.string().email().normalizeEmail().optional(),
    password: vine.string().minLength(8).maxLength(128).optional(),
    is_active: vine.boolean().optional(),
  })
)

export const updateStaffPermissionsValidator = vine.compile(
  vine.object({
    permissions: vine.array(vine.enum(VALID_PERMISSIONS)).minLength(1),
  })
)
