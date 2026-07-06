defmodule PurintaDashboard.Purinta.Market do
  @moduledoc "Purinta market metadata."

  @enforce_keys [
    :id,
    :name,
    :loan_symbol,
    :collateral_symbol,
    :loan_address,
    :collateral_address,
    :oracle_address,
    :lltv
  ]
  defstruct [
    :id,
    :name,
    :loan_symbol,
    :collateral_symbol,
    :loan_address,
    :collateral_address,
    :oracle_address,
    :lltv
  ]
end
