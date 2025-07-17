--
-- PostgreSQL database dump
--

-- Dumped from database version 15.13
-- Dumped by pg_dump version 15.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: contact_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.contact_type AS ENUM (
    'Client',
    'Internal',
    'Vendor',
    'Partner',
    'Consultant',
    'External Stakeholder'
);


ALTER TYPE public.contact_type OWNER TO postgres;

--
-- Name: milestone_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.milestone_type AS ENUM (
    'Requirements Complete',
    'Requirements Approved External',
    'Requirements Approved Internal',
    'Estimate Provided',
    'Sprint Confirmed',
    'UAT Started',
    'UAT Approved',
    'Deployment Date',
    'Production Release Date'
);


ALTER TYPE public.milestone_type OWNER TO postgres;

--
-- Name: task_priority; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.task_priority AS ENUM (
    'Low',
    'Medium',
    'High'
);


ALTER TYPE public.task_priority OWNER TO postgres;

--
-- Name: task_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.task_status AS ENUM (
    'Not Started',
    'In Progress',
    'Completed',
    'Blocked'
);


ALTER TYPE public.task_status OWNER TO postgres;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'Admin',
    'Manager',
    'Viewer'
);


ALTER TYPE public.user_role OWNER TO postgres;

--
-- Name: calculate_process_progress(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.calculate_process_progress(p_process_id text) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    total_tasks INTEGER;
    completed_tasks INTEGER;
    progress_percentage INTEGER;
BEGIN
    -- Count total tasks for the process
    SELECT COUNT(*) INTO total_tasks 
    FROM process_tasks 
    WHERE process_id = p_process_id;
    
    -- Count completed tasks
    SELECT COUNT(*) INTO completed_tasks 
    FROM process_tasks 
    WHERE process_id = p_process_id AND status = 'Completed';
    
    -- Calculate percentage
    IF total_tasks = 0 THEN
        progress_percentage := 0;
    ELSE
        progress_percentage := ROUND((completed_tasks::DECIMAL / total_tasks::DECIMAL) * 100);
    END IF;
    
    -- Update the process progress
    UPDATE processes 
    SET progress = progress_percentage, updated_at = NOW()
    WHERE id = p_process_id;
    
    RETURN progress_percentage;
END;
$$;


ALTER FUNCTION public.calculate_process_progress(p_process_id text) OWNER TO postgres;

--
-- Name: hash_password(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.hash_password(password text) RETURNS text
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN crypt(password, gen_salt('bf', 12));
END;
$$;


ALTER FUNCTION public.hash_password(password text) OWNER TO postgres;

--
-- Name: health_check(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.health_check() RETURNS TABLE(status text, check_timestamp timestamp without time zone)
    LANGUAGE plpgsql
    AS $$ BEGIN RETURN QUERY SELECT 'Database is healthy'::TEXT, NOW()::TIMESTAMP WITHOUT TIME ZONE; END; $$;


ALTER FUNCTION public.health_check() OWNER TO postgres;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

--
-- Name: update_user_name(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_user_name() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.name = COALESCE(NEW.first_name, '') || 
               CASE WHEN NEW.first_name IS NOT NULL AND NEW.last_name IS NOT NULL THEN ' ' ELSE '' END ||
               COALESCE(NEW.last_name, '');
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_user_name() OWNER TO postgres;

--
-- Name: verify_password(text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.verify_password(password text, hash text) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN (crypt(password, hash) = hash);
END;
$$;


ALTER FUNCTION public.verify_password(password text, hash text) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ai_chat_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_chat_messages (
    id text NOT NULL,
    session_id text NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.ai_chat_messages OWNER TO postgres;

--
-- Name: ai_chat_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_chat_sessions (
    id text NOT NULL,
    user_id character varying(255) NOT NULL,
    title text,
    model text DEFAULT 'llama2'::text NOT NULL,
    system_prompt text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.ai_chat_sessions OWNER TO postgres;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id character varying(255),
    action character varying(100) NOT NULL,
    resource_type character varying(100),
    resource_id text,
    old_values jsonb,
    new_values jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: communications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.communications (
    id text NOT NULL,
    contact_id text NOT NULL,
    type text NOT NULL,
    subject text NOT NULL,
    notes text NOT NULL,
    date text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.communications OWNER TO postgres;

--
-- Name: contact_customer_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contact_customer_assignments (
    contact_id text NOT NULL,
    customer_id text NOT NULL,
    assigned_at timestamp without time zone DEFAULT now(),
    assigned_by text
);


ALTER TABLE public.contact_customer_assignments OWNER TO postgres;

--
-- Name: contacts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contacts (
    id text NOT NULL,
    customer_id text,
    name text NOT NULL,
    title text,
    email text NOT NULL,
    phone text,
    role text,
    type public.contact_type NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.contacts OWNER TO postgres;

--
-- Name: customer_important_dates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer_important_dates (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    customer_id text NOT NULL,
    title character varying(255) NOT NULL,
    date date NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.customer_important_dates OWNER TO postgres;

--
-- Name: customer_notes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer_notes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    customer_id text NOT NULL,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.customer_notes OWNER TO postgres;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    id text NOT NULL,
    name text NOT NULL,
    phase text NOT NULL,
    contract_start_date date,
    contract_end_date date,
    logo_url text,
    avatar_color text DEFAULT '#1976D2'::text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    inactivated_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT check_contract_dates CHECK (((contract_end_date IS NULL) OR (contract_end_date >= contract_start_date)))
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- Name: disaster_test; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.disaster_test (
    id integer NOT NULL,
    data text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.disaster_test OWNER TO postgres;

--
-- Name: disaster_test_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.disaster_test_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.disaster_test_id_seq OWNER TO postgres;

--
-- Name: disaster_test_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.disaster_test_id_seq OWNED BY public.disaster_test.id;


--
-- Name: documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents (
    id text NOT NULL,
    customer_id text NOT NULL,
    name text NOT NULL,
    description text,
    category text NOT NULL,
    file_url text NOT NULL,
    file_size integer,
    mime_type text,
    uploaded_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.documents OWNER TO postgres;

--
-- Name: pharmaceutical_products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pharmaceutical_products (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    team_id text NOT NULL,
    product_name character varying(255) NOT NULL,
    ndc_number character varying(20),
    therapeutic_area character varying(255),
    indication text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.pharmaceutical_products OWNER TO postgres;

--
-- Name: process_file_transfers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.process_file_transfers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    process_id text NOT NULL,
    name character varying(255) NOT NULL,
    connection_type text NOT NULL,
    direction text NOT NULL,
    file_pattern character varying(255),
    schedule_type text,
    host character varying(255),
    port integer,
    username character varying(255),
    credential_reference text,
    remote_path text,
    local_path text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.process_file_transfers OWNER TO postgres;

--
-- Name: process_milestones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.process_milestones (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    process_id text NOT NULL,
    milestone_type public.milestone_type NOT NULL,
    achieved_date date,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.process_milestones OWNER TO postgres;

--
-- Name: process_notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.process_notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    process_id text NOT NULL,
    recipient_name character varying(255) NOT NULL,
    recipient_email character varying(255) NOT NULL,
    recipient_role character varying(100),
    event_types jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.process_notifications OWNER TO postgres;

--
-- Name: process_tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.process_tasks (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    process_id text NOT NULL,
    parent_task_id uuid,
    title character varying(255) NOT NULL,
    description text,
    status public.task_status DEFAULT 'Not Started'::public.task_status NOT NULL,
    priority public.task_priority DEFAULT 'Medium'::public.task_priority NOT NULL,
    assigned_to_id text,
    due_date date,
    completed_date date,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT check_not_self_parent CHECK ((id <> parent_task_id))
);


ALTER TABLE public.process_tasks OWNER TO postgres;

--
-- Name: process_team; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.process_team (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    process_id text NOT NULL,
    team_id text NOT NULL,
    assigned_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.process_team OWNER TO postgres;

--
-- Name: processes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.processes (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    customer_id text NOT NULL,
    jira_ticket text,
    status text NOT NULL,
    sdlc_stage text NOT NULL,
    start_date date NOT NULL,
    due_date date,
    approval_status text DEFAULT 'Pending'::text NOT NULL,
    estimate integer,
    functional_area text,
    responsible_contact_id text,
    progress integer DEFAULT 0,
    is_tpa_required boolean DEFAULT false,
    tpa_responsible_contact_id text,
    tpa_data_source text,
    tpa_start_date date,
    tpa_end_date date,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT check_process_dates CHECK (((due_date IS NULL) OR (due_date >= start_date))),
    CONSTRAINT check_progress_range CHECK (((progress >= 0) AND (progress <= 100)))
);


ALTER TABLE public.processes OWNER TO postgres;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(50) NOT NULL,
    description text,
    permissions jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: rpo_test; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rpo_test (
    id integer NOT NULL,
    data text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.rpo_test OWNER TO postgres;

--
-- Name: rpo_test_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rpo_test_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.rpo_test_id_seq OWNER TO postgres;

--
-- Name: rpo_test_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rpo_test_id_seq OWNED BY public.rpo_test.id;


--
-- Name: services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.services (
    id text NOT NULL,
    customer_id text NOT NULL,
    name text NOT NULL,
    monthly_hours integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.services OWNER TO postgres;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    sid character varying(36) NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- Name: teams; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teams (
    id text NOT NULL,
    name text NOT NULL,
    finance_code text NOT NULL,
    customer_id text NOT NULL,
    start_date date,
    end_date date,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.teams OWNER TO postgres;

--
-- Name: timeline_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.timeline_events (
    id text NOT NULL,
    customer_id text,
    process_id text,
    event_type text NOT NULL,
    title text NOT NULL,
    description text,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.timeline_events OWNER TO postgres;

--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id character varying(255) NOT NULL,
    role_id uuid NOT NULL,
    assigned_by character varying(255),
    assigned_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_roles OWNER TO postgres;

--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_sessions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id character varying(255) NOT NULL,
    session_token character varying(255) NOT NULL,
    refresh_token character varying(255),
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    last_used timestamp without time zone DEFAULT now(),
    ip_address inet,
    user_agent text
);


ALTER TABLE public.user_sessions OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    first_name character varying(255),
    last_name character varying(255),
    name character varying(255),
    role public.user_role DEFAULT 'Viewer'::public.user_role,
    avatar character varying(255),
    profile_image_url character varying(255),
    password_hash character varying(255),
    is_active boolean DEFAULT true,
    last_login timestamp without time zone,
    failed_login_attempts integer DEFAULT 0,
    locked_until timestamp without time zone,
    email_verified boolean DEFAULT false,
    email_verification_token character varying(255),
    password_reset_token character varying(255),
    password_reset_expires timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: disaster_test id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.disaster_test ALTER COLUMN id SET DEFAULT nextval('public.disaster_test_id_seq'::regclass);


--
-- Name: rpo_test id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rpo_test ALTER COLUMN id SET DEFAULT nextval('public.rpo_test_id_seq'::regclass);


--
-- Data for Name: ai_chat_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ai_chat_messages (id, session_id, role, content, created_at) FROM stdin;
\.


--
-- Data for Name: ai_chat_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ai_chat_sessions (id, user_id, title, model, system_prompt, created_at) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, user_id, action, resource_type, resource_id, old_values, new_values, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: communications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.communications (id, contact_id, type, subject, notes, date, created_at) FROM stdin;
\.


--
-- Data for Name: contact_customer_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contact_customer_assignments (contact_id, customer_id, assigned_at, assigned_by) FROM stdin;
\.


--
-- Data for Name: contacts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contacts (id, customer_id, name, title, email, phone, role, type, created_at) FROM stdin;
\.


--
-- Data for Name: customer_important_dates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customer_important_dates (id, customer_id, title, date, description, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: customer_notes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customer_notes (id, customer_id, title, content, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customers (id, name, phase, contract_start_date, contract_end_date, logo_url, avatar_color, active, inactivated_at, created_at, updated_at) FROM stdin;
1572f6bf-4f5a-4980-b271-6576c81e24e1	Test Customer	Development	2024-01-01	2024-12-31	\N	#3B82F6	t	\N	2025-07-16 19:30:42.318958	2025-07-16 19:30:42.318958
\.


--
-- Data for Name: disaster_test; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.disaster_test (id, data, created_at) FROM stdin;
1	Test data 1	2025-07-16 19:46:04.407016
2	Test data 2	2025-07-16 19:46:04.407016
3	Test data 3	2025-07-16 19:46:04.407016
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents (id, customer_id, name, description, category, file_url, file_size, mime_type, uploaded_at) FROM stdin;
\.


--
-- Data for Name: pharmaceutical_products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pharmaceutical_products (id, team_id, product_name, ndc_number, therapeutic_area, indication, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: process_file_transfers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.process_file_transfers (id, process_id, name, connection_type, direction, file_pattern, schedule_type, host, port, username, credential_reference, remote_path, local_path, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: process_milestones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.process_milestones (id, process_id, milestone_type, achieved_date, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: process_notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.process_notifications (id, process_id, recipient_name, recipient_email, recipient_role, event_types, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: process_tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.process_tasks (id, process_id, parent_task_id, title, description, status, priority, assigned_to_id, due_date, completed_date, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: process_team; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.process_team (id, process_id, team_id, assigned_at) FROM stdin;
\.


--
-- Data for Name: processes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.processes (id, name, description, customer_id, jira_ticket, status, sdlc_stage, start_date, due_date, approval_status, estimate, functional_area, responsible_contact_id, progress, is_tpa_required, tpa_responsible_contact_id, tpa_data_source, tpa_start_date, tpa_end_date, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, name, description, permissions, created_at, updated_at) FROM stdin;
27abf2c1-0fa4-47af-a5e1-27853dd99875	Admin	Full system access with all permissions	{"teams": {"read": true, "create": true, "delete": true, "update": true}, "users": {"read": true, "create": true, "delete": true, "update": true}, "system": {"audit": true, "backup": true, "restore": true, "configure": true}, "reports": {"read": true, "create": true, "delete": true, "update": true}, "contacts": {"read": true, "create": true, "delete": true, "update": true}, "services": {"read": true, "create": true, "delete": true, "update": true}, "customers": {"read": true, "create": true, "delete": true, "update": true}, "documents": {"read": true, "create": true, "delete": true, "update": true}, "processes": {"read": true, "create": true, "delete": true, "update": true}}	2025-07-16 19:16:25.121003	2025-07-16 19:16:25.121003
cc1f33d7-0d85-4564-b6c6-e92b9210be09	Manager	Management access with create/edit permissions	{"teams": {"read": true, "create": false, "delete": false, "update": false}, "users": {"read": true, "create": false, "delete": false, "update": false}, "system": {"audit": false, "backup": false, "restore": false, "configure": false}, "reports": {"read": true, "create": true, "delete": false, "update": false}, "contacts": {"read": true, "create": true, "delete": false, "update": true}, "services": {"read": true, "create": true, "delete": false, "update": true}, "customers": {"read": true, "create": true, "delete": false, "update": true}, "documents": {"read": true, "create": true, "delete": false, "update": true}, "processes": {"read": true, "create": true, "delete": false, "update": true}}	2025-07-16 19:16:25.121003	2025-07-16 19:16:25.121003
9d914c0a-83c7-4f9d-9d0b-a05e113e64c6	Viewer	Read-only access to all resources	{"teams": {"read": true, "create": false, "delete": false, "update": false}, "users": {"read": false, "create": false, "delete": false, "update": false}, "system": {"audit": false, "backup": false, "restore": false, "configure": false}, "reports": {"read": true, "create": false, "delete": false, "update": false}, "contacts": {"read": true, "create": false, "delete": false, "update": false}, "services": {"read": true, "create": false, "delete": false, "update": false}, "customers": {"read": true, "create": false, "delete": false, "update": false}, "documents": {"read": true, "create": false, "delete": false, "update": false}, "processes": {"read": true, "create": false, "delete": false, "update": false}}	2025-07-16 19:16:25.121003	2025-07-16 19:16:25.121003
\.


--
-- Data for Name: rpo_test; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rpo_test (id, data, created_at) FROM stdin;
1	RPO test data 1	2025-07-16 19:46:08.415131
2	RPO test data 2	2025-07-16 19:46:08.415131
3	RPO test data 3	2025-07-16 19:46:08.415131
4	Lost data 1	2025-07-16 19:46:08.540531
5	Lost data 2	2025-07-16 19:46:08.540531
6	RPO test data 1	2025-07-16 19:46:56.771047
7	RPO test data 2	2025-07-16 19:46:56.771047
8	RPO test data 3	2025-07-16 19:46:56.771047
9	Lost data 1	2025-07-16 19:46:56.884311
10	Lost data 2	2025-07-16 19:46:56.884311
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.services (id, customer_id, name, monthly_hours, created_at) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (sid, sess, expire) FROM stdin;
\.


--
-- Data for Name: teams; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teams (id, name, finance_code, customer_id, start_date, end_date, created_at) FROM stdin;
\.


--
-- Data for Name: timeline_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.timeline_events (id, customer_id, process_id, event_type, title, description, metadata, created_at) FROM stdin;
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_roles (id, user_id, role_id, assigned_by, assigned_at) FROM stdin;
\.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_sessions (id, user_id, session_token, refresh_token, expires_at, created_at, last_used, ip_address, user_agent) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, first_name, last_name, name, role, avatar, profile_image_url, password_hash, is_active, last_login, failed_login_attempts, locked_until, email_verified, email_verification_token, password_reset_token, password_reset_expires, created_at, updated_at) FROM stdin;
\.


--
-- Name: disaster_test_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.disaster_test_id_seq', 3, true);


--
-- Name: rpo_test_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rpo_test_id_seq', 10, true);


--
-- Name: ai_chat_messages ai_chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_chat_messages
    ADD CONSTRAINT ai_chat_messages_pkey PRIMARY KEY (id);


--
-- Name: ai_chat_sessions ai_chat_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_chat_sessions
    ADD CONSTRAINT ai_chat_sessions_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: communications communications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communications
    ADD CONSTRAINT communications_pkey PRIMARY KEY (id);


--
-- Name: contact_customer_assignments contact_customer_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact_customer_assignments
    ADD CONSTRAINT contact_customer_assignments_pkey PRIMARY KEY (contact_id, customer_id);


--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);


--
-- Name: customer_important_dates customer_important_dates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_important_dates
    ADD CONSTRAINT customer_important_dates_pkey PRIMARY KEY (id);


--
-- Name: customer_notes customer_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_notes
    ADD CONSTRAINT customer_notes_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: disaster_test disaster_test_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.disaster_test
    ADD CONSTRAINT disaster_test_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: pharmaceutical_products pharmaceutical_products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pharmaceutical_products
    ADD CONSTRAINT pharmaceutical_products_pkey PRIMARY KEY (id);


--
-- Name: process_file_transfers process_file_transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.process_file_transfers
    ADD CONSTRAINT process_file_transfers_pkey PRIMARY KEY (id);


--
-- Name: process_milestones process_milestones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.process_milestones
    ADD CONSTRAINT process_milestones_pkey PRIMARY KEY (id);


--
-- Name: process_notifications process_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.process_notifications
    ADD CONSTRAINT process_notifications_pkey PRIMARY KEY (id);


--
-- Name: process_tasks process_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.process_tasks
    ADD CONSTRAINT process_tasks_pkey PRIMARY KEY (id);


--
-- Name: process_team process_team_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.process_team
    ADD CONSTRAINT process_team_pkey PRIMARY KEY (id);


--
-- Name: process_team process_team_process_id_team_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.process_team
    ADD CONSTRAINT process_team_process_id_team_id_key UNIQUE (process_id, team_id);


--
-- Name: processes processes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.processes
    ADD CONSTRAINT processes_pkey PRIMARY KEY (id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: rpo_test rpo_test_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rpo_test
    ADD CONSTRAINT rpo_test_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- Name: timeline_events timeline_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.timeline_events
    ADD CONSTRAINT timeline_events_pkey PRIMARY KEY (id);


--
-- Name: process_milestones unique_milestone_per_process; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.process_milestones
    ADD CONSTRAINT unique_milestone_per_process UNIQUE (process_id, milestone_type);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_id_key UNIQUE (user_id, role_id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_refresh_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_refresh_token_key UNIQUE (refresh_token);


--
-- Name: user_sessions user_sessions_session_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_session_token_key UNIQUE (session_token);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_audit_logs_action; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at);


--
-- Name: idx_audit_logs_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);


--
-- Name: idx_contacts_customer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contacts_customer_id ON public.contacts USING btree (customer_id);


--
-- Name: idx_contacts_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_contacts_type ON public.contacts USING btree (type);


--
-- Name: idx_customer_important_dates_customer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customer_important_dates_customer_id ON public.customer_important_dates USING btree (customer_id);


--
-- Name: idx_customer_important_dates_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customer_important_dates_date ON public.customer_important_dates USING btree (date);


--
-- Name: idx_customer_notes_customer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customer_notes_customer_id ON public.customer_notes USING btree (customer_id);


--
-- Name: idx_customers_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customers_active ON public.customers USING btree (active);


--
-- Name: idx_customers_phase; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customers_phase ON public.customers USING btree (phase);


--
-- Name: idx_documents_customer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_documents_customer_id ON public.documents USING btree (customer_id);


--
-- Name: idx_process_file_transfers_process_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_process_file_transfers_process_id ON public.process_file_transfers USING btree (process_id);


--
-- Name: idx_process_milestones_milestone_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_process_milestones_milestone_type ON public.process_milestones USING btree (milestone_type);


--
-- Name: idx_process_milestones_process_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_process_milestones_process_id ON public.process_milestones USING btree (process_id);


--
-- Name: idx_process_notifications_process_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_process_notifications_process_id ON public.process_notifications USING btree (process_id);


--
-- Name: idx_process_tasks_assigned_to_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_process_tasks_assigned_to_id ON public.process_tasks USING btree (assigned_to_id);


--
-- Name: idx_process_tasks_due_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_process_tasks_due_date ON public.process_tasks USING btree (due_date);


--
-- Name: idx_process_tasks_parent_task_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_process_tasks_parent_task_id ON public.process_tasks USING btree (parent_task_id);


--
-- Name: idx_process_tasks_priority; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_process_tasks_priority ON public.process_tasks USING btree (priority);


--
-- Name: idx_process_tasks_process_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_process_tasks_process_id ON public.process_tasks USING btree (process_id);


--
-- Name: idx_process_tasks_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_process_tasks_status ON public.process_tasks USING btree (status);


--
-- Name: idx_process_team_process_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_process_team_process_id ON public.process_team USING btree (process_id);


--
-- Name: idx_processes_customer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_processes_customer_id ON public.processes USING btree (customer_id);


--
-- Name: idx_processes_sdlc_stage; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_processes_sdlc_stage ON public.processes USING btree (sdlc_stage);


--
-- Name: idx_processes_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_processes_status ON public.processes USING btree (status);


--
-- Name: idx_roles_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_roles_name ON public.roles USING btree (name);


--
-- Name: idx_session_expire; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_session_expire ON public.sessions USING btree (expire);


--
-- Name: idx_timeline_events_customer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_timeline_events_customer_id ON public.timeline_events USING btree (customer_id);


--
-- Name: idx_timeline_events_process_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_timeline_events_process_id ON public.timeline_events USING btree (process_id);


--
-- Name: idx_user_roles_role_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_roles_role_id ON public.user_roles USING btree (role_id);


--
-- Name: idx_user_roles_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id);


--
-- Name: idx_user_sessions_expires; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_sessions_expires ON public.user_sessions USING btree (expires_at);


--
-- Name: idx_user_sessions_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_sessions_token ON public.user_sessions USING btree (session_token);


--
-- Name: idx_user_sessions_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_sessions_user_id ON public.user_sessions USING btree (user_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_is_active ON public.users USING btree (is_active);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: customers update_customers_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: process_milestones update_process_milestones_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_process_milestones_updated_at BEFORE UPDATE ON public.process_milestones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: process_tasks update_process_tasks_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_process_tasks_updated_at BEFORE UPDATE ON public.process_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: processes update_processes_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_processes_updated_at BEFORE UPDATE ON public.processes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: roles update_roles_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_user_name_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_user_name_trigger BEFORE INSERT OR UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_user_name();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ai_chat_messages ai_chat_messages_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_chat_messages
    ADD CONSTRAINT ai_chat_messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.ai_chat_sessions(id);


--
-- Name: ai_chat_sessions ai_chat_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_chat_sessions
    ADD CONSTRAINT ai_chat_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: communications communications_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communications
    ADD CONSTRAINT communications_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id);


--
-- Name: contact_customer_assignments contact_customer_assignments_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact_customer_assignments
    ADD CONSTRAINT contact_customer_assignments_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id);


--
-- Name: contact_customer_assignments contact_customer_assignments_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact_customer_assignments
    ADD CONSTRAINT contact_customer_assignments_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: contacts contacts_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: customer_important_dates customer_important_dates_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_important_dates
    ADD CONSTRAINT customer_important_dates_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: customer_notes customer_notes_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_notes
    ADD CONSTRAINT customer_notes_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: documents documents_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: pharmaceutical_products pharmaceutical_products_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pharmaceutical_products
    ADD CONSTRAINT pharmaceutical_products_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;


--
-- Name: process_file_transfers process_file_transfers_process_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.process_file_transfers
    ADD CONSTRAINT process_file_transfers_process_id_fkey FOREIGN KEY (process_id) REFERENCES public.processes(id) ON DELETE CASCADE;


--
-- Name: process_milestones process_milestones_process_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.process_milestones
    ADD CONSTRAINT process_milestones_process_id_fkey FOREIGN KEY (process_id) REFERENCES public.processes(id) ON DELETE CASCADE;


--
-- Name: process_notifications process_notifications_process_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.process_notifications
    ADD CONSTRAINT process_notifications_process_id_fkey FOREIGN KEY (process_id) REFERENCES public.processes(id) ON DELETE CASCADE;


--
-- Name: process_tasks process_tasks_assigned_to_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.process_tasks
    ADD CONSTRAINT process_tasks_assigned_to_id_fkey FOREIGN KEY (assigned_to_id) REFERENCES public.contacts(id) ON DELETE SET NULL;


--
-- Name: process_tasks process_tasks_parent_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.process_tasks
    ADD CONSTRAINT process_tasks_parent_task_id_fkey FOREIGN KEY (parent_task_id) REFERENCES public.process_tasks(id) ON DELETE CASCADE;


--
-- Name: process_tasks process_tasks_process_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.process_tasks
    ADD CONSTRAINT process_tasks_process_id_fkey FOREIGN KEY (process_id) REFERENCES public.processes(id) ON DELETE CASCADE;


--
-- Name: process_team process_team_process_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.process_team
    ADD CONSTRAINT process_team_process_id_fkey FOREIGN KEY (process_id) REFERENCES public.processes(id) ON DELETE CASCADE;


--
-- Name: process_team process_team_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.process_team
    ADD CONSTRAINT process_team_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;


--
-- Name: processes processes_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.processes
    ADD CONSTRAINT processes_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: processes processes_responsible_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.processes
    ADD CONSTRAINT processes_responsible_contact_id_fkey FOREIGN KEY (responsible_contact_id) REFERENCES public.contacts(id);


--
-- Name: processes processes_tpa_responsible_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.processes
    ADD CONSTRAINT processes_tpa_responsible_contact_id_fkey FOREIGN KEY (tpa_responsible_contact_id) REFERENCES public.contacts(id);


--
-- Name: services services_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: teams teams_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: timeline_events timeline_events_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.timeline_events
    ADD CONSTRAINT timeline_events_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: timeline_events timeline_events_process_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.timeline_events
    ADD CONSTRAINT timeline_events_process_id_fkey FOREIGN KEY (process_id) REFERENCES public.processes(id);


--
-- Name: user_roles user_roles_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id);


--
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

