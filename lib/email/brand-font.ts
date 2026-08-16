/**
 * SitGuru brand typeface for all email / correspondence HTML.
 * Site UI already uses Plus Jakarta Sans via next/font — keep emails aligned.
 *
 * Email clients that block web fonts fall back to Arial/Helvetica.
 */

/** Inline CSS font-family value for email HTML. */
export const SITGURU_EMAIL_FONT_FAMILY =
  "'Plus Jakarta Sans', Arial, Helvetica, sans-serif";

/** Google Fonts stylesheet URL (weights used across SitGuru emails). */
export const SITGURU_EMAIL_FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";

/** Drop in email <head> so supporting clients load Plus Jakarta Sans. */
export const SITGURU_EMAIL_FONT_HEAD = `
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="${SITGURU_EMAIL_FONT_HREF}" rel="stylesheet" />
  <style type="text/css">
    @import url('${SITGURU_EMAIL_FONT_HREF}');
    body, table, td, th, p, a, li, span, div, h1, h2, h3, h4, h5, h6 {
      font-family: ${SITGURU_EMAIL_FONT_FAMILY} !important;
    }
  </style>
`.trim();

/** Shorthand style attribute fragment: font-family:... */
export const SITGURU_EMAIL_FONT_STYLE = `font-family:${SITGURU_EMAIL_FONT_FAMILY}`;
