// src/modules/links/links.controller.ts
import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
// If you want to pull real campaign data:
// import { CampaignsService } from '../campaigns/campaigns.service';

const APP_SCHEME = 'kafelapp';
const WEB_ORIGIN = 'https://cory-noncollinear-groundably.ngrok-free.dev';
// const WEB_ORIGIN = 'https://kafel.xyz';

// TODO: put your real store URLs
const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.kafel.app';
const APP_STORE_URL = 'https://apps.apple.com/app/id0000000000';

@Controller()
export class LinksController {
  // constructor(private readonly campaigns: CampaignsService) {}

  @Get('campaign/:id')
  async campaignDeepLink(@Param('id') id: string, @Res() res: Response) {
    // Optional: fetch real campaign for nicer OG tags
    // const data = await this.campaigns.findOnePublic(+id).catch(() => null);

    const title = /* data?.title ?? */ `Kafel Campaign #${id}`;
    const description =
      /* data?.description ?? */ 'Help support this Kafel campaign.';
    const imageUrl =
      /* data?.image && `${WEB_ORIGIN}${data.image}` ?? */ `${WEB_ORIGIN}/public/images/default-og.png`;

    const schemeUrl = `${APP_SCHEME}://campaign/${id}`;
    const canonicalUrl = `${WEB_ORIGIN}/campaign/${id}`;

    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, nofollow" />
  <link rel="canonical" href="${canonicalUrl}" />

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:url" content="${canonicalUrl}" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${imageUrl}" />

  <style>
    html,body{margin:0;padding:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial}
    .wrap{display:flex;min-height:100vh;align-items:center;justify-content:center;background:#f7f7f7}
    .card{background:#fff;padding:24px;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.08);max-width:640px;width:90%}
    .btn{display:inline-block;margin:8px 8px 0 0;padding:12px 16px;border-radius:8px;text-decoration:none;color:#fff}
    .primary{background:#74BB29}
    .secondary{background:#0a84ff}
    .muted{color:#666;margin-top:12px;font-size:14px}
  </style>

  <script>
    (function () {
      // Try to open the app immediately
      var scheme = ${JSON.stringify(schemeUrl)};
      var iosStore = ${JSON.stringify(APP_STORE_URL)};
      var androidStore = ${JSON.stringify(PLAY_STORE_URL)};

      // Kick the deep link
      window.location.replace(scheme);

      // If the app isn't installed, user stays on this page.
      // Optionally, after a short delay you could auto-send to the store:
      // setTimeout(function() {
      //   var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      //   window.location.href = isIOS ? iosStore : androidStore;
      // }, 1500);
    })();
  </script>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(description)}</p>
      <p>
        <a class="btn primary" href="${schemeUrl}">Open in Kafel App</a>
        <a class="btn secondary" href="${canonicalUrl}">Open on the Web</a>
      </p>
      <p class="muted">Don’t have the app?
        <a href="${APP_STORE_URL}">App Store</a> /
        <a href="${PLAY_STORE_URL}">Google Play</a>
      </p>
    </div>
  </div>
</body>
</html>`;

    res
      .status(200)
      .set('Content-Type', 'text/html; charset=utf-8')
      .send(html);
  }
}

// Tiny helper to avoid breaking HTML with user content
function escapeHtml(input: string) {
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
