import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft } from 'lucide-react';

type Step = 'cpf' | 'password' | 'register';

type Props = {
  onComplete: () => void;
};

export default function AuthFlow({ onComplete }: Props) {
  const [step, setStep] = useState<Step>('cpf');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Simple CPF formatter
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    setCpf(v);
  };

  const handleCpfSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cpf.length < 14) return; // 11 digits + formatting
    
    setIsLoading(true);
    // Simula validação no banco de dados
    setTimeout(() => {
      setIsLoading(false);
      // Mock logica: se o CPF começar com 0, simula que não tem conta e vai para registro
      if (cpf.startsWith('000')) {
        setStep('register');
      } else {
        setStep('password');
      }
    }, 800);
  };

  const handleFinalAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onComplete();
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full bg-bg-base">
      {/* Header Minimalista */}
      <div className="px-6 pt-16 pb-8 flex items-center justify-between shrink-0">
        {step !== 'cpf' ? (
          <button 
            onClick={() => setStep('cpf')}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-bg-surface hover:bg-border-subtle transition-colors"
          >
            <ArrowLeft size={18} className="text-text-main" />
          </button>
        ) : (
          <div className="w-10 h-10 border border-border-subtle bg-bg-surface rounded-xl flex items-center justify-center p-2">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
        )}
        <span className="font-heading font-medium tracking-tight text-text-main">
          Science Club
        </span>
      </div>

      {/* Dynamic Content */}
      <div className="flex-1 flex flex-col px-6 relative">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: CPF */}
          {step === 'cpf' && (
            <motion.form
              key="cpf"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleCpfSubmit}
              className="flex flex-col h-full"
            >
              <div className="mb-10">
                <h1 className="font-heading text-3xl font-medium text-text-main mb-3 leading-tight tracking-tight">
                  Acesse ou crie<br />sua conta.
                </h1>
                <p className="text-text-muted text-sm font-sans">
                  Insira seu CPF. Se for novo, ajudaremos a criar seu perfil.
                  <span className="block mt-2 text-xs opacity-75">(Dica mockup: Comece com 000 para criar conta nova)</span>
                </p>
              </div>

              <div className="mb-4">
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={handleCpfChange}
                  className="w-full bg-transparent border-b border-border-subtle py-4 text-2xl font-mono text-text-main placeholder:text-border-subtle focus:outline-none focus:border-brand-primary transition-colors rounded-none"
                />
              </div>

              <div className="mt-auto pb-10">
                <button
                  type="submit"
                  disabled={cpf.length < 14 || isLoading}
                  className="w-full bg-white text-black font-semibold py-4 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    "Continuar"
                  )}
                </button>
              </div>
            </motion.form>
          )}

          {/* STEP 2: PASSWORD (LOGIN) */}
          {step === 'password' && (
            <motion.form
              key="password"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleFinalAuth}
              className="flex flex-col h-full"
            >
              <div className="mb-10">
                <h1 className="font-heading text-3xl font-medium text-text-main mb-3 leading-tight tracking-tight">
                  Bem-vindo<br />de volta.
                </h1>
                <p className="text-text-muted text-sm font-sans">
                  Autenticando para o CPF <span className="font-mono text-text-main">{cpf}</span>.
                </p>
              </div>

              <div className="mb-4">
                <input
                  type="password"
                  placeholder="Sua senha secreta"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  required
                  className="w-full bg-transparent border-b border-border-subtle py-4 text-lg text-text-main placeholder:text-border-subtle focus:outline-none focus:border-brand-primary transition-colors rounded-none tracking-widest"
                />
              </div>

              <button type="button" className="text-left text-xs text-text-muted hover:text-white transition-colors">
                Esqueceu a senha?
              </button>

              <div className="mt-auto pb-10">
                <button
                  type="submit"
                  disabled={password.length < 4 || isLoading}
                  className="w-full bg-brand-primary text-white font-semibold py-4 px-6 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Entrar"
                  )}
                </button>
              </div>
            </motion.form>
          )}

          {/* STEP 3: REGISTER */}
          {step === 'register' && (
            <motion.form
              key="register"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleFinalAuth}
              className="flex flex-col h-full"
            >
              <div className="mb-10">
                <h1 className="font-heading text-3xl font-medium text-text-main mb-3 leading-tight tracking-tight">
                  Complete seu<br />cadastro.
                </h1>
                <p className="text-text-muted text-sm font-sans">
                  Parece que o CPF <span className="font-mono text-text-main">{cpf}</span> é novo por aqui.
                </p>
              </div>

              <div className="flex flex-col gap-6">
                <div>
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 block">E-mail</label>
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-bg-surface border border-border-subtle rounded-xl py-3.5 px-4 text-text-main font-medium placeholder:text-text-muted/40 focus:outline-none focus:border-brand-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 block">Criar Senha</label>
                  <input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full bg-bg-surface border border-border-subtle rounded-xl py-3.5 px-4 text-text-main font-medium placeholder:text-text-muted/40 focus:outline-none focus:border-brand-primary transition-colors"
                  />
                </div>
              </div>

              <div className="mt-auto pb-10">
                <button
                  type="submit"
                  disabled={!email || password.length < 6 || isLoading}
                  className="w-full bg-white text-black font-semibold py-4 px-6 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    "Criar e Entrar"
                  )}
                </button>
              </div>
            </motion.form>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
