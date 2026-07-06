import Config

config :purinta_dashboard, PurintaDashboard.Repo,
  username: System.get_env("POSTGRES_USER", "postgres"),
  password: System.get_env("POSTGRES_PASSWORD", "postgres"),
  hostname: System.get_env("POSTGRES_HOST", "localhost"),
  database: "purinta_dashboard_test#{System.get_env("MIX_TEST_PARTITION")}",
  pool: Ecto.Adapters.SQL.Sandbox,
  pool_size: System.schedulers_online() * 2

config :purinta_dashboard, PurintaDashboardWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4002],
  secret_key_base: "KsgZWbuwrS5Cm+BzSXFR0V5tOLLdCWM+VQbjxPIQoHuTQ5sExs2PS5IIE+6MwVo4",
  server: false

config :purinta_dashboard, :purinta_poll_interval_ms, 3_600_000
config :inertia, ssr: false
config :logger, level: :warning
config :phoenix, :plug_init_mode, :runtime
config :phoenix, sort_verified_routes_query_params: true

config :phoenix_live_view, enable_expensive_runtime_checks: true
