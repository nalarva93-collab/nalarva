import {demoApi} from "@/lib/demo-api";

export type ApiResult<T = unknown> = {
  ok: boolean;
  message?: string;
  data?: T;
};

export type NalarvaRole = "SISWA" | "TUTOR" | "ADMIN" | "ORANG_TUA";

export type NalarvaSession = {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: NalarvaRole;
  };
  expiresAt?: string;
};

const API_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || "";
const SESSION_KEY = "nalarva:session";

export function isBackendConfigured() {
  return Boolean(API_URL);
}

export function getStoredSession(): NalarvaSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as NalarvaSession) : null;
  } catch {
    return null;
  }
}

export function storeSession(session: NalarvaSession) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
}

export function clearSession() {
  if (typeof window !== "undefined") window.localStorage.removeItem(SESSION_KEY);
}

export async function submitToNalarva<T = unknown>(
  action: string,
  payload: Record<string, unknown> = {},
): Promise<ApiResult<T>> {
  if (!API_URL) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        `nalarva:demo:${action}:${Date.now()}`,
        JSON.stringify(payload),
      );
    }
    return demoApi<T>(action,payload);
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, ...payload }),
    });
    if (!res.ok) return { ok: false, message: "Backend Nalarva tidak dapat dihubungi." };
    return (await res.json()) as ApiResult<T>;
  } catch {
    return { ok: false, message: "Koneksi ke backend Nalarva gagal." };
  }
}

export async function authedNalarva<T = unknown>(
  action: string,
  payload: Record<string, unknown> = {},
): Promise<ApiResult<T>> {
  const session = getStoredSession();
  if (!session && API_URL) return {ok:false,message:"Sesi login tidak ditemukan."};
  return submitToNalarva<T>(action,{...payload,token:session?.token||"demo-token"});
}

export async function loginNalarva(email: string, password: string) {
  if (!API_URL) {
    const low=email.toLowerCase();
    const role: NalarvaRole = low.includes("admin")
      ? "ADMIN"
      : low.includes("tutor")
        ? "TUTOR"
        : (low.includes("orangtua")||low.includes("parent")||low.includes("wali")||low.includes("ortu"))
          ? "ORANG_TUA"
          : "SISWA";
    const session: NalarvaSession = {
      token: "demo-token",
      user: {
        id: role==="ADMIN"?"USR-ADMIN":role==="TUTOR"?"USR-TUTOR":role==="ORANG_TUA"?"USR-PARENT":"demo-user",
        email,
        name: role === "ADMIN" ? "Admin Nalarva" : role === "TUTOR" ? "Raka Pratama" : role==="ORANG_TUA" ? "Ibu Anisa" : "Anisa",
        role,
      },
    };
    storeSession(session);
    return { ok: true, message: "Mode demo lokal.", data: session } as ApiResult<NalarvaSession>;
  }

  const result = await submitToNalarva<NalarvaSession>("login", { email, password });
  if (result.ok && result.data) storeSession(result.data);
  return result;
}

export async function validateSession() {
  const session = getStoredSession();
  if (!session) return { ok: false, message: "Belum login." } as ApiResult;
  if (!API_URL) return { ok: true, data: session } as ApiResult<NalarvaSession>;
  return submitToNalarva<NalarvaSession>("me", { token: session.token });
}

export async function logoutNalarva() {
  const session = getStoredSession();
  if (session && API_URL) await submitToNalarva("logout", { token: session.token });
  clearSession();
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve,reject)=>{
    if(file.size>4*1024*1024){reject(new Error("Ukuran file maksimal 4 MB untuk upload langsung."));return;}
    const reader=new FileReader();
    reader.onload=()=>resolve(String(reader.result||""));
    reader.onerror=()=>reject(new Error("File tidak dapat dibaca."));
    reader.readAsDataURL(file);
  });
}

export function formatDate(value:unknown, withTime=false){
  if(!value) return "—";
  const d=new Date(String(value));
  if(Number.isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat("id-ID",withTime?{dateStyle:"medium",timeStyle:"short"}:{dateStyle:"medium"}).format(d);
}
