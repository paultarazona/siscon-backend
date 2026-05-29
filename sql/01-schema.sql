--
-- PostgreSQL database dump
--


-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: EstadoGeneral; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EstadoGeneral" AS ENUM (
    'ACTIVO',
    'INACTIVO'
);


--
-- Name: EstadoLectura; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EstadoLectura" AS ENUM (
    'VALIDA',
    'OBSERVADA',
    'CORREGIDA',
    'ANULADA'
);


--
-- Name: EstadoMedidor; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EstadoMedidor" AS ENUM (
    'ACTIVO',
    'RETIRADO',
    'EN_REVISION'
);


--
-- Name: Role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Role" AS ENUM (
    'ADMIN',
    'OPERADOR',
    'ANALISTA'
);


--
-- Name: TipoCliente; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TipoCliente" AS ENUM (
    'RESIDENCIAL',
    'COMERCIAL',
    'INDUSTRIAL',
    'PUBLICO'
);


--
-- Name: TipoIncidencia; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TipoIncidencia" AS ENUM (
    'CONSUMO_ALTO',
    'CONSUMO_BAJO',
    'LECTURA_INVALIDA',
    'MEDIDOR_OBSERVADO',
    'SIN_LECTURA'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ImportacionDataset; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ImportacionDataset" (
    id integer NOT NULL,
    "nombreArchivo" text NOT NULL,
    "totalRegistros" integer NOT NULL,
    "registrosValidos" integer NOT NULL,
    "registrosError" integer NOT NULL,
    "fechaImportacion" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "importadoPorId" integer NOT NULL,
    estado text NOT NULL
);


--
-- Name: ImportacionDataset_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."ImportacionDataset_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ImportacionDataset_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."ImportacionDataset_id_seq" OWNED BY public."ImportacionDataset".id;


--
-- Name: Incidencia; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Incidencia" (
    id integer NOT NULL,
    "lecturaId" integer NOT NULL,
    "tipoIncidencia" public."TipoIncidencia" NOT NULL,
    descripcion text NOT NULL,
    nivel text NOT NULL,
    estado text DEFAULT 'PENDIENTE'::text NOT NULL,
    "fechaDeteccion" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Incidencia_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Incidencia_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Incidencia_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Incidencia_id_seq" OWNED BY public."Incidencia".id;


--
-- Name: Lectura; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Lectura" (
    id integer NOT NULL,
    "medidorId" integer NOT NULL,
    "periodoId" integer NOT NULL,
    "lecturaAnterior" numeric(12,2) NOT NULL,
    "lecturaActual" numeric(12,2) NOT NULL,
    "consumoKwh" numeric(12,2) NOT NULL,
    "fechaLectura" timestamp(3) without time zone NOT NULL,
    "estadoLectura" public."EstadoLectura" DEFAULT 'VALIDA'::public."EstadoLectura" NOT NULL,
    observacion text,
    "registradoPorId" integer NOT NULL,
    "fechaRegistro" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Lectura_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Lectura_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Lectura_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Lectura_id_seq" OWNED BY public."Lectura".id;


--
-- Name: Medidor; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Medidor" (
    id integer NOT NULL,
    "numeroMedidor" text NOT NULL,
    "suministroId" integer NOT NULL,
    marca text,
    modelo text,
    "fechaInstalacion" timestamp(3) without time zone,
    estado public."EstadoMedidor" DEFAULT 'ACTIVO'::public."EstadoMedidor" NOT NULL
);


--
-- Name: Medidor_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Medidor_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Medidor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Medidor_id_seq" OWNED BY public."Medidor".id;


--
-- Name: Periodo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Periodo" (
    id integer NOT NULL,
    anio integer NOT NULL,
    mes integer NOT NULL,
    "fechaInicio" timestamp(3) without time zone NOT NULL,
    "fechaFin" timestamp(3) without time zone NOT NULL,
    estado public."EstadoGeneral" DEFAULT 'ACTIVO'::public."EstadoGeneral" NOT NULL
);


--
-- Name: Periodo_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Periodo_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Periodo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Periodo_id_seq" OWNED BY public."Periodo".id;


--
-- Name: Suministro; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Suministro" (
    id integer NOT NULL,
    "codigoSuministro" text NOT NULL,
    "tipoCliente" public."TipoCliente" NOT NULL,
    "direccionReferencial" text,
    "zonaId" integer NOT NULL,
    estado public."EstadoGeneral" DEFAULT 'ACTIVO'::public."EstadoGeneral" NOT NULL,
    "fechaAlta" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Suministro_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Suministro_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Suministro_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Suministro_id_seq" OWNED BY public."Suministro".id;


--
-- Name: Usuario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Usuario" (
    id integer NOT NULL,
    nombres text NOT NULL,
    apellidos text NOT NULL,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    rol public."Role" DEFAULT 'OPERADOR'::public."Role" NOT NULL,
    estado public."EstadoGeneral" DEFAULT 'ACTIVO'::public."EstadoGeneral" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Usuario_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Usuario_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Usuario_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Usuario_id_seq" OWNED BY public."Usuario".id;


--
-- Name: ZonaOperativa; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ZonaOperativa" (
    id integer NOT NULL,
    departamento text NOT NULL,
    provincia text NOT NULL,
    distrito text NOT NULL,
    "nombreZona" text NOT NULL,
    "codigoZona" text NOT NULL,
    estado public."EstadoGeneral" DEFAULT 'ACTIVO'::public."EstadoGeneral" NOT NULL
);


--
-- Name: ZonaOperativa_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."ZonaOperativa_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ZonaOperativa_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."ZonaOperativa_id_seq" OWNED BY public."ZonaOperativa".id;


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: ImportacionDataset id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ImportacionDataset" ALTER COLUMN id SET DEFAULT nextval('public."ImportacionDataset_id_seq"'::regclass);


--
-- Name: Incidencia id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Incidencia" ALTER COLUMN id SET DEFAULT nextval('public."Incidencia_id_seq"'::regclass);


--
-- Name: Lectura id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Lectura" ALTER COLUMN id SET DEFAULT nextval('public."Lectura_id_seq"'::regclass);


--
-- Name: Medidor id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Medidor" ALTER COLUMN id SET DEFAULT nextval('public."Medidor_id_seq"'::regclass);


--
-- Name: Periodo id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Periodo" ALTER COLUMN id SET DEFAULT nextval('public."Periodo_id_seq"'::regclass);


--
-- Name: Suministro id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Suministro" ALTER COLUMN id SET DEFAULT nextval('public."Suministro_id_seq"'::regclass);


--
-- Name: Usuario id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Usuario" ALTER COLUMN id SET DEFAULT nextval('public."Usuario_id_seq"'::regclass);


--
-- Name: ZonaOperativa id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ZonaOperativa" ALTER COLUMN id SET DEFAULT nextval('public."ZonaOperativa_id_seq"'::regclass);


--
-- Name: ImportacionDataset ImportacionDataset_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ImportacionDataset"
    ADD CONSTRAINT "ImportacionDataset_pkey" PRIMARY KEY (id);


--
-- Name: Incidencia Incidencia_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Incidencia"
    ADD CONSTRAINT "Incidencia_pkey" PRIMARY KEY (id);


--
-- Name: Lectura Lectura_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Lectura"
    ADD CONSTRAINT "Lectura_pkey" PRIMARY KEY (id);


--
-- Name: Medidor Medidor_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Medidor"
    ADD CONSTRAINT "Medidor_pkey" PRIMARY KEY (id);


--
-- Name: Periodo Periodo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Periodo"
    ADD CONSTRAINT "Periodo_pkey" PRIMARY KEY (id);


--
-- Name: Suministro Suministro_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Suministro"
    ADD CONSTRAINT "Suministro_pkey" PRIMARY KEY (id);


--
-- Name: Usuario Usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Usuario"
    ADD CONSTRAINT "Usuario_pkey" PRIMARY KEY (id);


--
-- Name: ZonaOperativa ZonaOperativa_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ZonaOperativa"
    ADD CONSTRAINT "ZonaOperativa_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: ImportacionDataset_importadoPorId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ImportacionDataset_importadoPorId_idx" ON public."ImportacionDataset" USING btree ("importadoPorId");


--
-- Name: Incidencia_lecturaId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Incidencia_lecturaId_idx" ON public."Incidencia" USING btree ("lecturaId");


--
-- Name: Incidencia_tipoIncidencia_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Incidencia_tipoIncidencia_idx" ON public."Incidencia" USING btree ("tipoIncidencia");


--
-- Name: Lectura_medidorId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Lectura_medidorId_idx" ON public."Lectura" USING btree ("medidorId");


--
-- Name: Lectura_medidorId_periodoId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Lectura_medidorId_periodoId_key" ON public."Lectura" USING btree ("medidorId", "periodoId");


--
-- Name: Lectura_periodoId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Lectura_periodoId_idx" ON public."Lectura" USING btree ("periodoId");


--
-- Name: Lectura_registradoPorId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Lectura_registradoPorId_idx" ON public."Lectura" USING btree ("registradoPorId");


--
-- Name: Medidor_numeroMedidor_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Medidor_numeroMedidor_key" ON public."Medidor" USING btree ("numeroMedidor");


--
-- Name: Medidor_suministroId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Medidor_suministroId_idx" ON public."Medidor" USING btree ("suministroId");


--
-- Name: Periodo_anio_mes_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Periodo_anio_mes_key" ON public."Periodo" USING btree (anio, mes);


--
-- Name: Suministro_codigoSuministro_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Suministro_codigoSuministro_key" ON public."Suministro" USING btree ("codigoSuministro");


--
-- Name: Suministro_tipoCliente_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Suministro_tipoCliente_idx" ON public."Suministro" USING btree ("tipoCliente");


--
-- Name: Suministro_zonaId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Suministro_zonaId_idx" ON public."Suministro" USING btree ("zonaId");


--
-- Name: Usuario_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Usuario_email_key" ON public."Usuario" USING btree (email);


--
-- Name: ZonaOperativa_codigoZona_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ZonaOperativa_codigoZona_key" ON public."ZonaOperativa" USING btree ("codigoZona");


--
-- Name: ImportacionDataset ImportacionDataset_importadoPorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ImportacionDataset"
    ADD CONSTRAINT "ImportacionDataset_importadoPorId_fkey" FOREIGN KEY ("importadoPorId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Incidencia Incidencia_lecturaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Incidencia"
    ADD CONSTRAINT "Incidencia_lecturaId_fkey" FOREIGN KEY ("lecturaId") REFERENCES public."Lectura"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Lectura Lectura_medidorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Lectura"
    ADD CONSTRAINT "Lectura_medidorId_fkey" FOREIGN KEY ("medidorId") REFERENCES public."Medidor"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Lectura Lectura_periodoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Lectura"
    ADD CONSTRAINT "Lectura_periodoId_fkey" FOREIGN KEY ("periodoId") REFERENCES public."Periodo"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Lectura Lectura_registradoPorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Lectura"
    ADD CONSTRAINT "Lectura_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Medidor Medidor_suministroId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Medidor"
    ADD CONSTRAINT "Medidor_suministroId_fkey" FOREIGN KEY ("suministroId") REFERENCES public."Suministro"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Suministro Suministro_zonaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Suministro"
    ADD CONSTRAINT "Suministro_zonaId_fkey" FOREIGN KEY ("zonaId") REFERENCES public."ZonaOperativa"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--


