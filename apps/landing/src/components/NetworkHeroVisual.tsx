import lobbyFacade from "../assets/lobby-facade.jpg"

/** Synthetic product demo: partner tree + commission strip (labeled). */
export function NetworkHeroVisual() {
  return (
    <div className="relative isolate min-h-[min(70vh,36rem)] w-full overflow-hidden lg:min-h-screen">
      <img
        src={lobbyFacade}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        width={1920}
        height={1080}
        decoding="async"
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-[color-mix(in_oklab,var(--color-ink)_78%,transparent)] via-[color-mix(in_oklab,var(--color-ink)_55%,transparent)] to-[color-mix(in_oklab,var(--color-sky)_25%,transparent)]"
        aria-hidden
      />
      <div className="relative z-10 flex h-full flex-col justify-end gap-6 p-6 sm:p-10 lg:justify-center lg:p-14">
        <p className="text-xs tracking-[0.14em] text-white/70 uppercase">
          Demonstração ilustrativa — dados sintéticos
        </p>
        <svg
          viewBox="0 0 520 280"
          role="img"
          aria-label="Rede hierárquica de parceiros com resumo de comissão por indicação"
          className="w-full max-w-xl drop-shadow-lg"
        >
          <title>Rede de parceiros e comissão</title>
          <line
            data-animate="network-edge"
            x1="120"
            y1="70"
            x2="260"
            y2="150"
            stroke="#A8BCC8"
            strokeWidth="2"
            opacity="0.85"
          />
          <line
            data-animate="network-edge"
            x1="120"
            y1="70"
            x2="400"
            y2="150"
            stroke="#A8BCC8"
            strokeWidth="2"
            opacity="0.85"
          />
          <line
            data-animate="network-edge"
            x1="260"
            y1="150"
            x2="200"
            y2="230"
            stroke="#A8BCC8"
            strokeWidth="2"
            opacity="0.75"
          />
          <line
            data-animate="network-edge"
            x1="260"
            y1="150"
            x2="320"
            y2="230"
            stroke="#A8BCC8"
            strokeWidth="2"
            opacity="0.75"
          />

          <g data-animate="network-node">
            <rect x="40" y="40" width="160" height="56" rx="6" fill="#EEF1F3" />
            <text x="56" y="64" fill="#102028" fontSize="14" fontFamily="Albert Sans, sans-serif">
              Tenant · Matriz
            </text>
            <text x="56" y="82" fill="#1F6B4F" fontSize="12" fontFamily="Albert Sans, sans-serif">
              Operação canal
            </text>
          </g>
          <g data-animate="network-node">
            <rect x="180" y="122" width="160" height="56" rx="6" fill="#EEF1F3" />
            <text x="196" y="146" fill="#102028" fontSize="14" fontFamily="Albert Sans, sans-serif">
              Parceiro regional
            </text>
            <text x="196" y="164" fill="#9A7340" fontSize="12" fontFamily="Albert Sans, sans-serif">
              Indicação com dono
            </text>
          </g>
          <g data-animate="network-node">
            <rect x="340" y="122" width="150" height="56" rx="6" fill="#EEF1F3" />
            <text x="356" y="146" fill="#102028" fontSize="14" fontFamily="Albert Sans, sans-serif">
              Parceiro local
            </text>
            <text x="356" y="164" fill="#102028" fontSize="12" opacity="0.7">
              Subparceiro
            </text>
          </g>
          <g data-animate="network-node">
            <rect x="120" y="208" width="140" height="48" rx="6" fill="#D7DEE4" />
            <text x="136" y="238" fill="#102028" fontSize="13">
              Subparceiro A
            </text>
          </g>
          <g data-animate="network-node">
            <rect x="280" y="208" width="140" height="48" rx="6" fill="#D7DEE4" />
            <text x="296" y="238" fill="#102028" fontSize="13">
              Subparceiro B
            </text>
          </g>
        </svg>

        <aside
          data-animate="commission-strip"
          className="max-w-md border border-white/20 bg-[color-mix(in_oklab,var(--color-ink)_72%,transparent)] px-4 py-3 text-sm text-white backdrop-blur-[2px]"
        >
          <p className="text-xs tracking-wide text-white/65 uppercase">Comissão por indicação</p>
          <p className="mt-1 font-display text-lg text-[var(--color-brass)]">
            R$ 1.240 · markup + %
          </p>
          <p className="mt-1 text-white/80">Atribuição: Parceiro regional → cliente confirmado</p>
        </aside>
      </div>
    </div>
  )
}
