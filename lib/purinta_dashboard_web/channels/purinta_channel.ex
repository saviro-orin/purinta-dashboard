defmodule PurintaDashboardWeb.PurintaChannel do
  @moduledoc "Live market snapshot channel."

  use PurintaDashboardWeb, :channel

  alias PurintaDashboard.Purinta.MarketPoller

  @impl Phoenix.Channel
  def join("purinta", _payload, socket) do
    :ok = MarketPoller.subscribe()
    {:ok, %{snapshot: MarketPoller.latest_snapshot()}, socket}
  end

  @impl Phoenix.Channel
  def handle_info({:purinta_snapshot, payload}, socket) do
    push(socket, "snapshot", payload)
    {:noreply, socket}
  end
end
