-- Créer la table pour les abonnements push
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    subscription JSONB NOT NULL,
    user_agent TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contrainte unique pour éviter les doublons
    UNIQUE(user_id, endpoint)
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(active);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- RLS (Row Level Security)
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Politique pour que les utilisateurs ne voient que leurs propres abonnements
CREATE POLICY "Users can view their own push subscriptions" ON push_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own push subscriptions" ON push_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own push subscriptions" ON push_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push subscriptions" ON push_subscriptions
    FOR DELETE USING (auth.uid() = user_id);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_push_subscriptions_updated_at
    BEFORE UPDATE ON push_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_push_subscriptions_updated_at();

-- Fonction pour nettoyer les anciens abonnements inactifs
CREATE OR REPLACE FUNCTION cleanup_inactive_push_subscriptions()
RETURNS void AS $$
BEGIN
    DELETE FROM push_subscriptions 
    WHERE active = false 
    AND updated_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Commentaires pour la documentation
COMMENT ON TABLE push_subscriptions IS 'Stockage des abonnements push pour les notifications web';
COMMENT ON COLUMN push_subscriptions.endpoint IS 'URL endpoint du service push';
COMMENT ON COLUMN push_subscriptions.subscription IS 'Objet PushSubscription complet en JSON';
COMMENT ON COLUMN push_subscriptions.user_agent IS 'User agent du navigateur pour le debugging';
COMMENT ON COLUMN push_subscriptions.active IS 'Indique si l''abonnement est actif';