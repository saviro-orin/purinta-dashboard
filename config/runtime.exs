import Config

if System.get_env("PHX_SERVER") do
  config :purinta_dashboard, PurintaDashboardWeb.Endpoint, server: true
end

if config_env() == :prod do
  get_env! = fn name ->
    System.get_env(name) || raise("environment variable #{name} is missing")
  end

  maybe_ipv6 = if System.get_env("ECTO_IPV6") in ~w(true 1), do: [:inet6], else: []

  config :purinta_dashboard, PurintaDashboard.Repo,
    url: get_env!.("DATABASE_URL"),
    pool_size: String.to_integer(System.get_env("POOL_SIZE", "10")),
    socket_options: maybe_ipv6

  host = System.get_env("PHX_HOST", "localhost")
  port = String.to_integer(System.get_env("PORT", "4000"))
  scheme = System.get_env("PHX_SCHEME", "http")

  config :purinta_dashboard, :dns_cluster_query, System.get_env("DNS_CLUSTER_QUERY")

  config :purinta_dashboard, PurintaDashboardWeb.Endpoint,
    url: [
      host: host,
      port: String.to_integer(System.get_env("PHX_URL_PORT", Integer.to_string(port))),
      scheme: scheme
    ],
    http: [ip: {0, 0, 0, 0}, port: port],
    secret_key_base: get_env!.("SECRET_KEY_BASE"),
    force_ssl: System.get_env("FORCE_SSL") in ~w(true 1)
end
