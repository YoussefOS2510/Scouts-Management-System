-- ==========================================================
-- Scout Organization Management Platform - Stored Procedures
-- ==========================================================

-- Function: check_leader_permission
-- Evaluates whether user (p_user_id) is granted (p_permission_key) optionally scoped to (p_unit_id)
-- Hierarchy:
--   1. Global Super Admin (role 'group_leader' with unit_id IS NULL) -> TRUE
--   2. Direct Override (user_permission_overrides for user + perm + unit) -> is_granted (TRUE or FALSE)
--   3. Base Role Fallback (user_roles -> role_permissions for user) -> TRUE if mapped, else FALSE
CREATE OR REPLACE FUNCTION check_leader_permission(
    p_user_id UUID,
    p_permission_key VARCHAR(80),
    p_unit_id INT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_super_admin BOOLEAN := FALSE;
    v_override_granted BOOLEAN := NULL;
    v_role_granted BOOLEAN := FALSE;
    v_perm_id INT;
BEGIN
    -- Resolve permission_id
    SELECT id INTO v_perm_id
    FROM permissions
    WHERE key = p_permission_key;

    IF v_perm_id IS NULL THEN
        -- Unknown permission key
        RETURN FALSE;
    END IF;

    -- 1. Check Global Super Admin (group_leader without unit restriction)
    SELECT EXISTS (
        SELECT 1
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = p_user_id
          AND r.name = 'group_leader'
          AND ur.unit_id IS NULL
    ) INTO v_is_super_admin;

    IF v_is_super_admin THEN
        RETURN TRUE;
    END IF;

    -- 2. Check Direct Override (check unit-specific first, then global override)
    -- Unit-specific override
    IF p_unit_id IS NOT NULL THEN
        SELECT is_granted INTO v_override_granted
        FROM user_permission_overrides
        WHERE user_id = p_user_id
          AND permission_id = v_perm_id
          AND unit_id = p_unit_id;
    END IF;

    -- If no unit-specific override, check global user override (unit_id IS NULL)
    IF v_override_granted IS NULL THEN
        SELECT is_granted INTO v_override_granted
        FROM user_permission_overrides
        WHERE user_id = p_user_id
          AND permission_id = v_perm_id
          AND unit_id IS NULL;
    END IF;

    -- If an explicit override exists, it takes absolute precedence over base roles
    IF v_override_granted IS NOT NULL THEN
        RETURN v_override_granted;
    END IF;

    -- 3. Check Base Role Fallback
    -- User possesses a role that grants this permission either globally (ur.unit_id IS NULL)
    -- or specifically for the queried p_unit_id
    SELECT EXISTS (
        SELECT 1
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        WHERE ur.user_id = p_user_id
          AND rp.permission_id = v_perm_id
          AND (ur.unit_id IS NULL OR ur.unit_id = p_unit_id)
    ) INTO v_role_granted;

    RETURN v_role_granted;
END;
$$;
