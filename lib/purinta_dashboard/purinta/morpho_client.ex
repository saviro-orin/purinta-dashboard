defmodule PurintaDashboard.Purinta.MorphoClient do
  @moduledoc "Fetches current Morpho market state for Purinta markets."

  alias PurintaDashboard.Purinta

  @endpoint "https://blue-api.morpho.org/graphql"

  @query """
  query($id: String!) {
    marketById(marketId: $id, chainId: 1) {
      marketId
      lltv
      loanAsset { symbol address decimals }
      collateralAsset { symbol address }
      state {
        borrowAssets
        borrowAssetsUsd
        supplyAssets
        supplyAssetsUsd
        utilization
        borrowApy
        supplyApy
        netSupplyApy
      }
    }
  }
  """

  def fetch_snapshot do
    with {:ok, block} <- fetch_block(),
         {:ok, markets} <- fetch_markets() do
      {:ok, build_snapshot(markets, block)}
    end
  end

  defp fetch_markets do
    results = Enum.map(Purinta.markets(), &fetch_market/1)

    case Enum.split_with(results, &match?({:ok, _}, &1)) do
      {successful, []} -> {:ok, Enum.map(successful, fn {:ok, market} -> market end)}
      {_successful, failures} -> {:error, {:markets_failed, failures}}
    end
  end

  defp fetch_market(market) do
    body = %{query: @query, variables: %{id: market.id}}

    case Req.post(@endpoint, json: body, receive_timeout: 15_000) do
      {:ok, %{status: 200, body: %{"data" => %{"marketById" => api_market}}}}
      when not is_nil(api_market) ->
        {:ok, normalize_market(market, api_market)}

      {:ok, response} ->
        {:error, {:unexpected_response, response.status, response.body}}

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp fetch_block do
    query = "{ _meta { block { number timestamp } } }"

    case Req.post(@endpoint, json: %{query: query}, receive_timeout: 15_000) do
      {:ok, %{status: 200, body: %{"data" => %{"_meta" => %{"block" => block}}}}} -> {:ok, block}
      {:ok, _response} -> {:ok, %{}}
      {:error, _reason} -> {:ok, %{}}
    end
  end

  defp normalize_market(local, %{"state" => state}) do
    borrow_assets = dec(state["borrowAssets"] || 0, 6)
    supply_assets = dec(state["supplyAssets"] || 0, 6)
    utilization = decimal_percent(state["utilization"] || 0)
    borrow_apy = decimal_percent(state["borrowApy"] || 0)
    supply_apy = decimal_percent(state["supplyApy"] || 0)
    net_supply_apy = decimal_percent(state["netSupplyApy"] || state["supplyApy"] || 0)

    %{
      id: local.id,
      name: local.name,
      loan_symbol: local.loan_symbol,
      collateral_symbol: local.collateral_symbol,
      collateral_address: local.collateral_address,
      oracle_address: local.oracle_address,
      lltv: Decimal.to_string(decimal_percent(local.lltv), :normal),
      borrow_usdc: Decimal.to_string(borrow_assets, :normal),
      borrow_usd: format_float(state["borrowAssetsUsd"] || 0),
      supply_usdc: Decimal.to_string(supply_assets, :normal),
      supply_usd: format_float(state["supplyAssetsUsd"] || 0),
      utilization: Decimal.to_string(utilization, :normal),
      borrow_apy: Decimal.to_string(borrow_apy, :normal),
      supply_apy: Decimal.to_string(supply_apy, :normal),
      net_supply_apy: Decimal.to_string(net_supply_apy, :normal)
    }
  end

  defp build_snapshot(markets, block) do
    total_borrow = sum_decimal(markets, :borrow_usdc)
    total_supply = sum_decimal(markets, :supply_usdc)

    weighted_borrow_apy =
      if Decimal.equal?(total_borrow, Decimal.new(0)) do
        Decimal.new(0)
      else
        markets
        |> Enum.reduce(Decimal.new(0), fn market, acc ->
          Decimal.add(
            acc,
            Decimal.mult(Decimal.new(market.borrow_usdc), Decimal.new(market.borrow_apy))
          )
        end)
        |> Decimal.div(total_borrow)
      end

    %{
      fetched_at: DateTime.utc_now() |> DateTime.truncate(:second),
      block_number: to_integer(block["number"]),
      block_timestamp: block_timestamp(block["timestamp"]),
      total_borrow_usdc: total_borrow,
      total_supply_usdc: total_supply,
      weighted_borrow_apy: weighted_borrow_apy,
      markets: markets
    }
  end

  defp sum_decimal(markets, key) do
    Enum.reduce(markets, Decimal.new(0), fn market, acc ->
      Decimal.add(acc, Decimal.new(Map.fetch!(market, key)))
    end)
  end

  defp dec(value, decimals) when is_integer(value) do
    value |> Decimal.new() |> Decimal.div(Decimal.new(10 ** decimals))
  end

  defp dec(value, decimals) when is_binary(value),
    do: value |> String.to_integer() |> dec(decimals)

  defp decimal_percent(value) when is_float(value), do: Decimal.from_float(value * 100)
  defp decimal_percent(value) when is_integer(value), do: Decimal.new(value * 100)

  defp format_float(value) when is_float(value),
    do: value |> Decimal.from_float() |> Decimal.round(6) |> Decimal.to_string(:normal)

  defp format_float(value) when is_integer(value),
    do: value |> Decimal.new() |> Decimal.to_string(:normal)

  defp to_integer(nil), do: nil
  defp to_integer(value) when is_integer(value), do: value
  defp to_integer(value) when is_binary(value), do: String.to_integer(value)

  defp block_timestamp(nil), do: nil

  defp block_timestamp(value) do
    value
    |> to_integer()
    |> DateTime.from_unix!()
    |> DateTime.truncate(:second)
  end
end
