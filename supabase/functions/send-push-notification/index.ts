import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: any
  requireInteraction?: boolean
  silent?: boolean
  vibrate?: number[]
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
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

    // Récupérer les abonnements push de l'utilisateur
    const { data: subscriptions, error: subError } = await supabaseClient
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', userId)
      .eq('active', true)

    if (subError) {
      throw subError
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Aucun abonnement push trouvé pour cet utilisateur' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Clés VAPID
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@securetrans.com'

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error('Clés VAPID manquantes')
    }

    // Préparer le payload de notification
    const notificationPayload: PushNotificationPayload = {
      title: payload.title || 'SecureTrans',
      body: payload.body || 'Nouvelle notification',
      icon: payload.icon || '/vite.svg',
      badge: '/vite.svg',
      tag: payload.tag || 'default',
      data: payload.data || {},
      requireInteraction: payload.requireInteraction || false,
      silent: payload.silent || false,
      vibrate: payload.vibrate || [200, 100, 200],
      actions: payload.actions || []
    }

    // Envoyer les notifications push
    const results = []
    
    for (const sub of subscriptions) {
      try {
        const subscription = JSON.parse(sub.subscription)
        
        // Utiliser l'API Web Push
        const response = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Authorization': `key=${Deno.env.get('FCM_SERVER_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: subscription.endpoint.split('/').pop(),
            notification: notificationPayload,
            data: notificationPayload.data
          })
        })

        if (response.ok) {
          results.push({ success: true, endpoint: subscription.endpoint })
        } else {
          const errorText = await response.text()
          results.push({ 
            success: false, 
            endpoint: subscription.endpoint, 
            error: errorText 
          })
        }
      } catch (error) {
        results.push({ 
          success: false, 
          endpoint: 'unknown', 
          error: error.message 
        })
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Notifications envoyées',
        results: results,
        sent: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
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