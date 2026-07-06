defmodule PurintaDashboardWeb.EmailText do
  @moduledoc """
  Plain-text email templates.

  Mirrors `PurintaDashboardWeb.EmailHTML`. Spam filters score messages with
  both bodies higher than HTML-only ones, so every email function in
  `PurintaDashboardWeb.Email` ships a matching `*.text.heex` template here.
  """

  use PurintaDashboardWeb, :html

  embed_templates "email_text/*"
end
