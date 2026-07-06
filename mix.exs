defmodule PurintaDashboard.MixProject do
  use Mix.Project

  def project do
    [
      app: :purinta_dashboard,
      version: "0.1.0",
      elixir: "~> 1.15",
      elixirc_paths: elixirc_paths(Mix.env()),
      start_permanent: Mix.env() == :prod,
      aliases: aliases(),
      deps: deps(),
      compilers: [:phoenix_live_view] ++ Mix.compilers(),
      listeners: [Phoenix.CodeReloader]
    ]
  end

  def application do
    [
      mod: {PurintaDashboard.Application, []},
      extra_applications: [:logger, :runtime_tools]
    ]
  end

  def cli do
    [preferred_envs: [precommit: :test]]
  end

  defp elixirc_paths(:test), do: ["lib", "test/support"]
  defp elixirc_paths(_), do: ["lib"]

  defp deps do
    [
      {:inertia, "~> 2.0"},
      {:bandit, "~> 1.5"},
      {:dns_cluster, "~> 0.2.0"},
      {:ecto_sql, "~> 3.13"},
      {:jason, "~> 1.2"},
      {:phoenix, "~> 1.8.5"},
      {:phoenix_ecto, "~> 4.5"},
      {:phoenix_html, "~> 4.1"},
      {:phoenix_live_view, "~> 1.1.0"},
      {:postgrex, ">= 0.0.0"},
      {:req, "~> 0.5"},
      {:telemetry_metrics, "~> 1.0"},
      {:telemetry_poller, "~> 1.0"},
      {:uniq, "~> 0.6"},
      {:credo, ">= 0.0.0", only: [:dev, :test], runtime: false},
      {:esbuild, "~> 0.10", runtime: Mix.env() == :dev},
      {:ex_doc, "~> 0.34", only: [:dev, :test], runtime: false},
      {:lazy_html, ">= 0.1.0", only: :test},
      {:phoenix_live_reload, "~> 1.2", only: :dev},
      {:tailwind, "~> 0.3", runtime: Mix.env() == :dev}
    ]
  end

  defp aliases do
    [
      "assets.build": [
        "compile",
        "tailwind purinta_dashboard",
        "cmd rm -rf priv/static/assets/chunks",
        ~s(esbuild purinta_dashboard --define:process.env.NODE_ENV='"development"'),
        "cmd node assets/build/generate-ssr-pages.js",
        "esbuild purinta_dashboard_ssr"
      ],
      "assets.deploy": [
        "tailwind purinta_dashboard --minify",
        "cmd rm -rf priv/static/assets/chunks",
        ~s(esbuild purinta_dashboard --minify --define:process.env.NODE_ENV='"production"'),
        "cmd node assets/build/generate-ssr-pages.js",
        "esbuild purinta_dashboard_ssr",
        "phx.digest",
        "cmd node assets/build/compress-assets.js"
      ],
      "assets.setup": ["tailwind.install --if-missing", "esbuild.install --if-missing"],
      "ecto.reset": ["ecto.drop", "ecto.setup"],
      "ecto.setup": ["ecto.create", "ecto.migrate"],
      "git.hooks": ["cmd git config core.hooksPath scripts/hooks"],
      precommit: [
        "cmd ./scripts/check-tool-versions.sh",
        "compile --warnings-as-errors",
        "lint",
        "deps.unlock --unused",
        "format",
        "test"
      ],
      setup: ["deps.get", "ecto.setup", "assets.setup", "assets.build", "git.hooks"],
      test: ["ecto.create --quiet", "ecto.migrate --quiet", "test"]
    ]
  end
end
