IF COL_LENGTH('dbo.paciente', 'municipio_id') IS NULL
    ALTER TABLE dbo.paciente ADD municipio_id int NULL;
GO

IF COL_LENGTH('dbo.paciente', 'departamento_id') IS NULL
    ALTER TABLE dbo.paciente ADD departamento_id int NULL;
GO

IF COL_LENGTH('dbo.paciente', 'etnia') IS NULL
    ALTER TABLE dbo.paciente ADD etnia nvarchar(20) NULL;
GO
