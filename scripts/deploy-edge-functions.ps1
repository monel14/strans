# Script PowerShell pour déployer les Edge Functions Supabase

Write-Host "🚀 Déploiement des Edge Functions Supabase..." -ForegroundColor Green

# Vérifier que Supabase CLI est installé
if (!(Get-Command "supabase" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Supabase CLI n'est pas installé. Installez-le d'abord :" -ForegroundColor Red
    Write-Host "npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Vérifier que nous sommes dans le bon répertoire
if (!(Test-Path "supabase/functions")) {
    Write-Host "❌ Répertoire supabase/functions non trouvé. Exécutez ce script depuis la racine du projet." -ForegroundColor Red
    exit 1
}

# Déployer les fonctions
Write-Host "📦 Déploiement de send-push-notification..." -ForegroundColor Blue
supabase functions deploy send-push-notification

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ send-push-notification déployée avec succès" -ForegroundColor Green
} else {
    Write-Host "❌ Erreur lors du déploiement de send-push-notification" -ForegroundColor Red
}

Write-Host "📦 Déploiement de register-push-subscription..." -ForegroundColor Blue
supabase functions deploy register-push-subscription

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ register-push-subscription déployée avec succès" -ForegroundColor Green
} else {
    Write-Host "❌ Erreur lors du déploiement de register-push-subscription" -ForegroundColor Red
}

Write-Host "🎉 Déploiement terminé !" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Prochaines étapes :" -ForegroundColor Yellow
Write-Host "1. Configurez les variables d'environnement dans Supabase Dashboard" -ForegroundColor White
Write-Host "2. Testez les fonctions avec le composant PushNotificationTest" -ForegroundColor White
Write-Host "3. Vérifiez les logs avec : supabase functions logs" -ForegroundColor White