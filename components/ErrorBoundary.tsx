import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, LogOut, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary detectou um erro não tratado:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('dbv_tudo_app_state');
      localStorage.removeItem('dbv_tudo_global_user_profile');
      window.location.reload();
    } catch (e) {
      window.location.reload();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || '';
      const isQuotaExceeded = 
        errorMessage.toLowerCase().includes('quota') || 
        errorMessage.toLowerCase().includes('egress') || 
        errorMessage.toLowerCase().includes('restricted') ||
        errorMessage.toLowerCase().includes('limit');

      return (
        <div className="min-h-screen w-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 md:p-8 font-sans overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-[32px] p-6 sm:p-10 shadow-2xl text-slate-200 animate-slide-up my-4">
            <div className="flex flex-col items-center text-center">
              {/* Ícone de Alerta */}
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-6 border border-red-500/20">
                <AlertTriangle size={40} className="animate-pulse" />
              </div>

              {/* Título */}
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tighter uppercase mb-3">
                Ops! Algo deu errado
              </h1>
              
              {/* Descrição Amigável */}
              <p className="text-slate-400 text-sm sm:text-base mb-8 max-w-md">
                {isQuotaExceeded ? (
                  <span className="block text-red-400 font-bold">
                    O servidor de banco de dados do Supabase atingiu o limite mensal de tráfego gratuito (exceed_egress_quota) deste aplicativo.
                  </span>
                ) : (
                  "Infelizmente, ocorreu um erro inesperado no aplicativo. Isso pode ser causado por instabilidade na rede ou no banco de dados."
                )}
              </p>

              {/* Explicação Detalhada de Cota */}
              {isQuotaExceeded && (
                <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-5 mb-8 text-left text-xs space-y-3">
                  <p className="font-semibold text-red-300">
                    O que isso significa?
                  </p>
                  <p className="text-slate-400 leading-relaxed">
                    O projeto Supabase que fornece os dados (Especialidades, Classes, Bíblia, etc.) esgotou a sua cota mensal gratuita de transferência de dados (egress quota). O acesso aos dados está temporariamente restrito pelo provedor de hospedagem.
                  </p>
                  <p className="text-slate-400 leading-relaxed">
                    <strong>Como resolver:</strong> O administrador/proprietário do projeto Supabase deve fazer o upgrade da conta ou remover os limites de gastos no painel de controle do Supabase para restabelecer os serviços.
                  </p>
                </div>
              )}

              {/* Ações de Recuperação */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mb-8">
                <button
                  onClick={this.handleReload}
                  className="flex items-center justify-center space-x-2 py-4 px-6 bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all text-white font-black text-xs uppercase tracking-wider rounded-2xl border border-slate-700/50"
                >
                  <RefreshCw size={16} />
                  <span>Tentar Novamente</span>
                </button>
                <button
                  onClick={this.handleReset}
                  className="flex items-center justify-center space-x-2 py-4 px-6 bg-[#004d40] hover:bg-[#003d33] active:scale-95 transition-all text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-950/20"
                >
                  <LogOut size={16} />
                  <span>Limpar Dados e Sair</span>
                </button>
              </div>

              {/* Detalhes Técnicos (Accordion) */}
              <div className="w-full border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/50">
                <button
                  onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                  className="w-full flex items-center justify-between p-4 text-slate-500 hover:text-slate-400 text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  <span>Informações de Diagnóstico</span>
                  {this.state.showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {this.state.showDetails && (
                  <div className="p-4 border-t border-slate-800 text-left font-mono text-[11px] text-slate-500 overflow-x-auto space-y-2 select-text max-h-48 scrollbar-hide">
                    <p className="text-red-400 font-semibold">{this.state.error?.toString()}</p>
                    {this.state.errorInfo && (
                      <pre className="whitespace-pre-wrap leading-relaxed">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
