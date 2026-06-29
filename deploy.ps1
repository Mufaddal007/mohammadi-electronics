# --- CONFIGURATION SETTINGS ---
$PI_USER = "mufaddal"
$PI_IP = "192.168.31.113"  
# Pointing directly to the compiled Angular browser target location
$LOCAL_DIST_PATH = "C:\Users\INDIA TECHNOLOGY\OneDrive\Documents\MohammadiElectronicsWebApp\dist\mohammadi-electronics\browser"      
$REMOTE_STAGING_PATH = "/home/mufaddal/mohammadiElectronics/temp"
$REMOTE_TARGET_PATH = "/var/www/mohammadiElectronics"

Clear-Host
Write-Host "=== Starting Laptop-Side Production Compilation Pipeline ===" -ForegroundColor Cyan

# 1. Compile the Angular production bundle locally on Windows
Write-Host "[1/4] Executing 'ng build' and sitemap generation on Windows..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "[-] Local compilation failed! Stopping deployment." -ForegroundColor Red
    Exit
}

Write-Host "[+] Local build successful. Preparing file transfer..." -ForegroundColor Green

# 2. Make sure the staging directory exists and is completely clean on the Pi
Write-Host "[2/4] Preparing staging environment on Raspberry Pi..." -ForegroundColor Yellow
ssh "$PI_USER@$PI_IP" "mkdir -p $REMOTE_STAGING_PATH && rm -rf $REMOTE_STAGING_PATH/*"

# 3. Securely push the pre-built files into your home staging directory (Always allowed!)
Write-Host "[3/4] Transferring compiled assets to staging zone..." -ForegroundColor Yellow
$RemoteDestination = "${PI_USER}@${PI_IP}:${REMOTE_STAGING_PATH}/"
.\pscp.exe -r -pw "1999" "$LOCAL_DIST_PATH\*" $RemoteDestination

# 4. Atomically wipe the Nginx directory and shift files into place using administrative sudo privs
Write-Host "[4/4] Activating production push and finalizing permissions..." -ForegroundColor Yellow
$DeployCommand = @"
sudo find $REMOTE_TARGET_PATH -mindepth 1 -maxdepth 1 ! -name 'media' -exec rm -rf {} + && \
sudo cp -r $REMOTE_STAGING_PATH/* $REMOTE_TARGET_PATH/ && \
sudo chown -R mufaddal:www-data $REMOTE_TARGET_PATH && \
sudo chmod -R 755 $REMOTE_TARGET_PATH
"@

ssh "$PI_USER@$PI_IP" $DeployCommand

Write-Host " "
Write-Host "=== DEPLOYMENT SUCCESSFUL ===" -ForegroundColor Green
Write-Host "Mohammadi Electronics is updated and live on the root context!" -ForegroundColor Green