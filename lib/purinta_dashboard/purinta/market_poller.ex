defmodule PurintaDashboard.Purinta.MarketPoller do
  @moduledoc "Polls Purinta markets and broadcasts fresh snapshots to connected dashboards."

  use GenServer
  require Logger

  alias PurintaDashboard.Purinta
  alias PurintaDashboard.Purinta.MarketSnapshot
  alias PurintaDashboard.Purinta.MorphoClient
  alias PurintaDashboard.Repo

  @topic "purinta:markets"

  def start_link(_opts), do: GenServer.start_link(__MODULE__, %{}, name: __MODULE__)

  def subscribe do
    Phoenix.PubSub.subscribe(PurintaDashboard.PubSub, @topic)
  end

  def latest_snapshot, do: Purinta.latest_snapshot()

  @impl true
  def init(state) do
    send(self(), :poll)
    {:ok, state}
  end

  @impl true
  def handle_info(:poll, state) do
    poll_once()
    schedule_poll()
    {:noreply, state}
  end

  defp poll_once do
    case MorphoClient.fetch_snapshot() do
      {:ok, attrs} ->
        %MarketSnapshot{}
        |> MarketSnapshot.changeset(attrs)
        |> Repo.insert()
        |> case do
          {:ok, snapshot} ->
            payload = MarketSnapshot.payload(snapshot)

            Phoenix.PubSub.broadcast(
              PurintaDashboard.PubSub,
              @topic,
              {:purinta_snapshot, payload}
            )

            payload

          {:error, changeset} ->
            Logger.warning("Purinta snapshot insert failed: #{inspect(changeset.errors)}")
            :error
        end

      {:error, reason} ->
        Logger.warning("Purinta snapshot fetch failed: #{inspect(reason)}")
        :error
    end
  end

  defp schedule_poll do
    Process.send_after(
      self(),
      :poll,
      Application.fetch_env!(:purinta_dashboard, :purinta_poll_interval_ms)
    )
  end
end
