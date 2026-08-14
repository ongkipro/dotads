"use client";

import React from "react";
import { OrderDataTable } from "@/components/OrderDataTable";

export default function AdminOrdersPage() {
  return (
    <div className="space-y-6">
      <OrderDataTable />
    </div>
  );
}
