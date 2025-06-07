# PowerShell script to create Angular chat widget structure using Angular CLI
# Run this from your project root (where package.json is located)

Write-Host "Creating Angular Chat Widget structure with Angular CLI..." -ForegroundColor Green

# Create directories for models and additional services
$directories = @(
    "src\app\models",
    "src\app\components"
)

foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force
        Write-Host "Created directory: $dir" -ForegroundColor Yellow
    }
}

# Create components using Angular CLI
Write-Host "Creating components with Angular CLI..." -ForegroundColor Cyan

# Chat Widget Component (main container)
Write-Host "Creating chat-widget component..." -ForegroundColor Yellow
ng generate component components/chat-widget --style=scss --skip-tests=true --standalone=true

# Floating Robot Component (the clickable robot icon)
Write-Host "Creating floating-robot component..." -ForegroundColor Yellow  
ng generate component components/floating-robot --style=scss --skip-tests=true --standalone=true

# Chat Overlay Component (the actual chat interface)
Write-Host "Creating chat-overlay component..." -ForegroundColor Yellow
ng generate component components/chat-overlay --style=scss --skip-tests=true --standalone=true

# Create service using Angular CLI
Write-Host "Creating chat-widget service..." -ForegroundColor Yellow
ng generate service services/chat-widget --skip-tests=true

# Create model files manually (Angular CLI doesn't have model generator)
Write-Host "Creating model files..." -ForegroundColor Cyan

$modelFiles = @(
    "src\app\models\message.model.ts",
    "src\app\models\chat-config.model.ts", 
    "src\app\models\user.model.ts"
)

foreach ($file in $modelFiles) {
    if (!(Test-Path $file)) {
        New-Item -ItemType File -Path $file -Force
        Write-Host "Created file: $file" -ForegroundColor Green
    } else {
        Write-Host "File already exists: $file" -ForegroundColor Cyan
    }
}

Write-Host "Structure created successfully!" -ForegroundColor Green
Write-Host "Components created:" -ForegroundColor White
Write-Host "  - ChatWidgetComponent (main container)" -ForegroundColor Gray
Write-Host "  - FloatingRobotComponent (clickable robot icon)" -ForegroundColor Gray  
Write-Host "  - ChatOverlayComponent (chat interface)" -ForegroundColor Gray
Write-Host "Services created:" -ForegroundColor White
Write-Host "  - ChatWidgetService (state management)" -ForegroundColor Gray
Write-Host "Models ready for:" -ForegroundColor White
Write-Host "  - Message, ChatConfig, User interfaces" -ForegroundColor Gray

Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Install Bootstrap: npm install bootstrap @popperjs/core" -ForegroundColor White
Write-Host "2. Update src/styles.scss to import Bootstrap" -ForegroundColor White
Write-Host "3. Copy component code from artifacts" -ForegroundColor White