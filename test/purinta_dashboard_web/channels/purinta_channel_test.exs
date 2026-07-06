defmodule PurintaDashboardWeb.PurintaChannelTest do
  use PurintaDashboardWeb.ChannelCase, async: true

  test "joins the public Purinta channel" do
    {:ok, socket} = connect(PurintaDashboardWeb.UserSocket, %{})

    assert {:ok, %{snapshot: snapshot}, _socket} =
             subscribe_and_join(socket, PurintaDashboardWeb.PurintaChannel, "purinta")

    assert is_map(snapshot)
  end
end
