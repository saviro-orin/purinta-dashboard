import Config

config :purinta_dashboard, PurintaDashboard.Repo,
  username: System.get_env("POSTGRES_USER", "postgres"),
  password: System.get_env("POSTGRES_PASSWORD", "postgres"),
  hostname: System.get_env("POSTGRES_HOST", "localhost"),
  database: System.get_env("POSTGRES_DB", "purinta_dashboard_dev"),
  stacktrace: true,
  show_sensitive_data_on_connection_error: true,
  pool_size: 10

watchers =
  if System.get_env("DISABLE_WATCHERS") in ~w(1 true) do
    []
  else
    [
      esbuild:
        {Esbuild, :install_and_run,
         [
           :purinta_dashboard,
           ~w(--sourcemap=inline --watch --define:process.env.NODE_ENV="development")
         ]},
      node: ["build/watch-ssr-pages.js", cd: Path.expand("../assets", __DIR__)],
      esbuild_ssr: {Esbuild, :install_and_run, [:purinta_dashboard_ssr, ~w(--watch)]},
      tailwind: {Tailwind, :install_and_run, [:purinta_dashboard, ~w(--watch)]}
    ]
  end

config :purinta_dashboard, PurintaDashboardWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: String.to_integer(System.get_env("PORT", "4000"))],
  url: [host: "localhost", port: String.to_integer(System.get_env("PORT", "4000"))],
  check_origin: false,
  code_reloader: true,
  debug_errors: true,
  secret_key_base: "cxv85lAQCKdwQQYuRC7eeX4DytlQDl7mBLv283CTNcnpqtcTd2lfYbJmD9oa9DgV",
  watchers: watchers

config :purinta_dashboard, PurintaDashboardWeb.Endpoint,
  live_reload: [
    web_console_logger: true,
    patterns: [
      ~r"priv/static/(?!uploads/).*\.(js|css|png|jpeg|jpg|gif|svg)$"E,
      ~r"lib/purinta_dashboard_web/router\.ex$"E,
      ~r"lib/purinta_dashboard_web/(controllers|live|components)/.*\.(ex|heex)$"E
    ]
  ]

config :purinta_dashboard, dev_routes: true
config :logger, :default_formatter, format: "[$level] $message\n"
config :phoenix, :stacktrace_depth, 20
config :phoenix, :plug_init_mode, :runtime

config :phoenix_live_view,
  debug_heex_annotations: true,
  debug_attributes: true,
  enable_expensive_runtime_checks: true
