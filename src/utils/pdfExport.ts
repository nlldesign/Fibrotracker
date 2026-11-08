import html2pdf from 'html2pdf.js';

export function getFibroPdfFilename(customSuffix?: string): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  if (customSuffix) {
    return `fibrocare_${customSuffix}.pdf`;
  }
  return `fibrocare_${dd}-${mm}-${yyyy}.pdf`;
}

export async function downloadClinicalPdfDirect(customSuffix?: string): Promise<boolean> {
  const sourceEl = document.getElementById('clinical-sheet-content');
  if (!sourceEl) return false;

  const filename = getFibroPdfFilename(customSuffix);
  const wasDark = document.documentElement.classList.contains('dark');

  // Create a dedicated A4 light-mode container so mobile & dark mode users always get a crisp 1-page A4 white clinical sheet
  const wrapper = document.createElement('div');
  wrapper.style.position = 'fixed';
  wrapper.style.top = '-9999px';
  wrapper.style.left = '0';
  wrapper.style.width = '780px';
  wrapper.style.backgroundColor = '#ffffff';
  wrapper.style.color = '#18181b';
  wrapper.style.padding = '16px';
  wrapper.style.zIndex = '-10';

  const clone = sourceEl.cloneNode(true) as HTMLElement;
  clone.style.width = '100%';
  clone.style.backgroundColor = '#ffffff';
  clone.style.color = '#18181b';
  clone.style.padding = '16px';
  clone.style.margin = '0';
  clone.style.border = '1px solid #ffe4ec';
  clone.style.borderRadius = '16px';
  clone.style.boxShadow = 'none';

  // Remove interactive / print:hidden elements from PDF clone
  const hiddenNodes = clone.querySelectorAll('.print\\:hidden, [data-pdf-hide="true"]');
  hiddenNodes.forEach((n) => n.remove());

  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  try {
    if (wasDark) {
      document.documentElement.classList.remove('dark');
    }

    const opt = {
      margin: [6, 6, 6, 6] as [number, number, number, number],
      filename,
      image: { type: 'jpeg' as const, quality: 0.98 },
      enableLinks: false,
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        scrollY: 0,
        scrollX: 0,
        backgroundColor: '#ffffff',
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait' as const,
      },
    };

    await html2pdf().set(opt).from(clone).save();
    return true;
  } catch (err) {
    console.error('Erro ao gerar PDF:', err);
    return false;
  } finally {
    if (wasDark) {
      document.documentElement.classList.add('dark');
    }
    if (wrapper.parentNode) {
      wrapper.parentNode.removeChild(wrapper);
    }
  }
}
