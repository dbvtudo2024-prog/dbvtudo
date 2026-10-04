import { jsPDF } from 'jspdf';

export interface CorelEmblemItem {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  ministry: 'DBV' | 'AVT';
  dimensions: string;
  colorsSpec: string;
  imageUrl: string;
  corelPortalUrl: string;
  directCdrUrl?: string;
  directSvgUrl?: string;
}

export const OFFICIAL_COREL_EMBLEMS: CorelEmblemItem[] = [
  // ================= DESBRAVADORES (DSA) =================
  {
    id: 'corel_dbv_d1',
    code: 'D1',
    title: 'Emblema Oficial D1 — Clube de Desbravadores',
    subtitle: 'Triângulo Oficial com inscrição DESBRAVADORES e CLUBE (Manga Direita e Bandeira)',
    ministry: 'DBV',
    dimensions: '7,0 × 7,5 cm (Manga Direita) • 30 × 30 cm (Bandeira Oficial)',
    colorsSpec: 'Vermelho (C:0 M:100 Y:100 K:0) • Amarelo Ouro (C:0 M:10 Y:100 K:0) • Azul (C:100 M:80 Y:0 K:0) • Branco',
    imageUrl: 'https://mda.wiki.br/site/@imgs_wiki/imagem@emblema_d1.svg',
    corelPortalUrl: 'https://downloads.adventistas.org/pt/desbravadores/logomarcas/logos-abertos-desbravadores/',
    directSvgUrl: 'https://mda.wiki.br/site/@imgs_wiki/imagem@emblema_d1.svg'
  },
  {
    id: 'corel_dbv_d2',
    code: 'D2',
    title: 'Emblema Oficial D2 — Globo Mundial Desbravadores',
    subtitle: 'Organização Mundial dos Desbravadores com Emblema D1 ao centro (Lenço e Manga Esquerda)',
    ministry: 'DBV',
    dimensions: '11,5 × 8,5 cm (Lenço Oficial) • 6,5 × 4,5 cm (Manga Esquerda)',
    colorsSpec: 'Fundo Amarelo/Caqui • Linhas de Latitude/Longitude Verde-Petróleo • Emblema D1 Central',
    imageUrl: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Emblemas/dbv_emblema_d2_0_1.png',
    corelPortalUrl: 'https://downloads.adventistas.org/pt/desbravadores/logomarcas/logos-abertos-desbravadores/'
  },
  {
    id: 'corel_dbv_d3',
    code: 'D3',
    title: 'Emblema Oficial D3 — Triângulo sem Inscrição',
    subtitle: 'Escudo e Espada sem texto (Boné, Prendedor de Lenço, Fivela de Cinto e Emblema do Campo)',
    ministry: 'DBV',
    dimensions: '5,0 × 5,0 cm (Boné) • 2,3 × 2,5 cm (Prendedor/Fivela)',
    colorsSpec: 'Vermelho Oficial • Amarelo Ouro • Azul Royal • Branco',
    imageUrl: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Emblemas/dbv_emblema_d3_0_2.png',
    corelPortalUrl: 'https://downloads.adventistas.org/pt/desbravadores/logomarcas/logos-abertos-desbravadores/'
  },
  {
    id: 'corel_dbv_d4',
    code: 'D4',
    title: 'Emblema Oficial D4 — Faixa e Uniforme de Atividades',
    subtitle: 'Globo estilizado com D3 ao centro (Ponta da Faixa de Especialidades e Camiseta)',
    ministry: 'DBV',
    dimensions: 'Ponta inferior da Faixa de Especialidades e Uniforme B do Clube/Campo',
    colorsSpec: 'Fundo Cáqui (10–15 anos) ou Branco (16+ anos) • Traços Pretos • D3 colorido',
    imageUrl: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Emblemas/dbv_emblema_d4_0_3.png',
    corelPortalUrl: 'https://downloads.adventistas.org/pt/desbravadores/logomarcas/logos-abertos-desbravadores/'
  },
  {
    id: 'corel_dbv_d5',
    code: 'D5',
    title: 'Emblema Oficial D5 — Vetor em Traço (1 Cor)',
    subtitle: 'Versão monocromática em linhas para serigrafia de 1 cor, gravação em metal/madeira e timbres',
    ministry: 'DBV',
    dimensions: 'Proporção 1:1 escalável em curvas para qualquer aplicação monocromática',
    colorsSpec: 'Preto 100% (K:100) ou Vazado Negativo sobre fundo escuro',
    imageUrl: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Emblemas/dbv_emblema_d5_0_4.png',
    corelPortalUrl: 'https://downloads.adventistas.org/pt/desbravadores/logomarcas/logos-abertos-desbravadores/'
  },
  {
    id: 'corel_dbv_l1',
    code: 'L1 (L D1)',
    title: 'Emblema Oficial L1 — Líder de Desbravadores',
    subtitle: 'Globo com Estrela de 6 Pontas Dourada e D3 ao centro (Lenço de Líder e Manga Esquerda)',
    ministry: 'DBV',
    dimensions: '10,5 × 10,5 cm (Lenço de Líder) • 6,0 × 6,0 cm (Manga Esquerda) • 2,5 cm (Prendedor)',
    colorsSpec: 'Borda Dourada • Estrela de 6 Pontas Ouro • Globo Azul Claro • Emblema D3 Central',
    imageUrl: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Emblemas/dbv_emblema_l_d1_0_5.png',
    corelPortalUrl: 'https://downloads.adventistas.org/pt/desbravadores/logomarcas/logos-abertos-desbravadores/'
  },
  {
    id: 'corel_dbv_l2',
    code: 'L2 (L D2)',
    title: 'Emblema Oficial L2 — Líder Master (LM)',
    subtitle: 'Octógono com as 6 cores das Classes Regulares envolvendo o Globo e D3',
    ministry: 'DBV',
    dimensions: '7,0 × 7,0 cm (Manga Esquerda — substitui L1 após investidura em Líder Master)',
    colorsSpec: 'Azul, Vermelho, Verde, Preto, Vinho e Amarelo (Classes) + Ouro',
    imageUrl: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Emblemas/dbv_emblema_l_d2_0_6.png',
    corelPortalUrl: 'https://downloads.adventistas.org/pt/desbravadores/logomarcas/logos-abertos-desbravadores/'
  },
  {
    id: 'corel_dbv_l3',
    code: 'L3 (L D3)',
    title: 'Emblema Oficial L3 — Líder Master Avançado (LMA)',
    subtitle: 'Insígnia superior do Clube de Líderes Desbravadores (Manga Esquerda e Distintivo)',
    ministry: 'DBV',
    dimensions: '7,0 × 7,5 cm (Manga Esquerda — substitui L2 após investidura em LMA)',
    colorsSpec: 'Dourado Metálico • Azul Royal • Vermelho • Branco',
    imageUrl: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Emblemas/dbv_emblema_l_d3_0_7.png',
    corelPortalUrl: 'https://downloads.adventistas.org/pt/desbravadores/logomarcas/logos-abertos-desbravadores/'
  },

  // ================= AVENTUREIROS (DSA) =================
  {
    id: 'corel_avt_a1',
    code: 'A1',
    title: 'Emblema Oficial A1 — Clube de Aventureiros',
    subtitle: 'Círculo Oficial com inscrição CLUBE DE AVENTUREIROS e os 4 símbolos das Classes (Manga Direita e Bandeira)',
    ministry: 'AVT',
    dimensions: '7,0 × 6,5 cm (Manga Direita) • 29 × 27 cm (Bandeira Oficial)',
    colorsSpec: 'Azul Marinho • Borda Vinho/Cereja • Fundo Branco • Estrela das 4 Classes ao centro',
    imageUrl: 'https://mda.wiki.br/site/@imgs_wiki/imagem@emblema_a1.svg',
    corelPortalUrl: 'https://downloads.adventistas.org/pt/aventureiros/logomarcas/logos-aberto-aventureiros/',
    directCdrUrl: 'https://wp.logos-download.com/wp-content/uploads/2022/01/Clube_de_Aventureiros_Logo.cdr?dl',
    directSvgUrl: 'https://mda.wiki.br/site/@imgs_wiki/imagem@emblema_a1.svg'
  },
  {
    id: 'corel_avt_a2',
    code: 'A2',
    title: 'Emblema Oficial A2 — Globo Mundial dos Aventureiros',
    subtitle: 'Organização Mundial dos Aventureiros com A1 ao centro (Lenço e Manga Esquerda)',
    ministry: 'AVT',
    dimensions: '10,5 × 7,5 cm (Lenço Aventureiro) • 6,5 × 4,5 cm (Manga Esquerda)',
    colorsSpec: 'Globo Oval com Borda Vinho/Cereja • Traços Dourados • Emblema A1 Central',
    imageUrl: 'https://mda.wiki.br/site/@imgs_wiki/imagem@emblema_a2.png',
    corelPortalUrl: 'https://downloads.adventistas.org/pt/aventureiros/logomarcas/logos-aberto-aventureiros/'
  },
  {
    id: 'corel_avt_a3',
    code: 'A3',
    title: 'Emblema Oficial A3 — Símbolo sem Inscrição',
    subtitle: 'Círculo com as 4 Classes sem texto (Boné, Prendedor de Lenço, Fivela de Cinto e Emblema do Campo)',
    ministry: 'AVT',
    dimensions: '5,0 cm (Boné Oficial) • 2,5 cm (Prendedor de Lenço e Fivela)',
    colorsSpec: 'Borda Vinho/Cereja • Fundo Branco • Símbolos das 4 Classes Coloridos',
    imageUrl: 'https://mda.wiki.br/site/@imgs_wiki/imagem@emblema_a3.jpeg',
    corelPortalUrl: 'https://downloads.adventistas.org/pt/aventureiros/logomarcas/logos-aberto-aventureiros/'
  },
  {
    id: 'corel_avt_a4',
    code: 'A4',
    title: 'Emblema Oficial A4 — Faixa e Uniforme de Atividades',
    subtitle: 'Globo ovalado com A3 ao centro (Ponta da Faixa de Especialidades e Camiseta)',
    ministry: 'AVT',
    dimensions: 'Ponta inferior da Faixa de Especialidades e Uniforme B de Aventureiros',
    colorsSpec: 'Borda Vinho • Fundo Branco • Emblema A3 Central',
    imageUrl: 'https://mda.wiki.br/site/@imgs_wiki/imagem@emblema_a4.jpeg',
    corelPortalUrl: 'https://downloads.adventistas.org/pt/aventureiros/logomarcas/logos-aberto-aventureiros/'
  },
  {
    id: 'corel_avt_a5',
    code: 'A5',
    title: 'Emblema Oficial A5 — Vetor em Traço (1 Cor)',
    subtitle: 'Versão monocromática do Emblema A1 para serigrafia de 1 cor, gravação e timbres',
    ministry: 'AVT',
    dimensions: 'Proporção 1:1 escalável em curvas para qualquer aplicação monocromática',
    colorsSpec: 'Preto 100% (K:100) ou Vinho 100% ou Vazado Negativo',
    imageUrl: 'https://mda.wiki.br/site/@imgs_wiki/imagem@emblema_a5.jpeg',
    corelPortalUrl: 'https://downloads.adventistas.org/pt/aventureiros/logomarcas/logos-aberto-aventureiros/'
  },
  {
    id: 'corel_avt_la1',
    code: 'L A1',
    title: 'Emblema Oficial L A1 — Líder de Aventureiros',
    subtitle: 'Losango Oficial com as 4 cores das Classes e Globo Aventureiro ao centro (Lenço de Líder e Manga)',
    ministry: 'AVT',
    dimensions: '10,0 × 7,0 cm (Lenço de Líder) • 7,0 × 5,0 cm (Manga Esquerda)',
    colorsSpec: 'Azul Celeste, Laranja, Azul Marinho e Vinho + Borda Ouro',
    imageUrl: 'https://mda.wiki.br/site/@imgs_wiki/imagem@emblema_l_a1.png',
    corelPortalUrl: 'https://downloads.adventistas.org/pt/aventureiros/logomarcas/logos-aberto-aventureiros/'
  }
];

/**
 * Gera e baixa uma folha técnica vetorial .SVG compatível com CorelDRAW (Importar Ctrl+I ou Abrir direto)
 * contendo o emblema oficial, linhas-guia de corte/bordado e especificações CMYK/RUD da DSA.
 */
export async function downloadEmblemForCorelDraw(emblem: CorelEmblemItem): Promise<void> {
  // Se o emblema tiver arquivo .CDR direto (ex: A1) e o usuário quiser abrir direto, ou geramos o vetor .SVG estruturado para CorelDRAW
  try {
    let embeddedDataUrl = emblem.imageUrl;
    try {
      const resp = await fetch(emblem.imageUrl);
      if (resp.ok) {
        const contentType = resp.headers.get('content-type') || '';
        if (contentType.includes('svg') || emblem.imageUrl.endsWith('.svg')) {
          const svgText = await resp.text();
          // Faz download direto do SVG oficial em curvas da DSA/MDA Wiki
          const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Emblema_Oficial_${emblem.code.replace(/\s+/g, '_')}_CorelDRAW_DSA.svg`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          return;
        } else {
          const blob = await resp.blob();
          embeddedDataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        }
      }
    } catch {
      // Usa a URL pública caso CORS bloqueie leitura binária
    }

    const escapeXml = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const svgSheet = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!-- Arquivo Vetorial Estruturado para CorelDRAW (X7 / 2019 / 2021 / 2023 / 2024) - Padrão Oficial RUD / DSA -->
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1000 1000" width="100mm" height="100mm">
  <title>${escapeXml(emblem.title)} - Gabarito CorelDRAW DSA</title>
  <desc>Especificacoes Oficiais RUD DSA: ${escapeXml(emblem.dimensions)} | Cores: ${escapeXml(emblem.colorsSpec)}</desc>
  <g id="Camada_Guias_CorelDRAW">
    <rect x="20" y="20" width="960" height="960" rx="24" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2" stroke-dasharray="10,6"/>
    <text x="500" y="65" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="22" fill="#0F172A">
      ${escapeXml(emblem.title.toUpperCase())}
    </text>
    <text x="500" y="95" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="15" fill="#475569">
      Medidas Oficiais RUD/DSA: ${escapeXml(emblem.dimensions)}
    </text>
  </g>
  <g id="Camada_Emblema_Oficial">
    <image x="150" y="130" width="700" height="700" preserveAspectRatio="xMidYMid meet" href="${embeddedDataUrl}" xlink:href="${embeddedDataUrl}" />
  </g>
  <g id="Camada_Especificacoes_CMYK">
    <rect x="60" y="860" width="880" height="90" rx="12" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5"/>
    <text x="500" y="895" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="14" fill="#1E293B">
      PADRÃO DE CORES OFICIAL (RUD / DSA): ${escapeXml(emblem.colorsSpec)}
    </text>
    <text x="500" y="925" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="13" fill="#64748B">
      Importe no CorelDRAW (Ctrl + I) ou abra diretamente para vetorização, bordado, serigrafia ou impressão gráfica.
    </text>
  </g>
</svg>`;

    const blob = new Blob([svgSheet], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Emblema_Oficial_${emblem.code.replace(/\s+/g, '_')}_CorelDRAW_DSA.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Erro ao baixar emblema para CorelDRAW:', err);
  }
}

export interface CustomCertificateConfig {
  ministry: 'DBV' | 'AVT';
  clubName: string;
  associationName: string;
  certificateTitle: string;
  achievementName: string;
  recipientName: string;
  locationAndDate: string;
  directorName: string;
  regionalName: string;
  pastorName: string;
}

/**
 * Desenha o Certificado Oficial Personalizado em um Canvas A4 Paisagem de Alta Resolução (2480 x 1754 px)
 * com o Nome do Clube, Associação/Missão e dados escolhidos pelo usuário.
 */
export async function renderCertificateToCanvas(config: CustomCertificateConfig): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = 2480;
  canvas.height = 1754;
  const ctx = canvas.getContext('2d')!;

  const isDbv = config.ministry === 'DBV';
  const primaryColor = isDbv ? '#b91c1c' : '#800000'; // Vermelho DBV ou Vinho AVT
  const secondaryColor = isDbv ? '#1e3a8a' : '#1e293b'; // Azul Marinho
  const goldColor = '#d97706';
  const goldLight = '#fef3c7';

  // 1. Fundo Pergaminho Clássico / Branco Marfim
  const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bgGrad.addColorStop(0, '#fffdf9');
  bgGrad.addColorStop(0.5, '#ffffff');
  bgGrad.addColorStop(1, '#fef9ee');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Moldura Externa Oficial (Borda Dupla + Cantoneiras)
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 22;
  ctx.strokeRect(56, 56, canvas.width - 112, canvas.height - 112);

  ctx.strokeStyle = goldColor;
  ctx.lineWidth = 6;
  ctx.strokeRect(86, 86, canvas.width - 172, canvas.height - 172);

  ctx.strokeStyle = secondaryColor;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(102, 102, canvas.width - 204, canvas.height - 204);

  // Cantoneiras decorativas nos 4 cantos
  const corners = [
    [56, 56, 1, 1],
    [canvas.width - 56, 56, -1, 1],
    [56, canvas.height - 56, 1, -1],
    [canvas.width - 56, canvas.height - 56, -1, -1]
  ];
  corners.forEach(([cx, cy, dx, dy]) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(dx, dy);
    ctx.fillStyle = goldColor;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(110, 0);
    ctx.lineTo(0, 110);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });

  // 3. Marca d'água sutil ao centro
  ctx.save();
  ctx.globalAlpha = 0.04;
  ctx.fillStyle = primaryColor;
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2 + 40, 420, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 4. Carregar Emblema Oficial (D1 ou A1) se possível
  const emblemUrl = isDbv
    ? 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Desbravadores.png'
    : 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Aventureiros/Av_Emblema_A1.png';

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = emblemUrl;
    });
    const targetH = 210;
    const targetW = (img.width / img.height) * targetH || 210;
    ctx.drawImage(img, canvas.width / 2 - targetW / 2, 135, targetW, targetH);
  } catch {
    // Escudo vetorial de fallback caso imagem externa não carregue com CORS
    ctx.save();
    ctx.fillStyle = primaryColor;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 140);
    ctx.lineTo(canvas.width / 2 + 95, 190);
    ctx.lineTo(canvas.width / 2, 330);
    ctx.lineTo(canvas.width / 2 - 95, 190);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = goldColor;
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isDbv ? 'DBV' : 'AVT', canvas.width / 2, 245);
    ctx.restore();
  }

  // 5. Cabeçalho Institucional (IASD / DSA + Associação/Missão + Nome do Clube)
  ctx.textAlign = 'center';
  ctx.fillStyle = '#475569';
  ctx.font = 'bold 28px Arial, Helvetica, sans-serif';
  ctx.fillText(
    'IGREJA ADVENTISTA DO SÉTIMO DIA • DIVISÃO SUL-AMERICANA',
    canvas.width / 2,
    395
  );

  // Associação / Missão personalizada
  const assocText = (
    config.associationName.trim() ||
    'ASSOCIAÇÃO / MISSÃO DA IGREJA ADVENTISTA DO SÉTIMO DIA'
  ).toUpperCase();
  ctx.fillStyle = secondaryColor;
  ctx.font = 'bold 36px Arial, Helvetica, sans-serif';
  ctx.fillText(assocText, canvas.width / 2, 448);

  // Faixa de destaque com o Nome do Clube personalizado
  const clubText = (
    config.clubName.trim() ||
    (isDbv ? 'CLUBE DE DESBRAVADORES' : 'CLUBE DE AVENTUREIROS')
  ).toUpperCase();
  ctx.font = 'bold 46px Arial, Helvetica, sans-serif';
  const clubMetrics = ctx.measureText(clubText);
  const pillW = Math.min(canvas.width - 360, Math.max(820, clubMetrics.width + 140));
  const pillX = canvas.width / 2 - pillW / 2;
  const pillY = 476;
  const pillH = 78;

  ctx.fillStyle = goldLight;
  ctx.strokeStyle = goldColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, 39);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = primaryColor;
  ctx.fillText(clubText, canvas.width / 2, pillY + 54);

  // 6. Título Principal do Certificado
  const certTitle = (
    config.certificateTitle.trim() || 'CERTIFICADO OFICIAL DE INVESTIDURA'
  ).toUpperCase();
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 68px Georgia, "Times New Roman", serif';
  ctx.fillText(certTitle, canvas.width / 2, 650);

  // Linha divisória dourada
  ctx.strokeStyle = goldColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2 - 420, 682);
  ctx.lineTo(canvas.width / 2 + 420, 682);
  ctx.stroke();

  // 7. Corpo do Certificado e Nome do Membro
  ctx.fillStyle = '#334155';
  ctx.font = 'italic 36px Georgia, "Times New Roman", serif';
  ctx.fillText(
    'Certificamos para os devidos fins de registro e mérito que',
    canvas.width / 2,
    760
  );

  const recipient = config.recipientName.trim();
  if (recipient) {
    ctx.fillStyle = primaryColor;
    ctx.font = 'bold 64px Georgia, "Times New Roman", serif';
    ctx.fillText(recipient.toUpperCase(), canvas.width / 2, 855);
  } else {
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 42px Arial, sans-serif';
    ctx.fillText('__________________________________________________________________', canvas.width / 2, 855);
  }

  // Linha sob o nome
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2 - 680, 875);
  ctx.lineTo(canvas.width / 2 + 680, 875);
  ctx.stroke();

  ctx.fillStyle = '#334155';
  ctx.font = '34px Arial, Helvetica, sans-serif';
  ctx.fillText(
    `cumpriu fielmente todos os requisitos oficiais estabelecidos pelo Ministério de ${
      isDbv ? 'Desbravadores' : 'Aventureiros'
    } da DSA para:`,
    canvas.width / 2,
    950
  );

  // Conquista / Classe / Especialidade em destaque
  const achievement = (
    config.achievementName.trim() ||
    (isDbv ? 'CLASSE / ESPECIALIDADE OFICIAL DSA' : 'CLASSE / ESPECIALIDADE AVENTUREIROS DSA')
  ).toUpperCase();
  ctx.fillStyle = secondaryColor;
  ctx.font = 'bold 54px Arial, Helvetica, sans-serif';
  ctx.fillText(achievement, canvas.width / 2, 1035);

  ctx.fillStyle = '#475569';
  ctx.font = 'italic 30px Georgia, "Times New Roman", serif';
  ctx.fillText(
    isDbv
      ? '"O amor de Cristo me motiva" — Preparando juvenis e jovens para o reino de Deus e o serviço ao próximo.'
      : '"Por amor a Jesus farei sempre o meu melhor" — Crescendo em sabedoria, estatura e graça diante de Deus.',
    canvas.width / 2,
    1115
  );

  // 8. Local e Data
  const locDate =
    config.locationAndDate.trim() ||
    `Emitido em ${new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })}`;
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 32px Arial, Helvetica, sans-serif';
  ctx.fillText(locDate, canvas.width / 2, 1215);

  // 9. Três Linhas de Assinatura Oficial (Diretor do Clube, Regional/Distrital, Pastor/Departamental)
  const sigY = 1450;
  const sigPositions = [
    {
      x: 540,
      name: config.directorName.trim() || 'Diretor(a) do Clube',
      role: config.clubName.trim() ? `Diretor(a) — ${config.clubName.trim()}` : 'Diretor(a) do Clube'
    },
    {
      x: canvas.width / 2,
      name: config.regionalName.trim() || 'Coordenador(a) / Regional',
      role: config.associationName.trim()
        ? `Regional — ${config.associationName.trim()}`
        : 'Regional / Coordenador(a) de Área'
    },
    {
      x: canvas.width - 540,
      name: config.pastorName.trim() || 'Pastor / Departamental MDA',
      role: 'Ministério de Desbravadores e Aventureiros'
    }
  ];

  sigPositions.forEach((sig) => {
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(sig.x - 280, sigY);
    ctx.lineTo(sig.x + 280, sigY);
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 28px Arial, Helvetica, sans-serif';
    ctx.fillText(sig.name, sig.x, sigY + 42);

    ctx.fillStyle = '#64748b';
    ctx.font = '22px Arial, Helvetica, sans-serif';
    ctx.fillText(sig.role, sig.x, sigY + 76);
  });

  // 10. Selo Oficial no Rodapé
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 20px Arial, Helvetica, sans-serif';
  ctx.fillText(
    'MODELO OFICIAL PERSONALIZADO • MINISTÉRIO DE DESBRAVADORES E AVENTUREIROS (DSA / IASD)',
    canvas.width / 2,
    1635
  );

  return canvas;
}

export async function downloadCustomizedCertificatePdf(config: CustomCertificateConfig): Promise<void> {
  const canvas = await renderCertificateToCanvas(config);
  const imgData = canvas.toDataURL('image/jpeg', 0.96);
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });
  pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210);
  const safeClub = (config.clubName.trim() || 'Clube').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeAch = (config.achievementName.trim() || 'Certificado').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
  pdf.save(`Certificado_${safeAch}_${safeClub}.pdf`);
}

export async function downloadCustomizedCertificatePng(config: CustomCertificateConfig): Promise<void> {
  const canvas = await renderCertificateToCanvas(config);
  const dataUrl = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  const safeClub = (config.clubName.trim() || 'Clube').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeAch = (config.achievementName.trim() || 'Certificado').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
  a.href = dataUrl;
  a.download = `Certificado_${safeAch}_${safeClub}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
