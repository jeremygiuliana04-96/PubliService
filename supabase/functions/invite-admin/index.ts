import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authorization = req.headers.get("Authorization");

    if (!authorization) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Vous devez être connecté.",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const token = authorization.replace("Bearer ", "");

    // Client utilisé pour identifier l'utilisateur connecté
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: {
            Authorization: authorization,
          },
        },
      },
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Session invalide ou expirée.",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // Vérifie que l'utilisateur connecté est administrateur
    const { data: profile, error: profileError } = await supabaseUser
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Seul un administrateur peut inviter un autre administrateur.",
        }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const body = await req.json();
    const email = body?.email?.trim()?.toLowerCase();

    if (!email) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "L’adresse e-mail est obligatoire.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "L’adresse e-mail n’est pas valide.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // Client serveur disposant des droits d'administration
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    const { data: invitation, error: invitationError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: {
          role: "admin",
          invited_by: user.id,
        },
      });

    if (invitationError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: invitationError.message,
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // Ajoute également le rôle dans les métadonnées protégées
    if (invitation.user?.id) {
      const { error: metadataError } =
        await supabaseAdmin.auth.admin.updateUserById(invitation.user.id, {
          app_metadata: {
            role: "admin",
          },
        });

      if (metadataError) {
        console.error(
          "Erreur lors de l’ajout du rôle administrateur :",
          metadataError.message,
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Une invitation a été envoyée à ${email}.`,
        userId: invitation.user?.id,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error(error);

    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Une erreur inattendue est survenue.",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});