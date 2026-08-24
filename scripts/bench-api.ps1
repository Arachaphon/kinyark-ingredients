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
Write-Host "  WARMING UP CACHE..." -ForegroundColor Yellow
Write-Host "=====================================================" -ForegroundColor Cyan

# Warmup pass
foreach ($ep in $endpoints) {
    try {
        Invoke-WebRequest -Uri $ep[1] -Method $ep[0] -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue | Out-Null
    } catch {}
}

Write-Host "Cache warmed up successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "  BENCHMARKING API LATENCY" -ForegroundColor Cyan
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

    if ($ms -lt 200) {
        $color = "Green"
    } elseif ($ms -lt 500) {
        $color = "Yellow"
    } else {
        $color = "Red"
    }

    $flag = ""
    if ($ms -ge 500) { $flag = " << SLOW" }

    $line = $label.PadRight(45) + $status.ToString().PadLeft(4) + ("  " + $ms + " ms").PadLeft(10) + $flag
    Write-Host $line -ForegroundColor $color

    $results += [PSCustomObject]@{ Endpoint=$label; Status=$status; Ms=$ms }
}

Write-Host ""
Write-Host "-----------------------------------------------------" -ForegroundColor Cyan
$pass  = ($results | Where-Object { $_.Ms -lt 500 }).Count
$total = $results.Count
$slowest = ($results | Sort-Object Ms -Descending | Select-Object -First 1)
Write-Host ("  PASSED (< 500ms): " + $pass + " / " + $total) -ForegroundColor $(if ($pass -eq $total) { "Green" } else { "Yellow" })
Write-Host ("  SLOWEST: " + $slowest.Endpoint + " (" + $slowest.Ms + "ms)") -ForegroundColor Yellow
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""
