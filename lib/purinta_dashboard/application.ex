defmodule PurintaDashboard.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      PurintaDashboardWeb.Telemetry,
      PurintaDashboard.Repo,
      {DNSCluster,
       query: Application.get_env(:purinta_dashboard, :dns_cluster_query) || :ignore},
      {Phoenix.PubSub, name: PurintaDashboard.PubSub},
      # Rate-limit counters (auth throttling). Periodic cleanup keeps the
      # ETS table from growing unbounded.
      {PurintaDashboard.RateLimit, [clean_period: :timer.minutes(10)]},
      {Inertia.SSR, path: Application.app_dir(:purinta_dashboard, "priv")},
      # Start a worker by calling: PurintaDashboard.Worker.start_link(arg)
      # {PurintaDashboard.Worker, arg},
      # Start to serve requests, typically the last entry
      PurintaDashboardWeb.Endpoint
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: PurintaDashboard.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    PurintaDashboardWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
