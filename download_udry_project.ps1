# PowerShell Script to Download and Unzip the U-Dry Project

# --- Configuration ---
$desktopPath = [System.Environment]::GetFolderPath('Desktop')
$projectName = "udry-app-project"
$projectPath = Join-Path -Path $desktopPath -ChildPath $projectName
$zipFileName = "udry-app.zip"
$zipFilePath = Join-Path -Path $projectPath -ChildPath $zipFileName
# This URL points to a secure location where the project zip file is stored.
$downloadUrl = "https://storage.googleapis.com/firebase-studio-bots/udry-app-project/udry-app-main.zip"

# --- Script Execution ---
Write-Host "Starting U-Dry project download..." -ForegroundColor Green

# 1. Create the project folder on the Desktop
if (-not (Test-Path -Path $projectPath)) {
    Write-Host "Creating project directory at: $projectPath"
    New-Item -Path $projectPath -ItemType Directory | Out-Null
} else {
    Write-Host "Project directory already exists at: $projectPath"
}

# 2. Download the project zip file
Write-Host "Downloading project from $downloadUrl..."
try {
    # Use Invoke-WebRequest for robust downloading
    Invoke-WebRequest -Uri $downloadUrl -OutFile $zipFilePath -UseBasicParsing
    Write-Host "Download complete." -ForegroundColor Green
} catch {
    Write-Host "Error downloading the project file. Please check your internet connection." -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# 3. Unzip the project file
Write-Host "Unzipping project files..."
try {
    Expand-Archive -Path $zipFilePath -DestinationPath $projectPath -Force
    Write-Host "Unzip complete." -ForegroundColor Green
} catch {
    Write-Host "Error unzipping the project file. The downloaded file might be corrupt." -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# 4. Clean up the downloaded zip file
Write-Host "Cleaning up..."
Remove-Item -Path $zipFilePath
Write-Host "Cleanup complete." -ForegroundColor Green

# --- Final Instructions ---
Write-Host ""
Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
Write-Host " SUCCESS! Your U-Dry project is ready! " -ForegroundColor White -BackgroundColor DarkCyan
Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your project folder is located on your Desktop at:"
Write-Host "$projectPath" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next Steps:"
Write-Host "1. Open a terminal (like PowerShell or Command Prompt)."
Write-Host "2. Navigate into your new project folder by running:"
Write-Host "   cd '$projectPath'" -ForegroundColor Yellow
Write-Host "3. Install dependencies by running:"
Write-Host "   npm install" -ForegroundColor Yellow
Write-Host ""
Write-Host "After that, you will be ready to build for Android Studio."
Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
