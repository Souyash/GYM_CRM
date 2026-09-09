import React, { useState, useEffect } from 'react';
import { Smartphone, Check, X, ShieldAlert, User, Clock, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { DeviceChangeRequest } from '../types';
import { getSocket } from '../services/socket';

export const DeviceApprovalsView: React.FC = () => {
  const [requests, setRequests] = useState<DeviceChangeRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const data = await api.getDeviceRequests(statusFilter);
      setRequests(data.requests || []);
    } catch (e) {
      console.error('Failed to load device requests:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();

    const socket = getSocket();
    const handleNewConflict = () => {
      loadRequests();
    };

    socket.on('alert:multi_device', handleNewConflict);
    return () => {
      socket.off('alert:multi_device', handleNewConflict);
    };
  }, [statusFilter]);

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(id);
      await api.approveDeviceRequest(id, 'Approved entry for member');
      await loadRequests();
    } catch (e: any) {
      alert(e.message || 'Failed to approve entry');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    try {
      setActionLoading(id);
      await api.rejectDeviceRequest(id, 'Denied extra daily visit by front desk');
      await loadRequests();
    } catch (e: any) {
      alert(e.message || 'Failed to decline request');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 font-poppins">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl app-card">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">Daily Visit Review & Access Approvals</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review and grant entry for members checking in more than once in a single day
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === 'PENDING'
                ? 'bg-amber-500 text-black font-extrabold shadow-sm'
                : 'btn-secondary-gym'
            }`}
          >
            Pending ({requests.filter(r => r.status === 'PENDING').length})
          </button>
          <button
            onClick={() => setStatusFilter('APPROVED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === 'APPROVED'
                ? 'bg-emerald-500 text-black font-extrabold shadow-sm'
                : 'btn-secondary-gym'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setStatusFilter('REJECTED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === 'REJECTED'
                ? 'bg-rose-500 text-white font-extrabold shadow-sm'
                : 'btn-secondary-gym'
            }`}
          >
            Declined
          </button>
        </div>
      </div>

      {/* Requests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {requests.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 app-card rounded-2xl">
            <ShieldAlert className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">
              No {statusFilter.toLowerCase()} member visit notices.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              When a member attempts a second gym visit on the same day, their check-in request will appear here for staff approval.
            </p>
          </div>
        ) : (
          requests.map((req) => (
            <div
              key={req.id}
              className="app-card rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-emerald-500/40 transition"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                      {req.user.fullName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">{req.user.fullName}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{req.user.email}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      req.status === 'PENDING'
                        ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40 animate-pulse'
                        : req.status === 'APPROVED'
                        ? 'badge-active-green'
                        : 'badge-alert-coral'
                    }`}
                  >
                    {req.status === 'PENDING' ? 'NEEDS APPROVAL' : req.status}
                  </span>
                </div>

                {/* Visit Details Card */}
                <div className="p-3 app-card-subtle rounded-xl space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">Daily Visit Notice</span>
                    <span className="text-slate-700 dark:text-slate-300 font-semibold text-xs">
                      Member has already logged an entry today and is requesting an additional check-in.
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-dark-700 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                      Membership Status
                    </span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      Active Member
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Requested: {new Date(req.createdAt).toLocaleTimeString()} ({new Date(req.createdAt).toLocaleDateString()})
                  </span>
                </div>
              </div>

              {/* Action Buttons for Pending */}
              {req.status === 'PENDING' && (
                <div className="pt-3 border-t border-slate-100 dark:border-dark-800 flex items-center gap-2">
                  <button
                    disabled={actionLoading === req.id}
                    onClick={() => handleApprove(req.id)}
                    className="btn-primary-green flex-1 flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    Approve Entry
                  </button>
                  <button
                    disabled={actionLoading === req.id}
                    onClick={() => handleReject(req.id)}
                    className="btn-secondary-gym flex items-center justify-center gap-1 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                  >
                    <X className="w-4 h-4" />
                    Decline
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

