defmodule PurintaDashboardWeb.Plugs.SharedData do
  @moduledoc "Minimal Inertia props shared by every page."

  import Inertia.Controller

  def init(opts), do: opts

  def call(conn, _opts) do
    conn
    |> assign_prop(:flash, conn.assigns[:flash] || %{})
    |> assign_prop(:socket_path, "/socket")
  end
end
