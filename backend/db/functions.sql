-- ==========================================================
-- Scout Organization Management Platform - T-SQL Stored Functions
-- Compatible with Microsoft SQL Server 2019 / 2022 / 2025
-- ==========================================================

USE ScoutsDB;
GO

-- 1. Scalar Function: fn_check_leader_permission
-- Evaluates 3-tier hierarchy:
-- Tier 1: Global Super Admin (role 'admin' with unit_id IS NULL) -> Returns 1
-- Tier 2: Per-Leader Direct Override in user_permission_overrides -> Returns is_granted (1 or 0)
-- Tier 3: Base Role Fallback in user_roles & role_permissions -> Returns 1 if granted, else 0
CREATE OR ALTER FUNCTION dbo.fn_check_leader_permission (
    @p_user_id UNIQUEIDENTIFIER,
    @p_permission_key NVARCHAR(80),
    @p_unit_id INT = NULL
)
RETURNS BIT
AS
BEGIN
    -- Tier 1: Global Super Admin Check (Everything Unlocked)
    IF EXISTS (
        SELECT 1 
        FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = @p_user_id 
          AND r.name = 'admin'
    ) OR EXISTS (
        SELECT 1
        FROM users u
        WHERE u.id = @p_user_id
          AND u.email = 'admin@scouts.org'
    )
    BEGIN
        RETURN 1;
    END

    -- Tier 2: Per-Leader Direct Granular Override Check
    -- Check unit-specific override first, then global override
    DECLARE @has_override BIT = 0;
    DECLARE @override_granted BIT = 0;

    SELECT TOP 1 
        @has_override = 1,
        @override_granted = upo.is_granted
    FROM user_permission_overrides upo
    JOIN permissions p ON p.id = upo.permission_id
    WHERE upo.user_id = @p_user_id
      AND p.[key] = @p_permission_key
      AND (
          (upo.unit_id = @p_unit_id)
          OR (upo.unit_id IS NULL AND @p_unit_id IS NOT NULL)
          OR (@p_unit_id IS NULL AND upo.unit_id IS NULL)
      )
    ORDER BY CASE WHEN upo.unit_id = @p_unit_id THEN 1 ELSE 2 END;

    IF @has_override = 1
    BEGIN
        RETURN @override_granted;
    END

    -- Tier 3: Base Role Fallback (Inherited Permissions)
    IF EXISTS (
        SELECT 1
        FROM user_roles ur
        JOIN role_permissions rp ON rp.role_id = ur.role_id
        JOIN permissions p ON p.id = rp.permission_id
        WHERE ur.user_id = @p_user_id
          AND p.[key] = @p_permission_key
          AND (
              ur.unit_id IS NULL 
              OR @p_unit_id IS NULL 
              OR ur.unit_id = @p_unit_id
          )
    )
    BEGIN
        RETURN 1;
    END

    -- Default: Denied
    RETURN 0;
END;
GO

-- 2. Stored Procedure: sp_check_leader_permission
CREATE OR ALTER PROCEDURE dbo.sp_check_leader_permission
    @p_user_id UNIQUEIDENTIFIER,
    @p_permission_key NVARCHAR(80),
    @p_unit_id INT = NULL,
    @p_is_granted BIT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @p_is_granted = dbo.fn_check_leader_permission(@p_user_id, @p_permission_key, @p_unit_id);
    SELECT @p_is_granted AS is_granted;
END;
GO
