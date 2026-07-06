defmodule PurintaDashboardWeb.UserChannelTest do
  use PurintaDashboardWeb.ChannelCase, async: true

  alias PurintaDashboardWeb.Endpoint
  alias PurintaDashboardWeb.UserSocket

  setup do
    user = :user |> build() |> confirmed() |> insert()
    token = Phoenix.Token.sign(Endpoint, UserSocket.token_salt(), user.id)
    {:ok, socket} = connect(UserSocket, %{"token" => token})
    %{socket: socket, user: user}
  end

  test "a user can join their own user:<id> channel", %{socket: socket, user: user} do
    assert {:ok, _, _socket} =
             subscribe_and_join(socket, PurintaDashboardWeb.UserChannel, "user:#{user.id}")
  end

  test "a user cannot join someone else's user:<id> channel", %{socket: socket} do
    other = :user |> build() |> confirmed() |> insert()

    assert {:error, %{reason: "unauthorized"}} =
             subscribe_and_join(socket, PurintaDashboardWeb.UserChannel, "user:#{other.id}")
  end
end
