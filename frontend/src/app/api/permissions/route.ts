import { NextRequest, NextResponse } from 'next/server';
import { query, checkLeaderPermission, sql } from '@/lib/db';

export async function GET() {
  try {
    const [
      permissions,
      roles,
      rolePermissions,
      overrides,
      userRoles,
      users,
      units,
    ] = await Promise.all([
      query(`SELECT id, [key], category, description_en, description_ar FROM permissions ORDER BY id`),
      query(`SELECT id, name, description FROM roles ORDER BY id`),
      query(`SELECT role_id AS roleId, permission_id AS permissionId FROM role_permissions`),
      query(`SELECT id, user_id, permission_id, unit_id, is_granted FROM user_permission_overrides`),
      query(`SELECT id, user_id, role_id, unit_id FROM user_roles`),
      query(`SELECT id, email, full_name, phone, is_active FROM users ORDER BY email`),
      query(`SELECT id, code, name_ar, name_en, stage_group, gender, is_leadership, target_grade FROM units ORDER BY id`),
    ]);

    // Format all collections with proper numeric IDs
    const formattedPermissions = permissions.map((p: any) => ({
      id: Number(p.id),
      key: p.key,
      category: p.category,
      description_en: p.description_en,
      description_ar: p.description_ar,
    }));

    const formattedRoles = roles.map((r: any) => ({
      id: Number(r.id),
      name: r.name,
      description: r.description,
    }));

    const formattedRolePermissions = rolePermissions.map((rp: any) => ({
      roleId: Number(rp.roleId),
      permissionId: Number(rp.permissionId),
    }));

    const formattedOverrides = overrides.map((ov: any) => ({
      id: ov.id,
      user_id: ov.user_id,
      permission_id: Number(ov.permission_id),
      unit_id: ov.unit_id !== null && ov.unit_id !== undefined ? Number(ov.unit_id) : null,
      is_granted: Boolean(ov.is_granted),
    }));

    const formattedUserRoles = userRoles.map((ur: any) => ({
      id: ur.id,
      user_id: ur.user_id,
      role_id: Number(ur.role_id),
      unit_id: ur.unit_id !== null && ur.unit_id !== undefined ? Number(ur.unit_id) : null,
    }));

    return NextResponse.json({
      success: true,
      permissions: formattedPermissions,
      roles: formattedRoles,
      rolePermissions: formattedRolePermissions,
      overrides: formattedOverrides,
      userRoles: formattedUserRoles,
      users,
      units,
    });
  } catch (error: any) {
    console.error('Error fetching permissions from ScoutsDB:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Database query error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'override') {
      const { userId, permissionIds, unitId, unitIds, isGranted } = body;
      if (!userId || !Array.isArray(permissionIds)) {
        return NextResponse.json({ success: false, error: 'Missing userId or permissionIds' }, { status: 400 });
      }

      const targetUnits: (number | null)[] = Array.isArray(unitIds)
        ? unitIds.map((u) => (u !== null && u !== undefined ? Number(u) : null))
        : [unitId !== null && unitId !== undefined ? Number(unitId) : null];
      const cleanIsGranted = isGranted ? 1 : 0;

      for (const pId of permissionIds) {
        for (const cleanUnitId of targetUnits) {
          if (cleanUnitId !== null) {
            await query(
              `
              IF EXISTS (SELECT 1 FROM user_permission_overrides WHERE user_id = @userId AND permission_id = @permId AND unit_id = @unitId)
              BEGIN
                UPDATE user_permission_overrides
                SET is_granted = @isGranted, updated_at = SYSUTCDATETIME()
                WHERE user_id = @userId AND permission_id = @permId AND unit_id = @unitId;
              END
              ELSE
              BEGIN
                INSERT INTO user_permission_overrides (user_id, permission_id, unit_id, is_granted)
                VALUES (@userId, @permId, @unitId, @isGranted);
              END
              `,
              {
                userId: { type: sql.UniqueIdentifier, value: userId },
                permId: { type: sql.Int, value: Number(pId) },
                unitId: { type: sql.Int, value: cleanUnitId },
                isGranted: { type: sql.Bit, value: cleanIsGranted },
              }
            );
          } else {
            await query(
              `
              IF EXISTS (SELECT 1 FROM user_permission_overrides WHERE user_id = @userId AND permission_id = @permId AND unit_id IS NULL)
              BEGIN
                UPDATE user_permission_overrides
                SET is_granted = @isGranted, updated_at = SYSUTCDATETIME()
                WHERE user_id = @userId AND permission_id = @permId AND unit_id IS NULL;
              END
              ELSE
              BEGIN
                INSERT INTO user_permission_overrides (user_id, permission_id, unit_id, is_granted)
                VALUES (@userId, @permId, NULL, @isGranted);
              END
              `,
              {
                userId: { type: sql.UniqueIdentifier, value: userId },
                permId: { type: sql.Int, value: Number(pId) },
                isGranted: { type: sql.Bit, value: cleanIsGranted },
              }
            );
          }
        }
      }
    } else if (action === 'reset_module') {
      const { userId, permissionIds, unitId, unitIds } = body;
      if (!userId || !Array.isArray(permissionIds)) {
        return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
      }

      const targetUnits: (number | null)[] = Array.isArray(unitIds)
        ? unitIds.map((u) => (u !== null && u !== undefined ? Number(u) : null))
        : [unitId !== null && unitId !== undefined ? Number(unitId) : null];

      for (const pId of permissionIds) {
        for (const cleanUnitId of targetUnits) {
          if (cleanUnitId !== null) {
            await query(
              `DELETE FROM user_permission_overrides WHERE user_id = @userId AND permission_id = @permId AND unit_id = @unitId`,
              {
                userId: { type: sql.UniqueIdentifier, value: userId },
                permId: { type: sql.Int, value: Number(pId) },
                unitId: { type: sql.Int, value: cleanUnitId },
              }
            );
          } else {
            await query(
              `DELETE FROM user_permission_overrides WHERE user_id = @userId AND permission_id = @permId AND unit_id IS NULL`,
              {
                userId: { type: sql.UniqueIdentifier, value: userId },
                permId: { type: sql.Int, value: Number(pId) },
              }
            );
          }
        }
      }
    } else if (action === 'reset_all') {
      const { userId } = body;
      if (!userId) {
        return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 400 });
      }

      await query(
        `DELETE FROM user_permission_overrides WHERE user_id = @userId`,
        {
          userId: { type: sql.UniqueIdentifier, value: userId },
        }
      );
    } else if (action === 'assign_roles') {
      const { userId, unitIds, roleId } = body;
      if (!userId || !roleId) {
        return NextResponse.json({ success: false, error: 'Missing userId or roleId' }, { status: 400 });
      }

      // Delete existing roles for user
      await query(`DELETE FROM user_roles WHERE user_id = @userId`, {
        userId: { type: sql.UniqueIdentifier, value: userId },
      });

      const parsedUnitIds: number[] = Array.isArray(unitIds) ? unitIds.map(Number) : [];

      if (parsedUnitIds.length === 0) {
        await query(
          `INSERT INTO user_roles (user_id, role_id, unit_id) VALUES (@userId, @roleId, NULL)`,
          {
            userId: { type: sql.UniqueIdentifier, value: userId },
            roleId: { type: sql.Int, value: Number(roleId) },
          }
        );
      } else {
        for (const uId of parsedUnitIds) {
          await query(
            `INSERT INTO user_roles (user_id, role_id, unit_id) VALUES (@userId, @roleId, @unitId)`,
            {
              userId: { type: sql.UniqueIdentifier, value: userId },
              roleId: { type: sql.Int, value: Number(roleId) },
              unitId: { type: sql.Int, value: uId },
            }
          );
        }
      }
    } else if (action === 'create_leader') {
      const { full_name, email, phone, role_id, unit_ids } = body;
      if (!full_name || !email || !role_id) {
        return NextResponse.json({ success: false, error: 'Missing required leader fields' }, { status: 400 });
      }

      // Check if email already exists
      const existing = await query(`SELECT id FROM users WHERE email = @email`, {
        email: { type: sql.NVarChar(255), value: email.trim().toLowerCase() },
      });

      let userId = existing[0]?.id;

      if (!userId) {
        const insertUser = await query(
          `
          DECLARE @newUserId UNIQUEIDENTIFIER = NEWID();
          INSERT INTO users (id, email, password_hash, full_name, phone, is_active)
          VALUES (@newUserId, @email, 'hash_placeholder', @fullName, @phone, 1);
          SELECT @newUserId AS id;
          `,
          {
            email: { type: sql.NVarChar(255), value: email.trim().toLowerCase() },
            fullName: { type: sql.NVarChar(150), value: full_name.trim() },
            phone: { type: sql.NVarChar(20), value: phone ? phone.trim() : null },
          }
        );
        userId = insertUser[0]?.id;
      }

      // Assign roles
      const parsedUnitIds: number[] = Array.isArray(unit_ids) ? unit_ids.map(Number) : [];
      await query(`DELETE FROM user_roles WHERE user_id = @userId`, {
        userId: { type: sql.UniqueIdentifier, value: userId },
      });

      if (parsedUnitIds.length === 0) {
        await query(
          `INSERT INTO user_roles (user_id, role_id, unit_id) VALUES (@userId, @roleId, NULL)`,
          {
            userId: { type: sql.UniqueIdentifier, value: userId },
            roleId: { type: sql.Int, value: Number(role_id) },
          }
        );
      } else {
        for (const uId of parsedUnitIds) {
          await query(
            `INSERT INTO user_roles (user_id, role_id, unit_id) VALUES (@userId, @roleId, @unitId)`,
            {
              userId: { type: sql.UniqueIdentifier, value: userId },
              roleId: { type: sql.Int, value: Number(role_id) },
              unitId: { type: sql.Int, value: uId },
            }
          );
        }
      }
    } else {
      return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
    }

    // Return the updated overrides and user_roles
    const [overrides, userRoles, users] = await Promise.all([
      query(`SELECT id, user_id, permission_id, unit_id, is_granted FROM user_permission_overrides`),
      query(`SELECT id, user_id, role_id, unit_id FROM user_roles`),
      query(`SELECT id, email, full_name, phone, is_active FROM users ORDER BY email`),
    ]);

    const formattedOverrides = overrides.map((ov: any) => ({
      id: ov.id,
      user_id: ov.user_id,
      permission_id: Number(ov.permission_id),
      unit_id: ov.unit_id !== null && ov.unit_id !== undefined ? Number(ov.unit_id) : null,
      is_granted: Boolean(ov.is_granted),
    }));

    const formattedUserRoles = userRoles.map((ur: any) => ({
      id: ur.id,
      user_id: ur.user_id,
      role_id: Number(ur.role_id),
      unit_id: ur.unit_id !== null && ur.unit_id !== undefined ? Number(ur.unit_id) : null,
    }));

    return NextResponse.json({
      success: true,
      overrides: formattedOverrides,
      userRoles: formattedUserRoles,
      users,
    });
  } catch (error: any) {
    console.error('Error modifying permissions in ScoutsDB:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Database update error' },
      { status: 500 }
    );
  }
}
