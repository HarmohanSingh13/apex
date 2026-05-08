/**
 * mahindra-brd.config.js
 * md-to-pdf configuration for Mahindra BRD documents.
 *
 * Usage:
 *   npx -y md-to-pdf --config .agents/assets/mahindra-brd.config.js \
 *                    --stylesheet .agents/assets/mahindra-brd.css \
 *                    <path/to/doc.md>
 *
 * Running header: vertical red accent bar (left) + "mahindra" wordmark + Mahindra Rise logo (right)
 * Running footer: right-aligned page n / total
 */

// Mahindra Rise logo — extracted from corporate DOCX header (image38.png)
const LOGO_B64 =
  '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';

module.exports = {
  launch_options: {
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  },
  pdf_options: {
    format: 'A4',
    displayHeaderFooter: true,
    margin: {
      top: '28mm',
      bottom: '20mm',
      left: '14mm',
      right: '14mm'
    },

    // Running page header: vertical red accent bar | "mahindra" wordmark | Mahindra Rise logo
    headerTemplate: `
      <div style="
        width: 100%;
        box-sizing: border-box;
        padding: 6px 50px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 2px solid #E31933;
        font-size: 0;
      ">
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="width:3px;height:20px;background:#E31933;flex-shrink:0;"></div>
          <span style="
            font-family: Arial, Helvetica, sans-serif;
            font-size: 9px;
            font-weight: 700;
            color: #0f2d48;
            letter-spacing: 0.5px;
            text-transform: lowercase;
          ">mahindra</span>
        </div>
        <img
          src="data:image/png;base64,${LOGO_B64}"
          style="height:16px;width:auto;display:block;"
        />
      </div>
    `,

    // Running page footer: right-aligned page number
    footerTemplate: `
      <div style="
        width: 100%;
        box-sizing: border-box;
        padding: 4px 50px;
        display: flex;
        justify-content: flex-end;
        align-items: center;
        border-top: 1px solid #d8dde6;
        font-size: 8px;
        color: #4b5563;
        font-family: Calibri, Arial, Helvetica, sans-serif;
      ">
        <span><span class="pageNumber"></span>&nbsp;/&nbsp;<span class="totalPages"></span></span>
      </div>
    `
  }
};
