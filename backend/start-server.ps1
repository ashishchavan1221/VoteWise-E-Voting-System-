$ErrorActionPreference = "Stop"

# Ensure we are executing relative to the script's location
Set-Location -Path $PSScriptRoot

Write-Host "Killing old ghost servers..." -ForegroundColor Yellow
Write-Host "Forcibly clearing Port 8080 to fix Address Already In Use..." -ForegroundColor Yellow
$netstatOut = netstat -ano | Select-String ":8080"
if ($netstatOut) {
    foreach ($line in $netstatOut) {
        if ($line -match 'LISTENING\s+(\d+)') {
            $targetPid = $matches[1]
            Stop-Process -Id $targetPid -Force -ErrorAction SilentlyContinue
        }
    }
}
Start-Sleep -Seconds 2


$mavenUrl = "https://archive.apache.org/dist/maven/maven-3/3.9.6/binaries/apache-maven-3.9.6-bin.zip"
$mavenZip = "maven.zip"
$mavenDir = ".maven"

if (-not (Test-Path "$mavenDir\apache-maven-3.9.6\bin\mvn.cmd")) {
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "Downloading Apache Maven for you..." -ForegroundColor Cyan
    Write-Host "This will only happen once. Please wait!" -ForegroundColor Yellow
    Write-Host "==========================================" -ForegroundColor Cyan
    
    Invoke-WebRequest -Uri $mavenUrl -OutFile $mavenZip
    
    Write-Host "Extracting Maven... (this takes a few seconds)" -ForegroundColor Cyan
    Expand-Archive -Path $mavenZip -DestinationPath $mavenDir -Force
    Remove-Item $mavenZip
}

$mvnCmd = Resolve-Path "$mavenDir\apache-maven-3.9.6\bin\mvn.cmd"

Write-Host "==========================================" -ForegroundColor Green
Write-Host "Starting Java Secure Backend..." -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

$env:PORT="8090"
& $mvnCmd clean compile exec:java "-Dexec.mainClass=com.votewise.Main"
