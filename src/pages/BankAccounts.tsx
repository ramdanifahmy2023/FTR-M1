import { BankAccountList } from "@/components/bank-accounts/BankAccountList";

export default function BankAccounts() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Rekening Bank</h1>
      <BankAccountList />
    </div>
  );
}