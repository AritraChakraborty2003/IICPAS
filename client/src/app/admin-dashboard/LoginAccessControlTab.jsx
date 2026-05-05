"use client";
import { getApiBase } from "@/lib/apiBase";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Trash2 } from "lucide-react";

const API_BASE = getApiBase();

const ROLE_OPTIONS = [
  "all",
  "employee",
  "admin",
  "student",
  "individual",
  "center",
  "company",
  "college",
  "teacher",
];

export default function LoginAccessControlTab() {
  const [apiKey, setApiKey] = useState("Galaxy@09IPO!FrS");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [bulkUpdating, setBulkUpdating] = useState(false);

  const headers = useMemo(() => {
    const token = localStorage.getItem("adminToken");
    return {
      Authorization: `Bearer ${token}`,
      "x-master-api-key": apiKey,
    };
  }, [apiKey]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/master/login-access/users`, {
        headers,
        params: {
          role,
          status,
          search: search.trim(),
          page: 1,
          limit: 200,
        },
      });
      setUsers(response.data?.items || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [headers, role, status, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateSingle = async (item, nextStatus) => {
    try {
      setUpdatingId(item.user_id);
      await axios.patch(
        `${API_BASE}/master/login-access/users/${item.role}/${item.user_id}`,
        { status: nextStatus },
        { headers }
      );
      toast.success(`Updated ${item.name}`);
      fetchUsers();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update user");
    } finally {
      setUpdatingId("");
    }
  };

  const deleteSingle = async (item) => {
    const confirmed = window.confirm(
      `Delete the login access override for ${item.name}? This will revert to the base access status.`
    );
    if (!confirmed) return;

    try {
      setUpdatingId(item.user_id);
      await axios.delete(
        `${API_BASE}/master/login-access/users/${item.role}/${item.user_id}`,
        { headers }
      );
      toast.success(`Deleted override for ${item.name}`);
      fetchUsers();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete user");
    } finally {
      setUpdatingId("");
    }
  };

  const updateBulk = async (nextStatus) => {
    try {
      setBulkUpdating(true);
      const response = await axios.patch(
        `${API_BASE}/master/login-access/users/bulk`,
        {
          role,
          status: nextStatus,
          search: search.trim(),
        },
        { headers }
      );
      toast.success(
        `${response.data?.affected || 0} user(s) set to ${nextStatus}`
      );
      fetchUsers();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Bulk update failed");
    } finally {
      setBulkUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h2 className="text-xl font-bold mb-4">Master Login Access Control</h2>
      <p className="text-sm text-gray-600 mb-6">
        Control active/inactive login state for all login-enabled users using master API key.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full border rounded-md px-3 py-2"
            placeholder="Master API Key"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full border rounded-md px-3 py-2"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border rounded-md px-3 py-2"
          >
            <option value="all">all</option>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Search</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-md px-3 py-2"
            placeholder="name or email"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={fetchUsers}
          className="px-4 py-2 bg-blue-600 text-white rounded-md"
        >
          Refresh
        </button>
        <button
          disabled={bulkUpdating}
          onClick={() => updateBulk("active")}
          className="px-4 py-2 bg-green-600 text-white rounded-md disabled:opacity-60"
        >
          Set Filtered Active
        </button>
        <button
          disabled={bulkUpdating}
          onClick={() => updateBulk("inactive")}
          className="px-4 py-2 bg-red-600 text-white rounded-md disabled:opacity-60"
        >
          Set Filtered Inactive
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading users...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-2 border-b">Role</th>
                <th className="text-left p-2 border-b">Name</th>
                <th className="text-left p-2 border-b">Email</th>
                <th className="text-left p-2 border-b">User ID</th>
                <th className="text-left p-2 border-b">Base</th>
                <th className="text-left p-2 border-b">Override</th>
                <th className="text-left p-2 border-b">Effective</th>
                <th className="text-left p-2 border-b">Toggle</th>
                <th className="text-left p-2 border-b">Delete</th>
              </tr>
            </thead>
            <tbody>
              {users.map((item) => (
                <tr key={`${item.role}-${item.user_id}`} className="border-b">
                  <td className="p-2">{item.role}</td>
                  <td className="p-2">{item.name}</td>
                  <td className="p-2">{item.email}</td>
                  <td className="p-2 text-xs">{item.user_id}</td>
                  <td className="p-2">{item.baseStatus}</td>
                  <td className="p-2">{item.overrideStatus}</td>
                  <td className="p-2 font-semibold">{item.effectiveStatus}</td>
                  <td className="p-2">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={item.overrideStatus === "active"}
                      onClick={() =>
                        updateSingle(
                          item,
                          item.overrideStatus === "active" ? "inactive" : "active"
                        )
                      }
                      disabled={updatingId === item.user_id}
                      className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors disabled:opacity-60 ${
                        item.overrideStatus === "active"
                          ? "bg-green-600"
                          : "bg-gray-400"
                      }`}
                      title={
                        item.overrideStatus === "active"
                          ? "Click to set inactive"
                          : "Click to set active"
                      }
                    >
                      <span className="sr-only">
                        {item.overrideStatus === "active"
                          ? "Set inactive"
                          : "Set active"}
                      </span>
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                          item.overrideStatus === "active"
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                    <span className="ml-2 text-xs font-medium capitalize">
                      {item.overrideStatus === "active" ? "On" : "Off"}
                    </span>
                  </td>
                  <td className="p-2">
                    <button
                      type="button"
                      onClick={() => deleteSingle(item)}
                      disabled={updatingId === item.user_id}
                      className="inline-flex items-center gap-1 rounded-md bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                      title="Delete login access override"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {!users.length && (
                <tr>
                  <td colSpan={9} className="p-4 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
