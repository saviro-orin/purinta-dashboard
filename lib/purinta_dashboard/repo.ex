defmodule PurintaDashboard.Repo do
  use Ecto.Repo,
    otp_app: :purinta_dashboard,
    adapter: Ecto.Adapters.Postgres

  use PurintaDashboard.Ecto.OKRepo
end
