// Utilitaire pour tester les nouvelles fonctionnalités de notifications
import { supabase } from '../supabaseClient';

export const testNotificationFeatures = {
  // Test 1: Créer une notification avec template
  async createTestNotification(userId: string, templateId: string = 'transaction_created') {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          text: 'Test de notification avec template',
          icon: '💰',
          type: 'transaction',
          template: templateId,
          priority: 'high',
          category: 'finance',
          metadata: {
            amount: 1000,
            transaction_id: 'test-123',
            test: true
          },
          link: '#',
          read: false
        })
        .select()
        .single();

      if (error) throw error;
      console.log('✅ Notification créée:', data);
      return data;
    } catch (error) {
      console.error('❌ Erreur création notification:', error);
      return null;
    }
  },

  // Test 2: Créer plusieurs notifications pour tester le groupement
  async createMultipleNotifications(userId: string, count: number = 3) {
    const notifications = [];
    
    for (let i = 0; i < count; i++) {
      const notification = await this.createTestNotification(userId, 'transaction_created');
      if (notification) notifications.push(notification);
      
      // Attendre un peu entre chaque création
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`✅ ${notifications.length} notifications créées pour tester le groupement`);
    return notifications;
  },

  // Test 3: Créer des notifications avec différentes priorités
  async createPriorityTestNotifications(userId: string) {
    const priorities = ['low', 'normal', 'high', 'urgent'] as const;
    const templates = ['message', 'transaction_created', 'security_alert', 'system_update'];
    
    for (let i = 0; i < priorities.length; i++) {
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          text: `Test notification priorité ${priorities[i]}`,
          icon: ['📝', '💰', '🔒', '🔄'][i],
          type: ['communication', 'transaction', 'security', 'system'][i],
          template: templates[i],
          priority: priorities[i],
          category: ['general', 'finance', 'security', 'system'][i],
          metadata: { test: true, priority_test: true },
          read: false
        });
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    console.log('✅ Notifications de test avec différentes priorités créées');
  },

  // Test 4: Vérifier les templates système
  async checkSystemTemplates() {
    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('is_system', true);

      if (error) throw error;
      
      console.log('✅ Templates système trouvés:', data.length);
      data.forEach(template => {
        console.log(`  - ${template.id}: ${template.title} (${template.type})`);
      });
      
      return data;
    } catch (error) {
      console.error('❌ Erreur récupération templates:', error);
      return [];
    }
  },

  // Test 5: Vérifier les paramètres utilisateur
  async checkUserSettings(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_notification_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      
      console.log('✅ Paramètres utilisateur:', data);
      return data;
    } catch (error) {
      console.error('❌ Erreur récupération paramètres:', error);
      return null;
    }
  },

  // Test 6: Tester la recherche de notifications
  async testNotificationSearch(userId: string, query: string = 'test') {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .ilike('text', `%${query}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log(`✅ Recherche "${query}" - ${data.length} résultats trouvés`);
      return data;
    } catch (error) {
      console.error('❌ Erreur recherche:', error);
      return [];
    }
  },

  // Test 7: Nettoyer les notifications de test
  async cleanupTestNotifications(userId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .contains('metadata', { test: true });

      if (error) throw error;
      
      console.log('✅ Notifications de test supprimées');
    } catch (error) {
      console.error('❌ Erreur nettoyage:', error);
    }
  },

  // Test complet
  async runFullTest(userId: string) {
    console.log('🚀 Début des tests de notifications intelligentes...\n');
    
    // 1. Vérifier les templates
    await this.checkSystemTemplates();
    
    // 2. Vérifier les paramètres utilisateur
    await this.checkUserSettings(userId);
    
    // 3. Créer des notifications de test
    await this.createPriorityTestNotifications(userId);
    
    // 4. Créer des notifications multiples
    await this.createMultipleNotifications(userId, 2);
    
    // 5. Tester la recherche
    await this.testNotificationSearch(userId);
    
    console.log('\n✅ Tests terminés ! Vérifiez maintenant l\'interface utilisateur.');
    console.log('💡 Pour nettoyer les données de test, exécutez: testNotificationFeatures.cleanupTestNotifications(userId)');
  }
};

// Fonction helper pour obtenir l'ID utilisateur actuel
export const getCurrentUserId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id;
};

// Exposer globalement pour les tests dans la console
if (typeof window !== 'undefined') {
  (window as any).testNotifications = testNotificationFeatures;
  (window as any).getCurrentUserId = getCurrentUserId;
}