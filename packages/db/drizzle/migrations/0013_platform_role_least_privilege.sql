REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM dotads_platform;
--> statement-breakpoint
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM dotads_platform;
--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL PRIVILEGES ON TABLES FROM dotads_platform;
--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL PRIVILEGES ON SEQUENCES FROM dotads_platform;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE public.tenants TO dotads_platform;
--> statement-breakpoint
GRANT SELECT ON TABLE public.orders TO dotads_platform;
--> statement-breakpoint
GRANT SELECT ON TABLE public.mengantar_dispatch_queue TO dotads_platform;
--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE public.audit_logs TO dotads_platform;
