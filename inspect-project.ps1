# Angular Source Structure Report

Write-Host "================================="
Write-Host " PORTFOLIO SRC STRUCTURE"
Write-Host "================================="
Write-Host ""

tree .\src /F


Write-Host ""
Write-Host "================================="
Write-Host " TYPESCRIPT COMPONENTS"
Write-Host "================================="
Write-Host ""

Get-ChildItem .\src\app -Recurse -Filter *.ts |
ForEach-Object {

    $content = Get-Content $_.FullName -Raw

    if ($content -match "@Component") {

        Write-Host $_.FullName.Replace((Get-Location).Path + "\", "")

    }

}


Write-Host ""
Write-Host "================================="
Write-Host " ROUTES"
Write-Host "================================="
Write-Host ""

if (Test-Path ".\src\app\app.routes.ts") {

    Get-Content ".\src\app\app.routes.ts"

}