import { supabase } from '../supabaseClient';

export const seedTestRequests = async () => {
  try {
    // D'abord, récupérer quelques utilisateurs pour les demandeurs
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, name, role')
      .limit(5);

    if (usersError) {
      console.error('Erreur lors de la récupération des utilisateurs:', usersError);
      return;
    }

    if (!users || users.length === 0) {
      console.error('Aucun utilisateur trouvé pour créer des requêtes de test');
      return;
    }

    const testRequests = [
      {
        demandeur_id: users[0].id,
        type: 'Support technique',
        sujet: 'Problème de connexion',
        description: 'Je n\'arrive pas à me connecter à mon compte depuis ce matin. Le message d\'erreur indique "Identifiants incorrects" mais je suis sûr de mes informations.',
        status: 'En attente'
      },
      {
        demandeur_id: users[1]?.id || users[0].id,
        type: 'Problème de compte',
        sujet: 'Solde incorrect affiché',
        description: 'Mon solde affiché ne correspond pas à mes dernières transactions. Il manque 50 000 FCFA par rapport à ce que j\'ai calculé.',
        status: 'En attente'
      },
      {
        demandeur_id: users[2]?.id || users[0].id,
        type: 'Problème de transaction',
        sujet: 'Transaction bloquée depuis 2 jours',
        description: 'Ma transaction de 100 000 FCFA vers le client Amadou Diallo est bloquée en statut "En attente" depuis 2 jours. Référence: TX123456789',
        status: 'Assignée',
        assigned_to: users.find(u => u.role === 'admin_general' || u.role === 'sous_admin')?.id
      },
      {
        demandeur_id: users[3]?.id || users[0].id,
        type: 'Demande de fonctionnalité',
        sujet: 'Ajout d\'un historique détaillé',
        description: 'Il serait utile d\'avoir un historique plus détaillé des transactions avec la possibilité de filtrer par date et montant.',
        status: 'En cours de traitement',
        assigned_to: users.find(u => u.role === 'admin_general' || u.role === 'sous_admin')?.id
      },
      {
        demandeur_id: users[4]?.id || users[0].id,
        type: 'Signalement de bug',
        sujet: 'Erreur lors de l\'envoi de preuve',
        description: 'Quand j\'essaie d\'uploader une preuve de transaction, j\'obtiens une erreur 500. Le fichier fait moins de 2MB et est au format JPG.',
        status: 'En attente'
      },
      {
        demandeur_id: users[0].id,
        type: 'Support technique',
        sujet: 'Mot de passe oublié',
        description: 'J\'ai oublié mon mot de passe et le lien de réinitialisation n\'arrive pas dans ma boîte mail.',
        status: 'Résolue',
        assigned_to: users.find(u => u.role === 'admin_general')?.id,
        resolved_by_id: users.find(u => u.role === 'admin_general')?.id,
        reponse: 'Votre mot de passe a été réinitialisé. Vérifiez vos spams et contactez-nous si le problème persiste.',
        resolution_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Il y a 1 jour
      },
      {
        demandeur_id: users[1]?.id || users[0].id,
        type: 'Problème de compte',
        sujet: 'Compte suspendu par erreur',
        description: 'Mon compte a été suspendu mais je n\'ai commis aucune infraction. Pouvez-vous vérifier et le réactiver ?',
        status: 'Fermée',
        assigned_to: users.find(u => u.role === 'admin_general')?.id,
        resolved_by_id: users.find(u => u.role === 'admin_general')?.id,
        reponse: 'Après vérification, la suspension était justifiée suite à des activités suspectes détectées le 15/01. Contactez le support pour plus d\'informations.',
        resolution_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // Il y a 3 jours
      }
    ];

    const { data, error } = await supabase
      .from('requests')
      .insert(testRequests);

    if (error) {
      console.error('Erreur lors de l\'insertion des requêtes de test:', error);
    } else {
      console.log('Requêtes de test créées avec succès:', testRequests.length);
    }

  } catch (error) {
    console.error('Erreur générale:', error);
  }
};