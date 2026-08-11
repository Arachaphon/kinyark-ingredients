$BASE = "http://localhost:3000"
$RECIPE_ID = "f65de89e-e01a-4afd-83f1-f21fddca6838"

$endpoints = @(
    @("GET", "$BASE/api/recipes",                        "GET /api/recipes (public list)"),
    @("GET", "$BASE/api/recipes?page=1&limit=10",        "GET /api/recipes?page=1&limit=10"),
    @("GET", "$BASE/api/recipes/featured",               "GET /api/recipes/featured (anon)"),
    @("GET", "$BASE/api/recipes/recommended",            "GET /api/recipes/recommended (anon)"),
    @("GET", "$BASE/api/recipes/$RECIPE_ID",             "GET /api/recipes/[id]"),
    @("GET", "$BASE/api/recipes/$RECIPE_ID/ratings",     "GET /api/recipes/[id]/ratings"),
    @("GET", "$BASE/api/favorites",                      "GET /api/favorites (anon)"),
    @("GET", "$BASE/api/ingredients",                    "GET /api/ingredients"),
    @("GET", "$BASE/api/reviews?recipeId=$RECIPE_ID",    "GET /api/reviews?recipeId=[id]"),
    @("GET", "$BASE/api/auth/me",                        "GET /api/auth/me (anon)"),
    @("GET", "$BASE/api/users/me",                       "GET /api/users/me (anon)")
)

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "  FRESH / FIRST-CALL (COLD START) LATENCY TEST" -ForegroundColor Yellow
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

$results = @()

foreach ($ep in $endpoints) {
    $method = $ep[0]
    $url    = $ep[1]
    $label  = $ep[2]

    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $resp = Invoke-WebRequest -Uri $url -Method $method -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
        $sw.Stop()
        $ms     = $sw.ElapsedMilliseconds
        $status = $resp.StatusCode
    } catch {
        $sw.Stop()
        $ms     = $sw.ElapsedMilliseconds
        $status = "ERR"
    }

    $sec = [math]::Round($ms / 1000, 2)

    if ($ms -lt 500) {
        $color = "Green"
    } elseif ($ms -lt 1000) {
        $color = "Yellow"
    } else {
        $color = "Red"
    }

    $flag = ""
    if ($ms -ge 500) { $flag = " << OVER 500ms" }

    $line = $label.PadRight(42) + $status.ToString().PadLeft(4) + ("  " + $ms + " ms (" + $sec + "s)").PadLeft(18) + $flag
    Write-Host $line -ForegroundColor $color

    $results += [PSCustomObject]@{ Endpoint=$label; Status=$status; Ms=$ms; Sec=$sec }
}

Write-Host ""
Write-Host "-----------------------------------------------------" -ForegroundColor Cyan
$pass  = ($results | Where-Object { $_.Ms -lt 500 }).Count
$total = $results.Count
$slowest = ($results | Sort-Object Ms -Descending | Select-Object -First 1)
Write-Host ("  PASSED (< 500ms): " + $pass + " / " + $total) -ForegroundColor $(if ($pass -eq $total) { "Green" } else { "Yellow" })
Write-Host ("  SLOWEST FIRST-CALL: " + $slowest.Endpoint + " (" + $slowest.Ms + "ms / " + $slowest.Sec + "s)") -ForegroundColor Yellow
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""
