import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function AIFinancialSuggestion() {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const getFinancialAdvice = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("financial-advice", {
        body: {},
      });

      if (error) {
        console.error("Error calling financial-advice:", error);
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setSuggestion(data.suggestion);
      toast.success("AI advice generated successfully!");
    } catch (error: any) {
      console.error("Error getting financial advice:", error);
      toast.error(error.message || "Failed to get financial advice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="rounded-full p-2 gradient-primary">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          AI Financial Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!suggestion && (
          <p className="text-muted-foreground">
            Get personalized financial advice based on your transaction history and spending patterns.
          </p>
        )}

        {suggestion && (
          <div className="rounded-lg bg-muted/50 p-4 whitespace-pre-wrap">
            {suggestion}
          </div>
        )}

        <Button
          onClick={getFinancialAdvice}
          disabled={loading}
          className="w-full gradient-primary"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Advice...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              {suggestion ? "Get New Advice" : "Get Financial Advice"}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
