import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Créer le client Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Vérifier l'authentification
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { userId, payload } = await req.json()

    // Utiliser l'ID de l'utilisateur authentifié si userId n'est pas fourni ou invalide
    const targetUserId = (userId && userId !== 'current-user') ? userId : user.id

    // Récupérer les abonnements push de l'utilisateur
    const { data: subscriptions, error: subError } = await supabaseClient
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', targetUserId)

    if (subError) {
      throw subError
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Aucun abonnement push trouvé pour cet utilisateur' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Créer un tag unique pour éviter les doublons
    const notificationTag = payload.tag || `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const notificationText = `${payload.title}: ${payload.body}`

    // Vérifier s'il y a déjà une notification similaire récente (dernières 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const { data: existingNotifs } = await supabaseClient
      .from('notifications')
      .select('id')
      .eq('user_id', targetUserId)
      .eq('text', notificationText)
      .gte('created_at', fiveMinutesAgo)
      .limit(1)

    if (existingNotifs && existingNotifs.length > 0) {
      return new Response(
        JSON.stringify({ 
          message: 'Notification en double évitée',
          duplicate_avoided: true
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Enregistrer la notification dans la base de données
    const { error: notifError } = await supabaseClient
      .from('notifications')
      .insert({
        user_id: targetUserId,
        icon: payload.icon || '🔔',
        text: notificationText,
        type: payload.type || 'user_alert',
        template: payload.template || null,
        priority: payload.priority || 'normal',
        category: payload.category || 'general',
        metadata: {
          ...payload.data || {},
          notificationTag: notificationTag
        }
      })

    if (notifError) {
      console.error('Erreur lors de l\'enregistrement de la notification:', notifError)
    }

    // Pour l'instant, on simule l'envoi réussi
    // Dans une vraie implémentation, il faudrait utiliser une bibliothèque Web Push
    // avec les clés VAPID appropriées
    
    return new Response(
      JSON.stringify({ 
        message: 'Notification enregistrée avec succès',
        subscriptions_found: subscriptions.length,
        notification_saved: !notifError
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Erreur lors de l\'envoi des notifications push:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})