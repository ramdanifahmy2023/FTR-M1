import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_AI_API_KEY) {
      throw new Error("GOOGLE_AI_API_KEY is not configured");
    }

    // --- START PERBAIKAN KRITIS ---
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
        return new Response(
            JSON.stringify({ error: "SUPABASE environment variables are not configured correctly in Edge Function deployment." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    // --- END PERBAIKAN KRITIS ---

    // Get user from authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch user's financial data
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const endOfMonth = new Date().toISOString().split("T")[0];

    // Get transactions for this month
    const { data: transactions } = await supabase
      .from("transactions")
      .select("amount, type, category_id")
      .eq("user_id", user.id)
      .gte("transaction_date", startOfMonth)
      .lte("transaction_date", endOfMonth);

    // Get categories
    const { data: categories } = await supabase
      .from("categories")
      .select("id, name, type")
      .eq("user_id", user.id);

    // Calculate totals
    const totalIncome = transactions
      ?.filter((t: any) => t.type === "income")
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0;

    const totalExpense = transactions
      ?.filter((t: any) => t.type === "expense")
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0;

    // Find highest expense category
    const categoryMap = new Map();
    transactions?.forEach((t: any) => {
      if (t.type === "expense" && t.category_id) {
        const current = categoryMap.get(t.category_id) || 0;
        categoryMap.set(t.category_id, current + Number(t.amount));
      }
    });

    let highestCategory = "Uncategorized";
    let highestAmount = 0;

    categoryMap.forEach((amount, catId) => {
      if (amount > highestAmount) {
        highestAmount = amount;
        const cat = categories?.find((c: any) => c.id === catId);
        highestCategory = cat?.name || "Uncategorized";
      }
    });

    const balance = totalIncome - totalExpense;

    // Format currency for prompt
    const formatIDR = (amount: number) => {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(amount);
    };

    // Create prompt for Gemini
    const prompt = `Analisis data keuangan berikut:
- Total Pendapatan Bulan Ini: ${formatIDR(totalIncome)}
- Total Pengeluaran Bulan Ini: ${formatIDR(totalExpense)}
- Kategori Pengeluaran Tertinggi: ${highestCategory} (${formatIDR(highestAmount)})
- Sisa Saldo: ${formatIDR(balance)}

Berikan 3-5 tips praktis untuk meningkatkan kesehatan keuangan dalam bahasa Indonesia. Jawaban harus singkat, jelas, dan actionable. Format dalam bentuk poin-poin dengan emoji yang relevan.`;

    console.log("Calling Google AI API with prompt:", prompt);

    // Call Google AI API (Gemini Pro)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GOOGLE_AI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google AI API error:", response.status, errorText);
      throw new Error(`Google AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Google AI response:", JSON.stringify(data));

    const suggestion = data.candidates?.[0]?.content?.parts?.[0]?.text || "No suggestion available";

    return new Response(
      JSON.stringify({ 
        suggestion,
        financialData: {
          totalIncome,
          totalExpense,
          balance,
          highestCategory,
          highestAmount,
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in financial-advice function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});