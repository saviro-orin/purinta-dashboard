defmodule PurintaDashboardWeb.ConnCase do
  @moduledoc "Test case for controller tests."

  use ExUnit.CaseTemplate

  using do
    quote do
      @endpoint PurintaDashboardWeb.Endpoint

      use PurintaDashboardWeb, :verified_routes

      import Plug.Conn
      import Phoenix.ConnTest
      import PurintaDashboardWeb.ConnCase
    end
  end

  setup tags do
    PurintaDashboard.DataCase.setup_sandbox(tags)
    {:ok, conn: Phoenix.ConnTest.build_conn()}
  end
end
