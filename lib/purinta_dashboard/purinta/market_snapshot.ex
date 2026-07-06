defmodule PurintaDashboard.Purinta.MarketSnapshot do
  @moduledoc "Persisted Purinta market snapshot consumed by the dashboard."

  use Ecto.Schema
  import Ecto.Changeset

  alias PurintaDashboard.Purinta

  @primary_key {:id, :binary_id, autogenerate: true}
  @derive {Jason.Encoder,
           only: [
             :fetched_at,
             :block_number,
             :block_timestamp,
             :total_borrow_usdc,
             :total_supply_usdc,
             :weighted_borrow_apy,
             :markets
           ]}
  schema "market_snapshots" do
    field :fetched_at, :utc_datetime
    field :block_number, :integer
    field :block_timestamp, :utc_datetime
    field :total_borrow_usdc, :decimal
    field :total_supply_usdc, :decimal
    field :weighted_borrow_apy, :decimal
    field :markets, {:array, :map}, default: []

    timestamps(type: :utc_datetime)
  end

  def changeset(snapshot, attrs) do
    snapshot
    |> cast(attrs, [
      :fetched_at,
      :block_number,
      :block_timestamp,
      :total_borrow_usdc,
      :total_supply_usdc,
      :weighted_borrow_apy,
      :markets
    ])
    |> validate_required([
      :fetched_at,
      :total_borrow_usdc,
      :total_supply_usdc,
      :weighted_borrow_apy,
      :markets
    ])
  end

  def empty_payload do
    %{
      fetched_at: nil,
      block_number: nil,
      block_timestamp: nil,
      vault_address: Purinta.vault_address(),
      morpho_blue: Purinta.morpho_blue(),
      total_borrow_usdc: "0.000000",
      total_supply_usdc: "0.000000",
      weighted_borrow_apy: "0.00",
      markets: [],
      status: "booting"
    }
  end

  def payload(snapshot) do
    %{
      fetched_at: snapshot.fetched_at,
      block_number: snapshot.block_number,
      block_timestamp: snapshot.block_timestamp,
      vault_address: Purinta.vault_address(),
      morpho_blue: Purinta.morpho_blue(),
      total_borrow_usdc: Decimal.to_string(snapshot.total_borrow_usdc, :normal),
      total_supply_usdc: Decimal.to_string(snapshot.total_supply_usdc, :normal),
      weighted_borrow_apy: Decimal.to_string(snapshot.weighted_borrow_apy, :normal),
      markets: snapshot.markets,
      status: "live"
    }
  end
end
