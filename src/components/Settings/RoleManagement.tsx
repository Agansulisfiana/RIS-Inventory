import React, { useEffect, useState } from 'react';
import { storageService } from '../../services/storage';
import { User, UserRole } from '../../types';
import { Save, User as UserIcon, ChevronRight } from 'lucide-react';

const ROLE_OPTIONS: UserRole[] = ['admin','owner','sales','operator','staff','technician','system'];

export const RoleManagement: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setUsers(storageService.getUsers());
  }, []);

  const handleChangeRole = (u: User, role: UserRole) => {
    const next = users.map(user => user.id === u.id ? { ...user, role } : user);
    setUsers(next);
  };

  const handleSave = () => {
    setSaving(true);
    try {
      users.forEach(u => storageService.saveUser(u, currentUser));
      storageService.addAuditLog({
        action: 'UPDATE_ROLES',
        module: 'auth',
        category: 'auth',
        details: `Perubahan role oleh ${currentUser.name}`,
        user: currentUser
      });
    } catch (e) {
      console.warn('Gagal menyimpan role:', e);
    }
    setTimeout(() => setSaving(false), 600);
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold text-slate-800 flex items-center gap-2"><UserIcon className="w-4 h-4 text-blue-600"/>Manajemen Role Pengguna</div>
        <button onClick={handleSave} className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold">{saving ? 'Menyimpan...' : 'Simpan'}</button>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {users.map(u => (
          <div key={u.id} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-100">
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 truncate">{u.name} <span className="text-[10px] text-slate-500">({u.username || u.email})</span></div>
              <div className="text-[10px] text-slate-500">{u.department}</div>
            </div>
            <div className="flex items-center gap-2">
              <select value={u.role} onChange={(e) => handleChangeRole(u, e.target.value as UserRole)} className="text-xs px-2 py-1 rounded-lg border border-slate-200">
                {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoleManagement;
