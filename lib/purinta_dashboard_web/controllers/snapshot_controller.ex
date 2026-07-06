defmodule PurintaDashboardWeb.SnapshotController do
  use PurintaDashboardWeb, :controller

  alias PurintaDashboard.Purinta.MarketPoller

  def show(conn, _params) do
    json(conn, MarketPoller.latest_snapshot())
  end
end
