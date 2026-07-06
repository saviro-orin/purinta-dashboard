import Config

config :inertia,
  endpoint: PurintaDashboardWeb.Endpoint,
  history: [encrypt: true],
  ssr: true,
  raise_on_ssr_failure: true

config :purinta_dashboard,
  ecto_repos: [PurintaDashboard.Repo],
  generators: [timestamp_type: :utc_datetime],
  purinta_poll_interval_ms: String.to_integer(System.get_env("PURINTA_POLL_INTERVAL_MS", "30000"))

config :purinta_dashboard, PurintaDashboardWeb.Endpoint,
  url: [host: "localhost"],
  adapter: Bandit.PhoenixAdapter,
  render_errors: [
    formats: [html: PurintaDashboardWeb.ErrorHTML, json: PurintaDashboardWeb.ErrorJSON],
    layout: false
  ],
  pubsub_server: PurintaDashboard.PubSub,
  live_view: [signing_salt: "c16iCWOT"]

config :esbuild,
  version: "0.28.0",
  purinta_dashboard: [
    args:
      ~w(js/app.tsx --bundle --chunk-names=chunks/[name]-[hash] --splitting --format=esm  --target=es2020 --conditions=production --loader:.woff2=file --asset-names=chunks/[name]-[hash] --outdir=../priv/static/assets --external:/fonts/* --external:/images/*),
    cd: Path.expand("../assets", __DIR__),
    env: %{"NODE_PATH" => Path.expand("../deps", __DIR__)}
  ],
  purinta_dashboard_ssr: [
    args:
      ~w(js/ssr.tsx --bundle --platform=node --format=cjs --conditions=production --loader:.css=empty --loader:.woff2=empty --outdir=../priv),
    cd: Path.expand("../assets", __DIR__),
    env: %{"NODE_PATH" => Path.expand("../deps", __DIR__)}
  ]

config :tailwind,
  version: "4.1.12",
  purinta_dashboard: [
    args: ~w(--input=assets/css/app.css --output=priv/static/assets/css/app.css),
    cd: Path.expand("..", __DIR__)
  ]

config :logger, :default_formatter,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

config :phoenix, :json_library, Jason

import_config "#{config_env()}.exs"
