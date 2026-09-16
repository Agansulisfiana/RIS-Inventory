import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Mail, 
  KeyRound, 
  ShieldCheck, 
  UserCheck, 
  Warehouse, 
  ArrowRight,
  Sparkles,
  AlertCircle,
  UserPlus,
  Info,
  Phone,
  User as UserIcon,
  CheckCircle2,
  Eye,
  EyeOff,
  Building2,
  Briefcase,
  Layers,
  ChevronRight
} from 'lucide-react';
import { User, UserRole, WarehouseSettings } from '../../types';
import { storageService } from '../../services/storage';
import { RisLogo } from '../Common/RisLogo';

interface LoginModalProps {
  isOpen?: boolean;
  onLoginSuccess: (user: User) => void;
  settings?: WarehouseSettings;
  onOpenPublicDashboard?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen = true,
  onLoginSuccess,
  settings,
  onOpenPublicDashboard
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Login Form State
  const [identifier, setIdentifier] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Register Form State
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regDepartment, setRegDepartment] = useState('Gudang & Operasional');
  const [regRole, setRegRole] = useState<UserRole>('operator');
  const [regPassword, setRegPassword] = useState('');

  // User Accounts list for 1-click login presets
  const [existingUsers, setExistingUsers] = useState<User[]>([]);

  useEffect(() => {
    setExistingUsers(storageService.getUsers());
  }, [isOpen, authMode]);

  if (isOpen === false) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!identifier.trim()) {
      setErrorMsg('Harap masukkan Username atau Email.');
      return;
    }

    const user = storageService.authenticate(identifier, password);
    if (user) {
      setSuccessMsg(`Selamat datang kembali, ${user.name}!`);
      setTimeout(() => {
        onLoginSuccess(user);
      }, 400);
    } else {
      setErrorMsg('Username/Email atau Password tidak sesuai. Silakan periksa kembali atau pilih akun demo di bawah.');
    }
  };

  const handleQuickLogin = (targetUser: User) => {
    setErrorMsg('');
    setSuccessMsg(`Masuk sebagai ${targetUser.name}...`);
    setIdentifier(targetUser.username || targetUser.email || '');
    setPassword(targetUser.password || '');

    const user = storageService.authenticate(targetUser.username || targetUser.email || '', targetUser.password);
    if (user) {
      setTimeout(() => {
        onLoginSuccess(user);
      }, 400);
    } else {
      // Fallback direct set
      storageService.setCurrentUser(targetUser);
      onLoginSuccess(targetUser);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!regName.trim()) {
      setErrorMsg('Nama lengkap wajib diisi.');
      return;
    }

    if (!regUsername.trim() && !regEmail.trim()) {
      setErrorMsg('Username atau Email wajib diisi.');
      return;
    }

    const res = storageService.registerNewUser({
      name: regName.trim(),
      username: regUsername.trim() || regEmail.split('@')[0],
      email: regEmail.trim() || `${regUsername.trim()}@reycom.co.id`,
      phone: regPhone.trim(),
      department: regDepartment.trim() || 'Logistik & Sales',
      role: regRole,
      password: regPassword.trim() || '123456'
    });

    if (res.success && res.user) {
      setSuccessMsg(`Akun "${res.user.name}" berhasil didaftarkan! Mengalihkan ke sistem...`);
      storageService.setCurrentUser(res.user);
      setTimeout(() => {
        onLoginSuccess(res.user!);
      }, 600);
    } else {
      setErrorMsg(res.message || 'Gagal mendaftarkan akun baru.');
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 font-mono uppercase">Admin</span>;
      case 'sales':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-mono uppercase">Sales / POC</span>;
      case 'operator':
      case 'staff':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 font-mono uppercase">Gudang</span>;
      case 'technician':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-100 text-cyan-800 font-mono uppercase">Teknisi</span>;
      case 'owner':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 font-mono uppercase">Owner</span>;
      default:
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono uppercase">{role}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl p-6 sm:p-8 space-y-6 shadow-2xl relative my-auto">
        
        {/* Header Branding */}
        <div className="text-center space-y-2 relative">
          <div className="inline-flex items-center justify-center mb-1">
            <RisLogo size={64} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              RIS Inventory produk dan demo unit
            </h1>
            <p className="text-xs text-slate-500 font-medium max-w-md mx-auto mt-1">
              PT. Reycom Integrated Solusi — Sistem Manajemen Produk, Surat Jalan Penjualan, & Tracking Unit Demo
            </p>
          </div>
        </div>

        {/* Tab Switcher: Login vs Register */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              authMode === 'login' 
                ? 'bg-white text-blue-600 shadow-xs font-bold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Masuk ke Sistem</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode('register');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              authMode === 'register' 
                ? 'bg-white text-blue-600 shadow-xs font-bold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Daftar Akun Baru</span>
          </button>
        </div>

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        {/* LOGIN TAB */}
        {authMode === 'login' ? (
          <div className="space-y-5">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Username atau Email:
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Contoh: admin atau admin@reycom.co.id"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Password:
                  </label>
                  <span className="text-[11px] text-slate-400">Default: password sesuai username</span>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <span>Masuk ke Dashboard RIS</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick 1-Click Login from Registered Accounts */}
            <div className="pt-4 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>1-Click Pilihan Akun Cepat:</span>
                </span>
                <span className="text-[10px] text-slate-400">Klik langsung untuk login</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {existingUsers.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickLogin(u)}
                    className="p-3 bg-slate-50 hover:bg-blue-50/80 border border-slate-200 hover:border-blue-300 rounded-xl text-left transition-all group cursor-pointer flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        {getRoleBadge(u.role)}
                        <span className="text-[10px] text-slate-400 font-mono">pwd: {u.password || 'admin'}</span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600">
                        {u.name}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate font-mono">
                        user: <span className="font-semibold text-slate-700">{u.username || u.email}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* REGISTER TAB */
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Nama Lengkap:</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Contoh: Ahmad Fauzi"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Username:</label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="contoh: fauzi"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Email:</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="fauzi@reycom.co.id"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">No. HP / WhatsApp:</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Divisi / Departemen:</label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={regDepartment}
                    onChange={(e) => setRegDepartment(e.target.value)}
                    placeholder="Gudang / Sales / Lab"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Pilih Peran / Hak Akses (Role):</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'admin', label: 'Admin', desc: 'Full Akses' },
                  { id: 'sales', label: 'Sales PIC', desc: 'Demo & DO' },
                  { id: 'operator', label: 'Staf Gudang', desc: 'Stok & Scan' },
                  { id: 'technician', label: 'Teknisi', desc: 'Service & Lab' }
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRegRole(r.id as UserRole)}
                    className={`p-2.5 border rounded-xl text-left cursor-pointer transition-all ${
                      regRole === r.id 
                        ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-600' 
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900">{r.label}</div>
                    <div className="text-[10px] text-slate-500">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Password Baru:</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Buat kata sandi akun..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Daftar & Masuk Otomatis</span>
            </button>
          </form>
        )}

        {/* Public TV Wallboard Link */}
        {onOpenPublicDashboard && (
          <div className="pt-2 text-center border-t border-slate-100">
            <button
              type="button"
              onClick={onOpenPublicDashboard}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold inline-flex items-center gap-1.5 hover:underline cursor-pointer"
            >
              <span>📺 Buka Tampilan TV Wallboard Publik (Tanpa Login)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
