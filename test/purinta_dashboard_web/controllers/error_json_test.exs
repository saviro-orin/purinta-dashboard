defmodule PurintaDashboardWeb.ErrorJSONTest do
  use PurintaDashboardWeb.ConnCase, async: true

  test "renders 404" do
    assert PurintaDashboardWeb.ErrorJSON.render("404.json", %{}) == %{
             errors: %{detail: "Not Found"}
           }
  end

  test "renders 500" do
    assert PurintaDashboardWeb.ErrorJSON.render("500.json", %{}) ==
             %{errors: %{detail: "Internal Server Error"}}
  end
end
