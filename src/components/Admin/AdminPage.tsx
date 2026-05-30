import { useState, useEffect, useRef } from "react";

type PageState = "loading" | "login" | "upload" | "success" | "error";

export default function AdminPage() {
  const [pageState, setPageState] = useState<PageState>("loading");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadedFile, setUploadedFile] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin-auth", { method: "GET" })
      .then((res) => res.json())
      .then((data) => {
        setPageState(data.authenticated ? "upload" : "login");
      })
      .catch(() => setPageState("login"));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const res = await fetch("/api/admin-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || "Erro ao fazer login");
      } else {
        setPageState("upload");
      }
    } catch {
      setLoginError("Erro de conexão");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.name.endsWith(".md")) {
        setUploadError("Apenas arquivos .md são aceitos");
        setFile(null);
        return;
      }
      setFile(selected);
      setUploadError("");
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploadLoading(true);
    setUploadError("");

    try {
      const content = await file.text();
      const res = await fetch("/api/admin-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, filename: file.name }),
      });

      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || "Erro ao fazer upload");
      } else {
        setUploadedFile(file.name);
        setPageState("success");
        setFile(null);
        if (fileRef.current) fileRef.current.value = "";
      }
    } catch {
      setUploadError("Erro de conexão");
    } finally {
      setUploadLoading(false);
    }
  };

  if (pageState === "loading") {
    return (
      <div className="min-h-screen bg-[#131819] flex items-center justify-center p-6">
        <div className="text-gray-400 text-sm">Carregando...</div>
      </div>
    );
  }

  if (pageState === "login") {
    return (
      <div className="min-h-screen bg-[#131819] flex items-center justify-center p-6">
        <div className="bg-[#1c2125] rounded-2xl p-8 max-w-sm w-full shadow-sm border border-gray-800">
          <div className="flex justify-center mb-6">
            <img src="/logos/zaylo-logo.png" alt="Zaylo" className="h-8" />
          </div>
          <h2 className="text-lg font-semibold text-white text-center mb-6">
            Admin Blog
          </h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="username" className="text-xs font-medium text-gray-400">
                Usuário
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-[#131819] border border-gray-700 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-500 text-white placeholder:text-gray-600"
                placeholder="user"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="text-xs font-medium text-gray-400">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-[#131819] border border-gray-700 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gray-500 text-white placeholder:text-gray-600"
                placeholder="••••••••"
              />
            </div>
            {loginError && (
              <div className="bg-red-900/50 border border-red-800 rounded-lg px-3 py-2 text-sm text-red-400">
                {loginError}
              </div>
            )}
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-white text-gray-900 font-medium text-sm rounded-xl py-3 hover:bg-gray-200 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loginLoading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (pageState === "success") {
    return (
      <div className="min-h-screen bg-[#131819] flex items-center justify-center p-6">
        <div className="bg-[#1c2125] rounded-2xl p-8 max-w-sm w-full shadow-sm border border-gray-800">
          <div className="w-12 h-12 rounded-full bg-green-900/50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white text-center mb-1">Post enviado!</h2>
          <p className="text-sm text-gray-400 text-center mb-4">
            {uploadedFile} foi publicado com sucesso.
          </p>
          <button
            onClick={() => setPageState("upload")}
            className="w-full border border-gray-700 text-gray-300 text-sm font-medium rounded-xl py-2.5 hover:bg-gray-800 transition-colors"
          >
            Enviar outro post
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#131819] flex items-center justify-center p-6">
      <div className="bg-[#1c2125] rounded-2xl p-8 max-w-sm w-full shadow-sm border border-gray-800">
        <div className="flex justify-center mb-6">
          <img src="/logos/zaylo-logo.png" alt="Zaylo" className="h-8" />
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Faça upload do post</h2>
            <p className="text-xs text-gray-500">Arquivo em formato .md</p>
          </div>
        </div>

        <div
          className="bg-[#131819] border-2 border-dashed border-gray-700 rounded-xl p-6 mb-4 text-center cursor-pointer hover:border-gray-500 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          {file ? (
            <div>
              <p className="text-sm font-medium text-white">{file.name}</p>
              <p className="text-xs text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <div>
              <svg className="w-8 h-8 mx-auto text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm text-gray-500">Clique para selecionar um arquivo .md</p>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".md"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {uploadError && (
          <div className="bg-red-900/50 border border-red-800 rounded-lg px-3 py-2 text-sm text-red-400 mb-4">
            {uploadError}
          </div>
        )}

        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || uploadLoading}
          className="w-full bg-white text-gray-900 font-medium text-sm rounded-xl py-3 hover:bg-gray-200 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploadLoading ? "Enviando..." : "Publicar post"}
        </button>

        <p className="text-center text-xs text-gray-600 mt-3">
          O post será publicado no blog
        </p>
      </div>
    </div>
  );
}
