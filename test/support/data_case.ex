defmodule PurintaDashboard.DataCase do
  @moduledoc "Database test helpers."

  use ExUnit.CaseTemplate

  alias Ecto.Adapters.SQL.Sandbox

  using do
    quote do
      alias PurintaDashboard.Repo

      import Ecto
      import Ecto.Changeset
      import Ecto.Query
      import PurintaDashboard.DataCase
    end
  end

  setup tags do
    PurintaDashboard.DataCase.setup_sandbox(tags)
    :ok
  end

  def setup_sandbox(tags) do
    pid = Sandbox.start_owner!(PurintaDashboard.Repo, shared: not tags[:async])
    on_exit(fn -> Sandbox.stop_owner(pid) end)
  end

  def errors_on(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {message, opts} ->
      Regex.replace(~r"%{(\w+)}", message, fn _, key ->
        opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
      end)
    end)
  end
end
