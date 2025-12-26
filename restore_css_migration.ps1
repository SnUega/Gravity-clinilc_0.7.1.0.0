# PowerShell скрипт для восстановления CSS миграции
# Запуск: .\restore_css_migration.ps1

Write-Host "=== Восстановление CSS миграции ===" -ForegroundColor Green

# Создание структуры папок
Write-Host "Создание структуры папок..." -ForegroundColor Yellow
$modulesPath = "css\modules"
$basePath = "$modulesPath\base"
$componentsPath = "$modulesPath\components"
$responsivePath = "$modulesPath\responsive"

New-Item -ItemType Directory -Force -Path $basePath | Out-Null
New-Item -ItemType Directory -Force -Path $componentsPath | Out-Null
New-Item -ItemType Directory -Force -Path $responsivePath | Out-Null

Write-Host "✓ Структура папок создана" -ForegroundColor Green

# Проверка существования файлов
Write-Host "`nПроверка файлов модулей..." -ForegroundColor Yellow

$files = @(
    "$basePath\_variables.css",
    "$basePath\_reset.css",
    "$componentsPath\_preloader.css",
    "$componentsPath\_mobile-hint.css",
    "$componentsPath\_header.css",
    "$componentsPath\_services.css",
    "$responsivePath\_breakpoints.css"
)

$missingFiles = @()
foreach ($file in $files) {
    if (-not (Test-Path $file)) {
        $missingFiles += $file
        Write-Host "✗ Отсутствует: $file" -ForegroundColor Red
    } else {
        Write-Host "✓ Найден: $file" -ForegroundColor Green
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "`n⚠ ВНИМАНИЕ: Некоторые файлы отсутствуют!" -ForegroundColor Yellow
    Write-Host "Создайте их вручную согласно RESTORE_GUIDE.md" -ForegroundColor Yellow
} else {
    Write-Host "`n✓ Все файлы модулей на месте" -ForegroundColor Green
}

# Проверка HTML
Write-Host "`nПроверка HTML..." -ForegroundColor Yellow
$htmlPath = "html\index.html"
if (Test-Path $htmlPath) {
    $htmlContent = Get-Content $htmlPath -Raw
    if ($htmlContent -match "modules/base/_variables.css") {
        Write-Host "✓ HTML обновлен для модулей" -ForegroundColor Green
    } else {
        Write-Host "✗ HTML не обновлен" -ForegroundColor Red
        Write-Host "  Обновите html/index.html согласно RESTORE_GUIDE.md" -ForegroundColor Yellow
    }
} else {
    Write-Host "✗ HTML файл не найден: $htmlPath" -ForegroundColor Red
}

# Итоговая информация
Write-Host "`n=== Итоговая информация ===" -ForegroundColor Cyan
Write-Host "Структура создана: ✓" -ForegroundColor Green
Write-Host "Файлы модулей: $($files.Count - $missingFiles.Count)/$($files.Count)" -ForegroundColor $(if ($missingFiles.Count -eq 0) { "Green" } else { "Yellow" })
Write-Host "`nСледующие шаги:" -ForegroundColor Cyan
Write-Host "1. Проверьте содержимое файлов модулей" -ForegroundColor White
Write-Host "2. Обновите main.css (удалите дубликаты)" -ForegroundColor White
Write-Host "3. Обновите html/index.html (подключите модули)" -ForegroundColor White
Write-Host "4. Протестируйте в браузере" -ForegroundColor White
Write-Host "`nПодробности в: css/RESTORE_GUIDE.md" -ForegroundColor Cyan

