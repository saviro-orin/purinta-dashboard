defmodule PurintaDashboardWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :purinta_dashboard

  @session_options [
    store: :cookie,
    key: "_purinta_dashboard_key",
    signing_salt: "aeKwL1+9",
    same_site: "Lax",
    secure: Application.compile_env(:purinta_dashboard, :session_secure, false)
  ]

  socket "/live", Phoenix.LiveView.Socket,
    websocket: [connect_info: [session: @session_options]],
    longpoll: [connect_info: [session: @session_options]]

  socket "/socket", PurintaDashboardWeb.UserSocket, websocket: true, longpoll: false

  plug Plug.Static,
    at: "/",
    from: :purinta_dashboard,
    gzip: not code_reloading?,
    only: PurintaDashboardWeb.static_paths(),
    raise_on_missing_only: code_reloading?

  if code_reloading? do
    socket "/phoenix/live_reload/socket", Phoenix.LiveReloader.Socket
    plug Phoenix.LiveReloader
    plug Phoenix.CodeReloader
    plug Phoenix.Ecto.CheckRepoStatus, otp_app: :purinta_dashboard
  end

  plug Plug.RequestId
  plug Plug.Telemetry, event_prefix: [:phoenix, :endpoint]

  plug Plug.Parsers,
    parsers: [:urlencoded, :multipart, :json],
    pass: ["*/*"],
    json_decoder: Phoenix.json_library()

  plug Plug.MethodOverride
  plug Plug.Head
  plug Plug.Session, @session_options
  plug PurintaDashboardWeb.Router
end
