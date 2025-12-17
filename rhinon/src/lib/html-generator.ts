import { EmailElement, EmailTemplate } from '@/types/email-builder';

const generateElementHtml = (element: EmailElement): string => {
  const style = element.props.style || {};
  const styleString = Object.entries(style)
    .map(([key, value]) => {
      const kebabKey = key.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
      return `${kebabKey}: ${value}`;
    })
    .join('; ');

  switch (element.type) {
    case 'text':
      return `<div style="${styleString}">${element.props.content || ''}</div>`;

    case 'image':
      const imgStyle = { ...style };
      if (element.props.style?.width) {
        imgStyle.width = element.props.style.width;
      }
      const imgStyleString = Object.entries(imgStyle)
        .map(([key, value]) => {
          const kebabKey = key.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
          return `${kebabKey}: ${value}`;
        })
        .join('; ');
      return `<img src="${element.props.src || ''}" alt="${element.props.alt || ''}" style="display: block; max-width: 100%; ${imgStyleString}" />`;

    case 'button':
      return `
        <div style="text-align: ${style.textAlign || 'center'}; padding: 10px;">
          <a href="${element.props.url || '#'}" style="display: inline-block; background-color: ${style.backgroundColor || '#000000'}; color: ${style.color || '#ffffff'}; padding: ${style.padding || '10px 20px'}; border-radius: ${style.borderRadius || '4px'}; text-decoration: none; font-weight: ${style.fontWeight || 'bold'}; font-size: ${style.fontSize || '16px'};">${element.props.text || 'Click Me'}</a>
        </div>
      `;

    case 'divider':
      return `
        <div style="padding: 10px 0;">
          <hr style="border-top: 1px solid ${style.color || '#cccccc'}; margin: 0; ${styleString}" />
        </div>
      `;

    case 'spacer':
      return `<div style="height: ${style.height || '20px'}; background-color: ${style.backgroundColor || 'transparent'};"></div>`;

    case 'html':
      return element.props.content || '';

    case 'column':
      return `
        <td class="column" style="vertical-align: top; padding: ${style.padding || '10px'}; width: ${style.width || 'auto'};">
          ${element.children?.map(generateElementHtml).join('') || ''}
        </td>
      `;

    default:
      if (element.type.startsWith('layout-')) {
        // Layouts are rendered as tables for better email compatibility
        return `
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse;">
            <tr>
              ${element.children?.map(generateElementHtml).join('') || ''}
            </tr>
          </table>
        `;
      }
      return '';
  }
};

export const generateHtml = (template: EmailTemplate): string => {
  const bodyContent = template.elements.map(generateElementHtml).join('');
  const globalStyles = template.globalStyles || {};

  const bodyBgColor = globalStyles.backgroundColor || '#f4f4f4';
  const bodyBgImage = globalStyles.backgroundImage;
  const contentBgColor = globalStyles.contentBackgroundColor || '#ffffff';
  const contentWidth = globalStyles.contentWidth || '600px';
  const fontFamily = globalStyles.fontFamily || 'Arial, sans-serif';
  const textColor = globalStyles.textColor || '#000000';
  const fontSize = globalStyles.fontSize || '14px';
  const lineHeight = globalStyles.lineHeight || '1.5';
  const paddingTop = globalStyles.paddingTop || '20px';
  const paddingBottom = globalStyles.paddingBottom || '20px';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${template.name}</title>
  <style>
    @media only screen and (max-width: 600px) {
      .content-table {
        width: 100% !important;
      }
      .column {
        display: block !important;
        width: 100% !important;
        padding-bottom: 10px !important;
      }
      img {
        max-width: 100% !important;
        height: auto !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${bodyBgColor}; ${bodyBgImage ? `background-image: url(${bodyBgImage}); background-size: cover; background-position: center;` : ''} font-family: ${fontFamily};">
  <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center" style="padding: ${paddingTop} 20px ${paddingBottom};">
        <table class="content-table" width="${contentWidth.replace('px', '')}" border="0" cellspacing="0" cellpadding="0" style="background-color: ${contentBgColor}; width: ${contentWidth}; max-width: 100%; font-family: ${fontFamily}; font-size: ${fontSize}; color: ${textColor}; line-height: ${lineHeight};">
          <tr>
            <td>
              ${bodyContent}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};
