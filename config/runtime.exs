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
  url_port = String.to_integer(System.get_env("PHX_URL_PORT", Integer.to_string(port)))

  config :purinta_dashboard, :dns_cluster_query, System.get_env("DNS_CLUSTER_QUERY")

  endpoint_config = [
    url: [host: host, port: url_port, scheme: scheme],
    http: [ip: {0, 0, 0, 0}, port: port],
    secret_key_base: get_env!.("SECRET_KEY_BASE")
  ]

  endpoint_config =
    if System.get_env("FORCE_SSL") in ~w(true 1) do
      Keyword.put(endpoint_config, :force_ssl, rewrite_on: [:x_forwarded_proto])
    else
      endpoint_config
    end

  config :purinta_dashboard, PurintaDashboardWeb.Endpoint, endpoint_config
end
