// supabase/functions/financial-advice/index.ts

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
    // 1. Ambil Environment Variables & Cek
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"); // Gunakan Service Role Key

    if (!GOOGLE_AI_API_KEY) throw new Error("GOOGLE_AI_API_KEY is not configured");
    if (!supabaseUrl) throw new Error("SUPABASE_URL is not configured");
    if (!supabaseKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");

    // 2. Buat Klien Supabase (dengan Service Role Key)
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 3. Autentikasi User dari Header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.error("Auth Error:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 4. Ambil Data Keuangan User
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const endOfMonth = new Date().toISOString().split("T")[0]; // Tanggal hari ini

    const { data: transactions, error: transError } = await supabase
      .from("transactions")
      .select("amount, type, category_id")
      .eq("user_id", user.id)
      .gte("transaction_date", startOfMonth)
      .lte("transaction_date", endOfMonth);
    if (transError) throw new Error(`Failed to fetch transactions: ${transError.message}`);

    const { data: categories, error: catError } = await supabase
      .from("categories")
      .select("id, name, type")
      .eq("user_id", user.id);
    if (catError) throw new Error(`Failed to fetch categories: ${catError.message}`);

    const safeTransactions = transactions || [];
    const safeCategories = categories || [];

    // 5. Proses Data Keuangan (Perhitungan)
    const totalIncome = safeTransactions
      .filter((t: any) => t.type === "income")
      .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
    const totalExpense = safeTransactions
      .filter((t: any) => t.type === "expense")
      .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);

    const categoryMap = new Map<string, number>();
    safeTransactions.forEach((t: any) => {
      if (t.type === "expense" && t.category_id) {
        const current = categoryMap.get(t.category_id) || 0;
        categoryMap.set(t.category_id, current + Number(t.amount || 0));
      }
    });

    let highestCategory = "Uncategorized";
    let highestAmount = 0;
    categoryMap.forEach((amount, catId) => {
      if (amount > highestAmount) {
        highestAmount = amount;
        const cat = safeCategories.find((c: any) => c.id === catId);
        highestCategory = cat?.name || "Uncategorized";
      }
    });

    const balance = totalIncome - totalExpense;

    const formatIDR = (amount: number) => {
        return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
    };

    // 6. Buat Prompt untuk Google AI
    const prompt = `Analisis data keuangan berikut:
- Total Pendapatan Bulan Ini: ${formatIDR(totalIncome)}
- Total Pengeluaran Bulan Ini: ${formatIDR(totalExpense)}
- Kategori Pengeluaran Tertinggi: ${highestCategory} (${formatIDR(highestAmount)})
- Sisa Saldo: ${formatIDR(balance)}

Berikan 3-5 tips praktis untuk meningkatkan kesehatan keuangan dalam bahasa Indonesia. Jawaban harus singkat, jelas, dan actionable. Format dalam bentuk poin-poin dengan emoji yang relevan.`;

    // 7. Panggil Google AI API
    // --- PERUBAHAN DI SINI ---
    // Ganti 'gemini-pro' menjadi 'gemini-1.5-flash-latest' atau model lain yang valid
    const modelName = "gemini-1.5-flash-latest"; // Atau coba 'gemini-1.0-pro' jika flash tidak tersedia/diinginkan
    const googleAiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GOOGLE_AI_API_KEY}`;
    // --- AKHIR PERUBAHAN ---

    const googleAiPayload = {
        contents: [ { parts: [ { text: prompt } ] } ],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
    };

    const googleAiResponse = await fetch(googleAiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(googleAiPayload),
      }
    );

    if (!googleAiResponse.ok) {
      let errorBody = "Could not read error response body.";
      try {
          errorBody = await googleAiResponse.text();
      } catch (_) { /* Abaikan jika body tidak bisa dibaca */ }
      console.error("Google AI API error:", googleAiResponse.status, errorBody);
      throw new Error(`Google AI API failed with status ${googleAiResponse.status}: ${errorBody.substring(0, 200)}`);
    }

    const googleAiData = await googleAiResponse.json();

    const suggestion = googleAiData.candidates?.[0]?.content?.parts?.[0]?.text || "Tidak ada saran yang tersedia saat ini.";

    // 8. Kirim Respons Sukses
    return new Response(
      JSON.stringify({ suggestion }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in financial-advice function:", error); // Tetap log error server
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal Server Error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});