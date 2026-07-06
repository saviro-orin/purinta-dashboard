defmodule PurintaDashboardWeb.UserSocketTest do
  use PurintaDashboardWeb.ChannelCase, async: true

  test "anonymous clients can connect" do
    assert {:ok, %Phoenix.Socket{}} = connect(PurintaDashboardWeb.UserSocket, %{})
  end
end
