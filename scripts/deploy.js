#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Préparation du déploiement Vercel...\n');

// Vérifier que les fichiers nécessaires existent
const requiredFiles = [
  'vercel.json',
  'package.json',
  'src/supabaseClient.ts'
];

console.log('✅ Vérification des fichiers...');
requiredFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    console.error(`❌ Fichier manquant: ${file}`);
    process.exit(1);
  }
  console.log(`  ✓ ${file}`);
});

// Vérifier les dépendances
console.log('\n📦 Vérification des dépendances...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = [
    '@supabase/supabase-js',
    'react',
    'react-dom'
  ];
  
  requiredDeps.forEach(dep => {
    if (!packageJson.dependencies[dep] && !packageJson.devDependencies[dep]) {
      console.error(`❌ Dépendance manquante: ${dep}`);
      process.exit(1);
    }
    console.log(`  ✓ ${dep}`);
  });
} catch (error) {
  console.error('❌ Erreur lecture package.json:', error.message);
  process.exit(1);
}

// Vérifier la configuration Supabase
console.log('\n🔧 Vérification configuration Supabase...');
const supabaseClient = fs.readFileSync('src/supabaseClient.ts', 'utf8');
if (supabaseClient.includes('VITE_SUPABASE_URL')) {
  console.log('  ✓ Configuration Vite détectée');
} else {
  console.warn('  ⚠️  Configuration Vite non détectée, vérifiez les variables d\'environnement');
}

console.log('\n🎯 Prêt pour le déploiement !');
console.log('\nÉtapes suivantes:');
console.log('1. Installez Vercel CLI: npm i -g vercel');
console.log('2. Connectez-vous: vercel login');
console.log('3. Déployez: vercel --prod');
console.log('\n💡 N\'oubliez pas de configurer les variables d\'environnement sur Vercel !');