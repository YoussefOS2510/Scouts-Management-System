-- ==========================================================
-- Scout Organization Management Platform - PostgreSQL Functions
-- Compatible with PostgreSQL 15+ / 16+
-- ==========================================================

-- 1. Helper / Compatibility Functions for MSSQL CONVERT compatibility
CREATE OR REPLACE FUNCTION CONVERT(target_type TEXT, val DATE, style INT DEFAULT 120)
RETURNS TEXT AS $$
BEGIN
    RETURN TO_CHAR(val, 'YYYY-MM-DD');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION CONVERT(target_type TEXT, val TIMESTAMPTZ, style INT DEFAULT 120)
RETURNS TEXT AS $$
BEGIN
    IF style = 127 THEN
        RETURN TO_CHAR(val, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
    ELSE
        RETURN TO_CHAR(val, 'YYYY-MM-DD HH24:MI:SS');
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Granular Leader Permission Evaluation Function
-- 3-Tier Hierarchy:
-- Tier 1: Global Super Admin (email 'admin@scouts.org' or role 'admin' with unit_id IS NULL) -> true
-- Tier 2: Per-Leader Direct Granular Override (user_permission_overrides) -> is_granted
-- Tier 3: Base Role Fallback (user_roles -> role_permissions) -> true if found
CREATE OR REPLACE FUNCTION fn_check_leader_permission(
    p_user_id UUID,
    p_permission_key VARCHAR,
    p_unit_id INT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_has_override BOOLEAN := FALSE;
    v_override_granted BOOLEAN := FALSE;
BEGIN
    -- Tier 1: Super Admin
    IF EXISTS (
        SELECT 1 
        FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = p_user_id 
          AND r.name = 'admin'
    ) OR EXISTS (
        SELECT 1
        FROM users u
        WHERE u.id = p_user_id
          AND u.email = 'admin@scouts.org'
    ) THEN
        RETURN TRUE;
    END IF;

    -- Tier 2: Direct Override (Unit-scoped first, then global)
    SELECT TRUE, upo.is_granted
    INTO v_has_override, v_override_granted
    FROM user_permission_overrides upo
    JOIN permissions p ON p.id = upo.permission_id
    WHERE upo.user_id = p_user_id
      AND p.key = p_permission_key
      AND (
          (upo.unit_id = p_unit_id)
          OR (upo.unit_id IS NULL AND p_unit_id IS NOT NULL)
          OR (p_unit_id IS NULL AND upo.unit_id IS NULL)
      )
    ORDER BY CASE WHEN upo.unit_id = p_unit_id THEN 1 ELSE 2 END
    LIMIT 1;

    IF v_has_override THEN
        RETURN v_override_granted;
    END IF;

    -- Tier 3: Role-based permissions
    IF EXISTS (
        SELECT 1
        FROM user_roles ur
        JOIN role_permissions rp ON rp.role_id = ur.role_id
        JOIN permissions p ON p.id = rp.permission_id
        WHERE ur.user_id = p_user_id
          AND p.key = p_permission_key
          AND (
              ur.unit_id IS NULL 
              OR p_unit_id IS NULL 
              OR ur.unit_id = p_unit_id
          )
    ) THEN
        RETURN TRUE;
    END IF;

    -- Default: Deny
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql STABLE;

-- Alias for callers that do SELECT dbo.fn_check_leader_permission (creates a schema alias if needed)
CREATE SCHEMA IF NOT EXISTS dbo;
CREATE OR REPLACE FUNCTION dbo.fn_check_leader_permission(
    p_user_id UUID,
    p_permission_key VARCHAR,
    p_unit_id INT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN fn_check_leader_permission(p_user_id, p_permission_key, p_unit_id);
END;
$$ LANGUAGE plpgsql STABLE;
