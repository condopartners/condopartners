/** Manifesto PWA — fonte única para plugin e testes. */
export const pwaManifest = {
  name: "CondoPartners",
  short_name: "CondoPartners",
  description: "Rede de partners e comissões B2B",
  theme_color: "#0B1F33",
  background_color: "#0B1F33",
  display: "standalone" as const,
  start_url: "/",
  lang: "pt-BR",
  icons: [
    {
      src: "/icons/icon-192.png",
      sizes: "192x192",
      type: "image/png",
    },
    {
      src: "/icons/icon-512.png",
      sizes: "512x512",
      type: "image/png",
    },
    {
      src: "/icons/icon-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
  ],
}
