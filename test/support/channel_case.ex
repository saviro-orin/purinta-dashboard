defmodule PurintaDashboardWeb.ChannelCase do
  @moduledoc "Test case for Phoenix channel tests."

  use ExUnit.CaseTemplate

  using do
    quote do
      import Phoenix.ChannelTest
      import PurintaDashboardWeb.ChannelCase

      @endpoint PurintaDashboardWeb.Endpoint
    end
  end

  setup tags do
    PurintaDashboard.DataCase.setup_sandbox(tags)
    :ok
  end
end
