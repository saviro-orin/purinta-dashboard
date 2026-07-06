defmodule PurintaDashboardWeb.FallbackController do
  @moduledoc "Minimal fallback handler for controller error tuples."

  use PurintaDashboardWeb, :controller

  def call(conn, {:error, %Ecto.Changeset{} = changeset}) do
    conn
    |> assign_errors(changeset)
    |> redirect(to: referer_path(conn) || ~p"/")
  end

  def call(conn, {:error, :not_found}) do
    conn
    |> put_status(:not_found)
    |> put_view(html: PurintaDashboardWeb.ErrorHTML)
    |> render("404.html")
  end

  def call(conn, {:error, :unauthorized}) do
    conn
    |> put_flash(:error, "Unauthorized.")
    |> redirect(to: ~p"/")
  end

  def call(conn, {:error, :bad_request}) do
    conn
    |> put_flash(:error, "Bad request.")
    |> redirect(to: ~p"/")
  end

  def call(conn, {:error, {:bad_request, message}}) do
    conn
    |> put_flash(:error, message)
    |> redirect(to: ~p"/")
  end

  defp referer_path(conn) do
    with [referer | _] <- get_req_header(conn, "referer"),
         %URI{path: "/" <> _ = path} <- URI.parse(referer) do
      path
    else
      _ -> nil
    end
  end
end
