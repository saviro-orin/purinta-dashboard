defmodule PurintaDashboardWeb.PageController do
  use PurintaDashboardWeb, :controller

  def home(conn, _params) do
    render_inertia(conn, "Home")
  end
end
