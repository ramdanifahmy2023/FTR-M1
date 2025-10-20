// src/pages/Assets.tsx

import { AssetList } from "@/components/assets/AssetList";

export default function Assets() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Aset</h1>
      <AssetList />
    </div>
  );
}