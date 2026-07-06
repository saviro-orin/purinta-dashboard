import Config

config :purinta_dashboard, PurintaDashboardWeb.Endpoint,
  cache_static_manifest: "priv/static/cache_manifest.json"

config :inertia, raise_on_ssr_failure: false
config :logger, level: :info
