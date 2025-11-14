--
-- PostgreSQL database dump
--

-- Dumped from database version 16.1
-- Dumped by pg_dump version 16.1

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: chat_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chat_sessions (
    id integer NOT NULL,
    client_id integer,
    freelancer_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.chat_sessions OWNER TO postgres;

--
-- Name: chat_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.chat_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chat_sessions_id_seq OWNER TO postgres;

--
-- Name: chat_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.chat_sessions_id_seq OWNED BY public.chat_sessions.id;


--
-- Name: client_locations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.client_locations (
    freelancer_id integer NOT NULL,
    latitude numeric(10,8),
    longitude numeric(11,8),
    client_id integer NOT NULL
);


ALTER TABLE public.client_locations OWNER TO postgres;

--
-- Name: client_locations_client_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.client_locations_client_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.client_locations_client_id_seq OWNER TO postgres;

--
-- Name: client_locations_client_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.client_locations_client_id_seq OWNED BY public.client_locations.client_id;


--
-- Name: client_locations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.client_locations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.client_locations_id_seq OWNER TO postgres;

--
-- Name: client_locations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.client_locations_id_seq OWNED BY public.client_locations.freelancer_id;


--
-- Name: freelancers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.freelancers (
    id bigint NOT NULL,
    name character varying(100) NOT NULL,
    surname character varying(99) NOT NULL,
    password character varying(98) NOT NULL,
    email character varying(30) NOT NULL,
    phone character varying(10) NOT NULL,
    occupation character varying(30) NOT NULL,
    latitude numeric(10,8),
    longitude numeric(11,8),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    images character varying(255),
    status character varying(7),
    role character varying(20),
    isavailable boolean,
    rating numeric(3, 2) DEFAULT 0.00
);


ALTER TABLE public.freelancers OWNER TO postgres;

--
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    chat_session_id integer,
    sender_type character varying(10) NOT NULL,
    sender_id integer NOT NULL,
    message_text text NOT NULL,
    sent_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messages_id_seq OWNER TO postgres;

--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: task; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task (
    id integer NOT NULL,
    client_id bigint,
    freelancer_id bigint,
    description text,
    estimated_duration character varying(50),
    completed boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    date_preference character varying(20),
    custom_date date,
    time_preference character varying(20),
    specific_time time without time zone,
    flexible boolean,
    price_per_hour character varying(50),
    status character varying(20) DEFAULT 'pending'::character varying,
    rating numeric(3, 2) DEFAULT 0.00
);


ALTER TABLE public.task OWNER TO postgres;

--
-- Name: task_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.task_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.task_id_seq OWNER TO postgres;

--
-- Name: task_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.task_id_seq OWNED BY public.task.id;
--
-- Name: user_info; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_info (
    name character varying(100) NOT NULL,
    surname character varying(99) NOT NULL,
    password character varying(98) NOT NULL,
    email character varying(97) NOT NULL,
    phone character varying(10) NOT NULL,
    username character varying(96) NOT NULL,
    id bigint NOT NULL,
    latitude numeric NOT NULL,
    longitude numeric NOT NULL,
    role character varying(20),
    status character varying(7)
);


ALTER TABLE public.user_info OWNER TO postgres;

--
-- Name: user_info_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_info_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_info_id_seq OWNER TO postgres;

--
-- Name: user_info_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_info_id_seq OWNED BY public.user_info.id;


--
-- Name: workers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.workers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.workers_id_seq OWNER TO postgres;

--
-- Name: task id; Type: DEFAULT; Schema: public; Owner: postgres
--

 ONLY public.task ALTER COLUMN id SET DEFAULT nextval('public.task_id_seq'::regclass);

--
-- Name: workers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.workers_id_seq OWNED BY public.freelancers.id;


--
-- Name: chat_sessions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_sessions ALTER COLUMN id SET DEFAULT nextval('public.chat_sessions_id_seq'::regclass);


--
-- Name: client_locations freelancer_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_locations ALTER COLUMN freelancer_id SET DEFAULT nextval('public.client_locations_id_seq'::regclass);


--
-- Name: client_locations client_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_locations ALTER COLUMN client_id SET DEFAULT nextval('public.client_locations_client_id_seq'::regclass);


--
-- Name: freelancers id; Type: DEFAULT; Schema: public; Owner: postgres
--

--
-- Data for Name: task; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task (id, client_id, freelancer_id, description, estimated_duration, completed, created_at, date_preference, custom_date, time_preference, specific_time, flexible, price_per_hour, status, rating) FROM stdin;
\.

ALTER TABLE ONLY public.freelancers ALTER COLUMN id SET DEFAULT nextval('public.workers_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: user_info id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_info ALTER COLUMN id SET DEFAULT nextval('public.user_info_id_seq'::regclass);


--
-- Data for Name: chat_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chat_sessions (id, client_id, freelancer_id, created_at) FROM stdin;
\.


--
-- Data for Name: client_locations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.client_locations (freelancer_id, latitude, longitude, client_id) FROM stdin;
\.


--
-- Data for Name: freelancers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.freelancers (id, name, surname, password, email, phone, occupation, latitude, longitude, created_at, images, status, role, isavailable, rating) FROM stdin;
177	Dylan	Dunn	$2b$10$IsalhishbBywbtO/r9JSHeFpywcPC40Zht6z3/YMDBFhhKbEQxe.W	dylandunn34@gmail.com	0834223943	Que	-29.73629540	30.97614870	2024-12-04 13:09:36.812711	images_1733310576629.jpg	offline	freelancer	f	0.00
\.


--

--
-- Name: task_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.task_id_seq', 1, false);
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.messages (id, chat_session_id, sender_type, sender_id, message_text, sent_at) FROM stdin;
\.


--
-- Data for Name: user_info; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_info (name, surname, password, email, phone, username, id, latitude, longitude, role, status) FROM stdin;
Bongumusa 	Mthembu	$2b$10$BZ.981QzeWnUaKRdQ1PbZeYRyCD0108ECM4CBnfUFaxNC7Q9EzO7K	baxmthembu@gmail.com	0651125756	Bax	14	-29.743634449814127	30.975649319702605	client	online
\.


--
-- Name: chat_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.chat_sessions_id_seq', 2, true);


--
-- Name: client_locations_client_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.client_locations_client_id_seq', 1, false);


--
-- Name: client_locations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.client_locations_id_seq', 1, false);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.messages_id_seq', 9, true);


--
-- Name: user_info_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_info_id_seq', 14, true);


--
-- Name: workers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.workers_id_seq', 177, true);


--
-- Name: chat_sessions chat_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_sessions
    ADD CONSTRAINT chat_sessions_pkey PRIMARY KEY (id);


--
-- Name: client_locations client_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_locations
    ADD CONSTRAINT client_locations_pkey PRIMARY KEY (freelancer_id);


--

--
-- Name: task task_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task
    ADD CONSTRAINT task_pkey PRIMARY KEY (id);
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: user_info user_info_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_info
    ADD CONSTRAINT user_info_email_key UNIQUE (email);


--
-- Name: user_info user_info_phone_key; Type: CONSTRAINT; Schema: public; Owner: postgres

--
-- Name: task task_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task
    ADD CONSTRAINT task_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.user_info(id);


--
-- Name: task task_freelancer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task
    ADD CONSTRAINT task_freelancer_id_fkey FOREIGN KEY (freelancer_id) REFERENCES public.freelancers(id);
--

ALTER TABLE ONLY public.user_info
    ADD CONSTRAINT user_info_phone_key UNIQUE (phone);


--
-- Name: user_info user_info_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_info
    ADD CONSTRAINT user_info_pkey PRIMARY KEY (id);


--
-- Name: user_info user_info_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_info
    ADD CONSTRAINT user_info_username_key UNIQUE (username);


--
-- Name: freelancers workers_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.freelancers
    ADD CONSTRAINT workers_email_key UNIQUE (email);


--
-- Name: freelancers workers_phone_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.freelancers
    ADD CONSTRAINT workers_phone_key UNIQUE (phone);


--
-- Name: freelancers workers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.freelancers
    ADD CONSTRAINT workers_pkey PRIMARY KEY (id);


--
-- Name: chat_sessions chat_sessions_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_sessions
    ADD CONSTRAINT chat_sessions_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.user_info(id);


--
-- Name: chat_sessions chat_sessions_freelancer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_sessions
    ADD CONSTRAINT chat_sessions_freelancer_id_fkey FOREIGN KEY (freelancer_id) REFERENCES public.freelancers(id);


--
-- Name: messages messages_chat_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_chat_session_id_fkey FOREIGN KEY (chat_session_id) REFERENCES public.chat_sessions(id);


--
-- PostgreSQL database dump complete
--

