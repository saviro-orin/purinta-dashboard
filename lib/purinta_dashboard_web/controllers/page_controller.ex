defmodule PurintaDashboardWeb.PageController do
  use PurintaDashboardWeb, :controller

  alias PurintaDashboard.Purinta.MarketPoller

  def home(conn, _params) do
    conn
    |> assign_prop(:snapshot, MarketPoller.latest_snapshot())
    |> render_inertia("Home")
  end
end
