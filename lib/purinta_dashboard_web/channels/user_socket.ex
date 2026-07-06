defmodule PurintaDashboardWeb.UserSocket do
  @moduledoc "Anonymous public socket for live Purinta dashboard updates."

  use Phoenix.Socket

  channel "purinta", PurintaDashboardWeb.PurintaChannel

  @impl Phoenix.Socket
  def connect(_params, socket, _connect_info), do: {:ok, socket}

  @impl Phoenix.Socket
  def id(_socket), do: nil
end
