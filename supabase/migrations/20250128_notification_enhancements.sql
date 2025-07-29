-- Migration pour améliorer le système de notifications
-- Ajouter les nouvelles colonnes aux notifications existantes

-- Étendre la table notifications avec les nouvelles fonctionnalités
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS template VARCHAR(50),
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS category VARCHAR(50),
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS action VARCHAR(50),
ADD COLUMN IF NOT EXISTS target VARCHAR(100),
ADD COLUMN IF NOT EXISTS entity_id VARCHAR(100);

-- Créer un index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_notifications_search ON notifications USING gin(to_tsvector('french', text));
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);

-- Table pour les abonnements push
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    subscription JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, endpoint)
);

-- Index pour les abonnements push
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- Table pour les templates de notifications personnalisés
CREATE TABLE IF NOT EXISTS notification_templates (
    id VARCHAR(50) PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    icon VARCHAR(100),
    color VARCHAR(7) DEFAULT '#6366F1',
    sound VARCHAR(50) DEFAULT 'default',
    vibration INTEGER[] DEFAULT ARRAY[200, 100, 200],
    actions JSONB DEFAULT '[]',
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les templates
CREATE INDEX IF NOT EXISTS idx_notification_templates_user ON notification_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(type);
CREATE INDEX IF NOT EXISTS idx_notification_templates_system ON notification_templates(is_system);

-- Insérer les templates système par défaut
INSERT INTO notification_templates (id, type, title, body, icon, color, sound, vibration, actions, is_system) VALUES
('transaction_created', 'transaction', '💰 Nouvelle Transaction', 'Une nouvelle transaction a été créée', '💰', '#10B981', 'default', ARRAY[200, 100, 200], '[{"action": "view", "title": "Voir", "icon": "👁️"}, {"action": "dismiss", "title": "Ignorer"}]', TRUE),
('transaction_validation', 'validation', '⚠️ Validation Requise', 'Une transaction nécessite votre validation', '⚠️', '#F59E0B', 'urgent', ARRAY[300, 200, 300, 200, 300], '[{"action": "validate", "title": "Valider", "icon": "✅"}, {"action": "reject", "title": "Rejeter", "icon": "❌"}, {"action": "view", "title": "Voir"}]', TRUE),
('security_alert', 'security', '🔒 Alerte Sécurité', 'Activité suspecte détectée', '🔒', '#EF4444', 'urgent', ARRAY[500, 300, 500, 300, 500], '[{"action": "secure", "title": "Sécuriser", "icon": "🛡️"}, {"action": "view", "title": "Détails"}]', TRUE),
('system_update', 'system', '🔄 Mise à jour', 'Mise à jour système disponible', '🔄', '#6366F1', 'soft', ARRAY[100], '[{"action": "update", "title": "Mettre à jour", "icon": "⬆️"}, {"action": "later", "title": "Plus tard"}]', TRUE),
('message', 'communication', '💬 Nouveau Message', 'Vous avez reçu un nouveau message', '💬', '#3B82F6', 'message', ARRAY[200, 100, 200], '[{"action": "reply", "title": "Répondre", "icon": "↩️"}, {"action": "view", "title": "Voir"}]', TRUE)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    body = EXCLUDED.body,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    sound = EXCLUDED.sound,
    vibration = EXCLUDED.vibration,
    actions = EXCLUDED.actions,
    updated_at = NOW();

-- Table pour les paramètres de notifications par utilisateur
CREATE TABLE IF NOT EXISTS user_notification_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    push_enabled BOOLEAN DEFAULT FALSE,
    push_transactions BOOLEAN DEFAULT TRUE,
    push_security BOOLEAN DEFAULT TRUE,
    push_system BOOLEAN DEFAULT FALSE,
    push_messages BOOLEAN DEFAULT TRUE,
    quiet_hours_enabled BOOLEAN DEFAULT FALSE,
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    vibration_enabled BOOLEAN DEFAULT TRUE,
    sound_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Index pour les paramètres utilisateur
CREATE INDEX IF NOT EXISTS idx_user_notification_settings_user ON user_notification_settings(user_id);

-- Fonction pour créer automatiquement les paramètres par défaut
CREATE OR REPLACE FUNCTION create_default_notification_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_notification_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour créer les paramètres par défaut lors de la création d'un utilisateur
DROP TRIGGER IF EXISTS trigger_create_notification_settings ON users;
CREATE TRIGGER trigger_create_notification_settings
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_notification_settings();

-- Fonction pour nettoyer les anciennes notifications (optionnel)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
    -- Supprimer les notifications de plus de 90 jours
    DELETE FROM notifications 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Garder seulement les 1000 dernières notifications par utilisateur
    WITH ranked_notifications AS (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
        FROM notifications
    )
    DELETE FROM notifications 
    WHERE id IN (
        SELECT id FROM ranked_notifications WHERE rn > 1000
    );
END;
$$ LANGUAGE plpgsql;

-- Créer les paramètres par défaut pour les utilisateurs existants
INSERT INTO user_notification_settings (user_id)
SELECT id FROM users
ON CONFLICT (user_id) DO NOTHING;

-- Mettre à jour les notifications existantes avec des valeurs par défaut
UPDATE notifications 
SET 
    priority = 'normal',
    category = CASE 
        WHEN type = 'transaction' THEN 'finance'
        WHEN type = 'security' THEN 'security'
        WHEN type = 'system' THEN 'system'
        ELSE 'general'
    END,
    template = CASE 
        WHEN type = 'transaction' THEN 'transaction_created'
        WHEN type = 'validation' THEN 'transaction_validation'
        WHEN type = 'security' THEN 'security_alert'
        WHEN type = 'system' THEN 'system_update'
        ELSE 'message'
    END
WHERE priority IS NULL OR template IS NULL;

-- Politique RLS pour les nouvelles tables
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_settings ENABLE ROW LEVEL SECURITY;

-- Politiques pour push_subscriptions
CREATE POLICY "Users can manage their own push subscriptions" ON push_subscriptions
    FOR ALL USING (auth.uid() = user_id);

-- Politiques pour notification_templates
CREATE POLICY "Users can view system templates" ON notification_templates
    FOR SELECT USING (is_system = TRUE OR auth.uid() = user_id);

CREATE POLICY "Users can manage their own templates" ON notification_templates
    FOR ALL USING (auth.uid() = user_id AND is_system = FALSE);

-- Politiques pour user_notification_settings
CREATE POLICY "Users can manage their own notification settings" ON user_notification_settings
    FOR ALL USING (auth.uid() = user_id);

-- Commentaires pour la documentation
COMMENT ON TABLE push_subscriptions IS 'Stockage des abonnements push pour les notifications mobiles';
COMMENT ON TABLE notification_templates IS 'Templates personnalisables pour les notifications';
COMMENT ON TABLE user_notification_settings IS 'Paramètres de notifications par utilisateur';
COMMENT ON COLUMN notifications.template IS 'ID du template utilisé pour cette notification';
COMMENT ON COLUMN notifications.priority IS 'Priorité de la notification (low, normal, high, urgent)';
COMMENT ON COLUMN notifications.category IS 'Catégorie pour le filtrage et l''organisation';
COMMENT ON COLUMN notifications.metadata IS 'Données supplémentaires en JSON';
COMMENT ON COLUMN notifications.action IS 'Action système associée à la notification';
COMMENT ON COLUMN notifications.target IS 'Cible de l''action (page, composant, etc.)';
COMMENT ON COLUMN notifications.entity_id IS 'ID de l''entité liée à la notification';