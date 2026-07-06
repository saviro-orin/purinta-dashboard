defmodule PurintaDashboardWeb.PageControllerTest do
  use PurintaDashboardWeb.ConnCase, async: true

  test "GET / renders the dashboard Inertia page", %{conn: conn} do
    conn = get(conn, ~p"/")

    assert html_response(conn, 200) =~ ~s(&quot;component&quot;:&quot;Home&quot;)
    assert html_response(conn, 200) =~ ~s(&quot;socket_path&quot;:&quot;/socket&quot;)
  end
end
