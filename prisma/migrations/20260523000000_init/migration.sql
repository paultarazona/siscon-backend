CREATE TYPE "Role" AS ENUM ('ADMIN','OPERADOR','ANALISTA');
CREATE TYPE "EstadoGeneral" AS ENUM ('ACTIVO','INACTIVO');
CREATE TYPE "TipoCliente" AS ENUM ('RESIDENCIAL','COMERCIAL','INDUSTRIAL','PUBLICO');
CREATE TYPE "EstadoMedidor" AS ENUM ('ACTIVO','RETIRADO','EN_REVISION');
CREATE TYPE "EstadoLectura" AS ENUM ('VALIDA','OBSERVADA','CORREGIDA','ANULADA');
CREATE TYPE "TipoIncidencia" AS ENUM ('CONSUMO_ALTO','CONSUMO_BAJO','LECTURA_INVALIDA','MEDIDOR_OBSERVADO','SIN_LECTURA');

CREATE TABLE "Usuario" ("id" SERIAL PRIMARY KEY,"nombres" TEXT NOT NULL,"apellidos" TEXT NOT NULL,"email" TEXT NOT NULL,"passwordHash" TEXT NOT NULL,"rol" "Role" NOT NULL DEFAULT 'OPERADOR',"estado" "EstadoGeneral" NOT NULL DEFAULT 'ACTIVO',"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE "ZonaOperativa" ("id" SERIAL PRIMARY KEY,"departamento" TEXT NOT NULL,"provincia" TEXT NOT NULL,"distrito" TEXT NOT NULL,"nombreZona" TEXT NOT NULL,"codigoZona" TEXT NOT NULL,"estado" "EstadoGeneral" NOT NULL DEFAULT 'ACTIVO');
CREATE TABLE "Suministro" ("id" SERIAL PRIMARY KEY,"codigoSuministro" TEXT NOT NULL,"tipoCliente" "TipoCliente" NOT NULL,"direccionReferencial" TEXT,"zonaId" INTEGER NOT NULL,"estado" "EstadoGeneral" NOT NULL DEFAULT 'ACTIVO',"fechaAlta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE "Medidor" ("id" SERIAL PRIMARY KEY,"numeroMedidor" TEXT NOT NULL,"suministroId" INTEGER NOT NULL,"marca" TEXT,"modelo" TEXT,"fechaInstalacion" TIMESTAMP(3),"estado" "EstadoMedidor" NOT NULL DEFAULT 'ACTIVO');
CREATE TABLE "Periodo" ("id" SERIAL PRIMARY KEY,"anio" INTEGER NOT NULL,"mes" INTEGER NOT NULL,"fechaInicio" TIMESTAMP(3) NOT NULL,"fechaFin" TIMESTAMP(3) NOT NULL,"estado" "EstadoGeneral" NOT NULL DEFAULT 'ACTIVO');
CREATE TABLE "Lectura" ("id" SERIAL PRIMARY KEY,"medidorId" INTEGER NOT NULL,"periodoId" INTEGER NOT NULL,"lecturaAnterior" DECIMAL(12,2) NOT NULL,"lecturaActual" DECIMAL(12,2) NOT NULL,"consumoKwh" DECIMAL(12,2) NOT NULL,"fechaLectura" TIMESTAMP(3) NOT NULL,"estadoLectura" "EstadoLectura" NOT NULL DEFAULT 'VALIDA',"observacion" TEXT,"registradoPorId" INTEGER NOT NULL,"fechaRegistro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE "Incidencia" ("id" SERIAL PRIMARY KEY,"lecturaId" INTEGER NOT NULL,"tipoIncidencia" "TipoIncidencia" NOT NULL,"descripcion" TEXT NOT NULL,"nivel" TEXT NOT NULL,"estado" TEXT NOT NULL DEFAULT 'PENDIENTE',"fechaDeteccion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE "ImportacionDataset" ("id" SERIAL PRIMARY KEY,"nombreArchivo" TEXT NOT NULL,"totalRegistros" INTEGER NOT NULL,"registrosValidos" INTEGER NOT NULL,"registrosError" INTEGER NOT NULL,"fechaImportacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"importadoPorId" INTEGER NOT NULL,"estado" TEXT NOT NULL);

CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");
CREATE UNIQUE INDEX "ZonaOperativa_codigoZona_key" ON "ZonaOperativa"("codigoZona");
CREATE UNIQUE INDEX "Suministro_codigoSuministro_key" ON "Suministro"("codigoSuministro");
CREATE INDEX "Suministro_zonaId_idx" ON "Suministro"("zonaId");
CREATE INDEX "Suministro_tipoCliente_idx" ON "Suministro"("tipoCliente");
CREATE UNIQUE INDEX "Medidor_numeroMedidor_key" ON "Medidor"("numeroMedidor");
CREATE INDEX "Medidor_suministroId_idx" ON "Medidor"("suministroId");
CREATE UNIQUE INDEX "Periodo_anio_mes_key" ON "Periodo"("anio","mes");
CREATE UNIQUE INDEX "Lectura_medidorId_periodoId_key" ON "Lectura"("medidorId","periodoId");
CREATE INDEX "Lectura_periodoId_idx" ON "Lectura"("periodoId");
CREATE INDEX "Lectura_medidorId_idx" ON "Lectura"("medidorId");
CREATE INDEX "Lectura_registradoPorId_idx" ON "Lectura"("registradoPorId");
CREATE INDEX "Incidencia_lecturaId_idx" ON "Incidencia"("lecturaId");
CREATE INDEX "Incidencia_tipoIncidencia_idx" ON "Incidencia"("tipoIncidencia");
CREATE INDEX "ImportacionDataset_importadoPorId_idx" ON "ImportacionDataset"("importadoPorId");

ALTER TABLE "Suministro" ADD CONSTRAINT "Suministro_zonaId_fkey" FOREIGN KEY ("zonaId") REFERENCES "ZonaOperativa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Medidor" ADD CONSTRAINT "Medidor_suministroId_fkey" FOREIGN KEY ("suministroId") REFERENCES "Suministro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Lectura" ADD CONSTRAINT "Lectura_medidorId_fkey" FOREIGN KEY ("medidorId") REFERENCES "Medidor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Lectura" ADD CONSTRAINT "Lectura_periodoId_fkey" FOREIGN KEY ("periodoId") REFERENCES "Periodo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Lectura" ADD CONSTRAINT "Lectura_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Incidencia" ADD CONSTRAINT "Incidencia_lecturaId_fkey" FOREIGN KEY ("lecturaId") REFERENCES "Lectura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ImportacionDataset" ADD CONSTRAINT "ImportacionDataset_importadoPorId_fkey" FOREIGN KEY ("importadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
