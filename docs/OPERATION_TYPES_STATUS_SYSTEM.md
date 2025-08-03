# Système de Gestion des Statuts des Types d'Opération

## 🎯 Vue d'ensemble

Le système de gestion des statuts permet de contrôler le cycle de vie des types d'opération avec trois niveaux de statuts :

- **🟢 Active** : Disponible pour les agents
- **🟡 Inactive** : Masqué temporairement (maintenance, problème technique)
- **⚫ Archived** : Obsolète mais conservé pour l'historique

## 🗄️ Structure de la Base de Données

### Table `operation_types`
```sql
-- Colonnes ajoutées pour la gestion des statuts
status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived'))
status_changed_at TIMESTAMPTZ DEFAULT NOW()
status_changed_by UUID REFERENCES profiles(id)
status_reason TEXT
```

### Fonctions SQL Principales

#### `change_operation_type_status(op_type_id, new_status, reason, changed_by)`
Change le statut d'un type d'opération avec vérifications et traçabilité.

```sql
SELECT change_operation_type_status(
    'op_netflix', 
    'inactive', 
    'Maintenance programmée', 
    'user-uuid'
);
```

#### `get_operation_types_with_stats()`
Récupère tous les types d'opération avec leurs statistiques.

#### `can_delete_operation_type(op_type_id)`
Vérifie si un type d'opération peut être supprimé (aucune transaction associée).

#### `get_operation_type_stats(op_type_id)`
Obtient les statistiques détaillées d'un type d'opération.

## 🔄 Workflow Typique

### 1. Création d'un Type d'Opération
- Statut par défaut : `active`
- Immédiatement disponible pour les agents

### 2. Maintenance Temporaire
```sql
SELECT change_operation_type_status(
    'op_example', 
    'inactive', 
    'Maintenance du service partenaire', 
    auth.uid()
);
```

### 3. Fin de Vie
```sql
SELECT change_operation_type_status(
    'op_example', 
    'archived', 
    'Service obsolète remplacé par op_new_example', 
    auth.uid()
);
```

### 4. Suppression (si aucune transaction)
```sql
-- Vérifier d'abord
SELECT can_delete_operation_type('op_example');

-- Si true, supprimer
DELETE FROM agency_operation_access WHERE op_type_id = 'op_example';
DELETE FROM operation_types WHERE id = 'op_example';
```

## 🛡️ Sécurités Implémentées

### Vérifications Automatiques
- **Statuts valides** : Seuls `active`, `inactive`, `archived` sont acceptés
- **Transactions existantes** : Avertissement si des transactions utilisent ce type
- **Changements redondants** : Empêche de définir le même statut

### Traçabilité
- **Horodatage** : `status_changed_at` mis à jour automatiquement
- **Utilisateur** : `status_changed_by` trace qui a fait le changement
- **Raison** : `status_reason` explique pourquoi

### Messages Explicites
```json
{
  "success": true,
  "message": "Type d'opération désactivé temporairement",
  "previous_status": "active",
  "new_status": "inactive",
  "transaction_count": 15,
  "warning": "15 transactions existantes utilisent ce type d'opération"
}
```

## 🖥️ Interface d'Administration

### Accès
1. **Admin Général** → Gestion & Administration
2. **Onglet "Opérations"**
3. **Sous-onglet "Gestion des Statuts"**

### Fonctionnalités
- **Vue d'ensemble** avec badges colorés
- **Statistiques** par type d'opération
- **Changement de statut** avec confirmation
- **Suppression sécurisée** (si aucune transaction)
- **Historique** des changements

### Badges Visuels
- 🟢 **Actif** : `bg-green-100 text-green-800`
- 🟡 **Inactif** : `bg-yellow-100 text-yellow-800`
- ⚫ **Archivé** : `bg-gray-100 text-gray-800`

## 📊 Impact sur les Interfaces

### Pour les Agents
```sql
-- Fonction existante - filtre automatiquement sur status = 'active'
SELECT * FROM get_available_op_types_for_agency(agency_id);
```

### Pour les Développeurs
- **Tous les statuts** visibles avec indicateurs
- **Statistiques complètes** par type
- **Actions de gestion** disponibles

### Pour les Administrateurs
- **Contrôle total** des statuts
- **Vérifications de sécurité** avant actions critiques
- **Traçabilité complète** des changements

## 🧪 Tests et Validation

### Composant de Test
Le composant `TestOperationTypesStatus` permet de valider :
- Récupération des types avec statistiques
- Changement de statut avec restauration
- Vérification des permissions de suppression
- Calcul des statistiques

### Tests Manuels
```sql
-- Test changement de statut
SELECT change_operation_type_status('op_test', 'inactive', 'Test', NULL);

-- Test statistiques
SELECT * FROM get_operation_types_with_stats() WHERE id = 'op_test';

-- Test suppression
SELECT can_delete_operation_type('op_test');
```

## 🚀 Optimisations

### Index Créés
```sql
CREATE INDEX idx_operation_types_status ON operation_types(status);
CREATE INDEX idx_operation_types_status_changed_at ON operation_types(status_changed_at);
CREATE INDEX idx_transactions_op_type_status ON transactions(op_type_id);
```

### Vue Optimisée
```sql
CREATE VIEW operation_types_with_stats AS
SELECT ot.*, stats.*, changed_by.name as status_changed_by_name
FROM operation_types ot
LEFT JOIN (statistiques) stats ON ot.id = stats.op_type_id
LEFT JOIN profiles changed_by ON ot.status_changed_by = changed_by.id;
```

## 📝 Bonnes Pratiques

### Changement de Statut
1. **Toujours fournir une raison** explicite
2. **Vérifier l'impact** sur les transactions existantes
3. **Communiquer** aux équipes concernées
4. **Documenter** les changements importants

### Suppression
1. **Vérifier** qu'aucune transaction n'utilise le type
2. **Archiver d'abord** plutôt que supprimer directement
3. **Sauvegarder** les configurations importantes
4. **Confirmer** avec double vérification

### Maintenance
1. **Utiliser `inactive`** pour les maintenances temporaires
2. **Planifier** les changements de statut
3. **Monitorer** l'impact sur les agents
4. **Restaurer rapidement** après maintenance

## 🔧 Dépannage

### Problèmes Courants

#### "Type d'opération introuvable"
- Vérifier que l'ID existe dans la table
- Contrôler les permissions d'accès

#### "Le type d'opération a déjà ce statut"
- Normal, empêche les changements redondants
- Vérifier le statut actuel avant changement

#### "Erreur lors du changement de statut"
- Vérifier les contraintes de la base de données
- Contrôler les permissions utilisateur
- Examiner les logs d'erreur

### Logs et Monitoring
- **Audit logs** : Tous les changements sont tracés
- **Statistiques** : Monitoring de l'utilisation
- **Alertes** : Notifications sur les changements critiques

---

## 🎉 Résumé

Le système de gestion des statuts des types d'opération offre :

✅ **Contrôle complet** du cycle de vie  
✅ **Sécurité renforcée** avec vérifications  
✅ **Traçabilité complète** des changements  
✅ **Interface intuitive** pour les administrateurs  
✅ **Performance optimisée** avec index et vues  
✅ **Tests automatisés** pour validation  

Le système est maintenant robuste et prêt pour la production ! 🚀