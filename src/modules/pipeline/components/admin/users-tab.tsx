"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import type { AdminUser, FeedbackHandler } from "./types";


/**
 * Admin → Users (PRD § 03): every account with its role, status and order count.
 * Admins can promote/demote roles and deactivate accounts; the server refuses
 * changes that would lock the last admin out.
 */
export function UsersTab({ onFeedback }: { onFeedback: FeedbackHandler }) {
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsUsersLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users || []);
      }
    } catch (err) {
      console.warn("Failed to fetch users:", err);
    } finally {
      setIsUsersLoading(false);
    }
  }, []);

  // Load the list when the tab opens.
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  /** Switch a user between customer and admin. */
  const handleRoleChange = async (userId: string, newRole: "customer" | "admin") => {
    onFeedback(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        onFeedback({ type: "error", text: data.error || "Role change blocked" });
        return;
      }
      onFeedback({ type: "success", text: `User role updated to ${newRole}.` });
      await fetchUsers();
    } catch {
      onFeedback({ type: "error", text: "Role update failed." });
    }
  };

  /** Deactivate or reactivate an account. */
  const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
    onFeedback(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        onFeedback({ type: "error", text: data.error || "Status update blocked" });
        return;
      }
      onFeedback({
        type: "success",
        text: `User account ${!currentStatus ? "activated" : "deactivated"} successfully.`,
      });
      await fetchUsers();
    } catch {
      onFeedback({ type: "error", text: "Status update failed." });
    }
  };

  return (
    <Card className="border-neutral-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">User Accounts & Roles</CardTitle>
        <CardDescription className="text-xs">
          Manage internal staff privileges, inspect customer order counts, and toggle account activation. Safeguards prevent self-demotion or removal of the last administrator.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isUsersLoading ? (
          <div className="py-8 text-center text-neutral-500">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#FF5A1F]" />
            Loading accounts...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-neutral-50 text-xs font-semibold uppercase text-neutral-600 border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4">Name / Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Orders</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Role Switch</th>
                  <th className="py-3 px-4 text-center">Account Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {usersList.map((u) => (
                  <tr key={u.id} data-testid="admin-user-row" className="hover:bg-neutral-50/70">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-neutral-900">{u.full_name || u.email}</div>
                      <div className="text-xs text-neutral-500">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        className={
                          u.role === "admin"
                            ? "bg-purple-100 text-purple-800 border-purple-200"
                            : "bg-neutral-100 text-neutral-800 border-neutral-200"
                        }
                      >
                        {u.role}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-neutral-800">{u.orderCount || 0}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium ${
                          u.isActive ? "text-emerald-700" : "text-red-600"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${u.isActive ? "bg-emerald-500" : "bg-red-500"}`}
                        />
                        {u.isActive ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <select
                        data-testid="admin-user-role-select"
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as "customer" | "admin")}
                        className="text-xs border border-neutral-300 rounded px-2 py-1 bg-white"
                      >
                        <option value="customer">customer</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        data-testid="admin-user-status-btn"
                        onClick={() => handleStatusToggle(u.id, u.isActive)}
                        className={`h-7 px-2.5 text-xs ${
                          u.isActive ? "text-red-600 hover:bg-red-50" : "text-emerald-600 hover:bg-emerald-50"
                        }`}
                      >
                        {u.isActive ? "Deactivate" : "Reactivate"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
