defmodule PurintaDashboard.Application do
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      PurintaDashboardWeb.Telemetry,
      PurintaDashboard.Repo,
      {DNSCluster, query: Application.get_env(:purinta_dashboard, :dns_cluster_query) || :ignore},
      {Phoenix.PubSub, name: PurintaDashboard.PubSub},
      {Inertia.SSR, path: Application.app_dir(:purinta_dashboard, "priv")},
      PurintaDashboard.Purinta.MarketPoller,
      PurintaDashboardWeb.Endpoint
    ]

    opts = [strategy: :one_for_one, name: PurintaDashboard.Supervisor]
    Supervisor.start_link(children, opts)
  end

  @impl true
  def config_change(changed, _new, removed) do
    PurintaDashboardWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
