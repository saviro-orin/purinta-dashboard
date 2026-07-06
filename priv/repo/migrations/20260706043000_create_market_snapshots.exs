defmodule PurintaDashboard.Repo.Migrations.CreateMarketSnapshots do
  use Ecto.Migration

  def change do
    create table(:market_snapshots, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :fetched_at, :utc_datetime, null: false
      add :block_number, :bigint
      add :block_timestamp, :utc_datetime
      add :total_borrow_usdc, :decimal, precision: 24, scale: 6, null: false
      add :total_supply_usdc, :decimal, precision: 24, scale: 6, null: false
      add :weighted_borrow_apy, :decimal, precision: 12, scale: 6, null: false
      add :markets, {:array, :map}, null: false, default: []

      timestamps(type: :utc_datetime)
    end

    create index(:market_snapshots, [:fetched_at])
  end
end
