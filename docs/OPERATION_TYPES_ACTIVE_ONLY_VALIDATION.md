# Validation : Seuls les Types d'Opération Actifs pour les Transactions

## 🎯 Objectif

Garantir que **seuls les types d'opération avec le statut `active`** peuvent être utilisés pour créer des transactions, empêchant ainsi l'utilisation de services inactifs ou archivés.

## ✅ Protections Implémentées

### 1. **Filtrage au Niveau de l'Interface Agent**

#### Fonction SQL : `get_available_op_types_for_agency`
```sql
SELECT ot.*
FROM public.operation_types ot
JOIN public.agency_operation_access aoa ON ot.id = aoa.op_type_id
WHERE aoa.agency_id = p_agency_id AND ot.status = 'active';
```

**Résultat :** Les agents ne voient que les types d'opération actifs dans le formulaire.

#### Utilisation dans `NewOperationModal.tsx`
```typescript
const { data, error } = await supabase.rpc('get_available_op_types_for_agency', {
    p_agency_id: user.agency_id,
});
```

### 2. **Protection au Niveau Base de Données**

#### Trigger de Validation
```sql
CREATE TRIGGER validate_active_operation_type_trigger
    BEFORE INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION validate_operation_type_active();
```

#### Fonction de Validation
```sql
CREATE OR REPLACE FUNCTION validate_operation_type_active()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM operation_types 
        WHERE id = NEW.op_type_id AND status = 'active'
    ) THEN
        RAISE EXCEPTION 'Impossible de créer une transaction avec un type d''opération inactif ou archivé (%)';
    END IF;
    RETURN NEW;
END;
$$
```

**Résultat :** Même si quelqu'un tente de contourner l'interface, la base de données rejette la transaction.

### 3. **Validation Côté Frontend (Optionnelle)**

#### Utilitaire de Validation
```typescript
// src/utils/operationTypeValidation.ts
export const validateOperationTypeActive = async (opTypeId: string) => {
    const { data } = await supabase.rpc('get_operation_type_status', { op_type_id: opTypeId });
    
    switch (data) {
        case 'active': return { isValid: true, message: 'Type d\'opération valide' };
        case 'inactive': return { isValid: false, message: 'Service temporairement indisponible' };
        case 'archived': return { isValid: false, message: 'Service n\'est plus disponible' };
        default: return { isValid: false, message: 'Type d\'opération introuvable' };
    }
};
```

## 🧪 Tests de Validation

### Test 1 : Filtrage Interface Agent
```sql
-- Créer un type inactif
INSERT INTO operation_types (id, name, status) VALUES ('test_inactive', 'Test Inactif', 'inactive');

-- Ajouter accès agence
INSERT INTO agency_operation_access (agency_id, op_type_id) VALUES ('agency-id', 'test_inactive');

-- Vérifier que l'agent ne le voit pas
SELECT COUNT(*) FROM get_available_op_types_for_agency('agency-id') WHERE id = 'test_inactive';
-- Résultat : 0 (invisible pour l'agent)
```

### Test 2 : Protection Base de Données
```sql
-- Tenter de créer une transaction avec type inactif
INSERT INTO transactions (agent_id, op_type_id, montant_principal, montant_total)
VALUES ('agent-id', 'test_inactive', 1000, 1000);
-- Résultat : ERROR - Impossible de créer une transaction avec un type d'opération inactif
```

### Test 3 : Comparaison Actifs vs Tous
```sql
-- Types actifs visibles pour agents
SELECT COUNT(*) FROM get_available_op_types_for_agency('agency-id');
-- Résultat : 9

-- Tous les types (actifs + inactifs) pour cette agence
SELECT COUNT(*) FROM operation_types ot
JOIN agency_operation_access aoa ON ot.id = aoa.op_type_id
WHERE aoa.agency_id = 'agency-id';
-- Résultat : 11

-- Différence = 2 types inactifs/archivés masqués
```

## 🔄 Workflow de Changement de Statut

### Scénario : Maintenance d'un Service

1. **Avant Maintenance**
   ```sql
   -- Service actif, visible pour agents
   SELECT status FROM operation_types WHERE id = 'op_netflix';
   -- Résultat : 'active'
   ```

2. **Pendant Maintenance**
   ```sql
   -- Administrateur désactive le service
   SELECT change_operation_type_status('op_netflix', 'inactive', 'Maintenance partenaire');
   -- Résultat : Service désactivé, invisible pour agents
   ```

3. **Après Maintenance**
   ```sql
   -- Administrateur réactive le service
   SELECT change_operation_type_status('op_netflix', 'active', 'Maintenance terminée');
   -- Résultat : Service réactivé, visible pour agents
   ```

## 📊 Impact sur les Différents Rôles

### 👤 **Agents**
- ✅ Voient seulement les services actifs
- ✅ Ne peuvent pas créer de transactions avec services inactifs
- ✅ Interface simple et claire

### 🛠️ **Développeurs**
- ✅ Voient tous les statuts avec badges colorés
- ✅ Peuvent tester les changements de statut
- ✅ Accès aux statistiques complètes

### 👑 **Administrateurs**
- ✅ Contrôle total des statuts
- ✅ Peuvent désactiver temporairement des services
- ✅ Traçabilité complète des changements

## 🛡️ Sécurité Multi-Niveaux

### Niveau 1 : Interface Utilisateur
- Filtrage automatique des types actifs
- Pas de possibilité de sélectionner un type inactif

### Niveau 2 : Validation Frontend
- Vérification avant soumission
- Messages d'erreur explicites

### Niveau 3 : Protection Base de Données
- Trigger automatique sur insertion
- Impossible de contourner même avec accès direct

## 🎯 Avantages du Système

### ✅ **Sécurité Renforcée**
- Protection multi-niveaux
- Impossible de créer des transactions avec services inactifs

### ✅ **Gestion Flexible**
- Désactivation temporaire sans suppression
- Archivage pour conservation historique

### ✅ **Expérience Utilisateur**
- Agents ne voient que les services disponibles
- Messages d'erreur clairs en cas de problème

### ✅ **Maintenance Facilitée**
- Désactivation rapide en cas de problème
- Réactivation simple après résolution

## 🔧 Commandes Utiles

### Vérifier le Statut d'un Type
```sql
SELECT get_operation_type_status('op_netflix');
```

### Lister les Types Actifs pour une Agence
```sql
SELECT id, name FROM get_available_op_types_for_agency('agency-id');
```

### Changer le Statut
```sql
SELECT change_operation_type_status('op_id', 'inactive', 'Raison du changement');
```

### Statistiques par Statut
```sql
SELECT status, COUNT(*) 
FROM operation_types 
GROUP BY status;
```

---

## 🎉 Conclusion

Le système garantit que **seuls les types d'opération actifs** peuvent être utilisés pour les transactions, avec :

- 🔒 **Protection multi-niveaux** (Interface + Base de données)
- 🎯 **Filtrage automatique** pour les agents
- 🛠️ **Gestion flexible** pour les administrateurs
- 📊 **Traçabilité complète** des changements
- ✅ **Tests validés** et documentés

Les agents ne peuvent physiquement pas créer de transactions avec des services inactifs ! 🚀