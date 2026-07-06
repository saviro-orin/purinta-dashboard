defmodule PurintaDashboard.Purinta do
  @moduledoc "Purinta market constants and read helpers."

  alias PurintaDashboard.Purinta.Market
  alias PurintaDashboard.Purinta.MarketSnapshot
  alias PurintaDashboard.Repo

  @vault_address "0xc92A37Fd0250F4eecF092960a2F70A1334217528"
  @morpho_blue "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb"
  @usdc "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"

  @markets [
    %Market{
      id: "0xde2bb82278de27e7851625e2d7c25280adc6d499c000cc6904eb0ab29124a481",
      name: "PEPE / USDC",
      loan_symbol: "USDC",
      collateral_symbol: "PEPE",
      loan_address: @usdc,
      collateral_address: "0x6982508145454Ce325dDbE47a25d4ec3d2311933",
      oracle_address: "0xAe53190c12cb206A497EB45d2be1dd0A87046501",
      lltv: 0.625
    },
    %Market{
      id: "0x31a277fde40c1bd37dd00cb2167fe1d5831b450efecc63323679228a101e9979",
      name: "SPX / USDC",
      loan_symbol: "USDC",
      collateral_symbol: "SPX",
      loan_address: @usdc,
      collateral_address: "0xE0f63A424a4439cBE457D80E4f4b51aD25b2c56C",
      oracle_address: "0x5D4ad982F7F67003c7F0c2F1807f7c3d08B80c8b",
      lltv: 0.625
    }
  ]

  def vault_address, do: @vault_address
  def morpho_blue, do: @morpho_blue
  def markets, do: @markets

  def latest_snapshot do
    import Ecto.Query

    query = from snapshot in MarketSnapshot, order_by: [desc: snapshot.fetched_at], limit: 1

    case Repo.one(query) do
      nil -> MarketSnapshot.empty_payload()
      snapshot -> MarketSnapshot.payload(snapshot)
    end
  end
end
