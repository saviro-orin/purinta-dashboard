defmodule PurintaDashboardWeb.PageControllerTest do
  use PurintaDashboardWeb.ConnCase

  test "GET / renders the Home Inertia page", %{conn: conn} do
    conn = get(conn, ~p"/")
    body = html_response(conn, 200)
    assert body =~ ~s(&quot;component&quot;:&quot;Home&quot;)
  end
end
