defmodule PurintaDashboardWeb.Router do
  use PurintaDashboardWeb, :router

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_live_flash
    plug :put_root_layout, html: {PurintaDashboardWeb.Layouts, :root}
    plug :protect_from_forgery
    plug :put_secure_browser_headers
    plug Inertia.Plug
    plug PurintaDashboardWeb.Plugs.SharedData
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/", PurintaDashboardWeb do
    pipe_through :browser

    get "/", PageController, :home
  end

  scope "/api", PurintaDashboardWeb do
    pipe_through :api

    get "/snapshot", SnapshotController, :show
  end

  scope "/", PurintaDashboardWeb do
    pipe_through :api

    get "/health", HealthController, :show
  end
end
