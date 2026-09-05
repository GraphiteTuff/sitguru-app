import { router, type Href } from 'expo-router';

type RouteTarget = {
  pathname: string;
  params?: Record<string, string>;
};

function cleanPath(pathname: string) {
  return pathname.replace(/^\/+/, '').replace(/\/+$/, '');
}

function firstQuery(url: URL, keys: string[]) {
  for (const key of keys) {
    const value = url.searchParams.get(key)?.trim();
    if (value) return value;
  }
  return '';
}

/**
 * Maps SitGuru web, /mobile, and sitgurumobile:// URLs onto native screens.
 */
export function routeFromSitGuruUrl(rawUrl: string): RouteTarget | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, '').toLowerCase();
  const isSitGuru =
    url.protocol === 'sitgurumobile:' ||
    host === 'sitguru.com' ||
    host.endsWith('.sitguru.com') ||
    host === 'localhost';

  if (!isSitGuru) return null;

  let path = cleanPath(url.pathname);
  if (path.startsWith('mobile/')) path = path.slice('mobile/'.length);

  const zip = firstQuery(url, ['zip', 'zipcode']);
  const service = firstQuery(url, ['service', 'serviceType']);
  const slug = firstQuery(url, ['slug', 'guruSlug']);

  if (!path || path === 'search' || path === 'find-care' || path === 'explore') {
    const chat = firstQuery(url, ['chat', 'companion', 'id']).toLowerCase();
    if (
      chat === 'delilah' ||
      chat === 'rogue' ||
      chat === 'scout' ||
      chat === 'taco'
    ) {
      return {
        pathname: '/ai-companion',
        params: { id: chat },
      };
    }
    return {
      pathname: '/find-care',
      params: {
        ...(zip ? { zip } : {}),
        ...(service ? { service } : {}),
      },
    };
  }

  if (path.startsWith('guru/')) {
    return {
      pathname: '/guru-profile',
      params: { slug: path.slice('guru/'.length) },
    };
  }

  if (path.startsWith('book/')) {
    return {
      pathname: '/request-booking',
      params: { guruSlug: path.slice('book/'.length) },
    };
  }

  if (path === 'messages' || path === 'inbox') {
    return { pathname: '/messages' };
  }

  if (path === 'conversation' || path.startsWith('conversation/')) {
    const conversationId =
      path.split('/')[1] || firstQuery(url, ['conversationId', 'id']);
    return {
      pathname: '/conversation',
      params: conversationId ? { conversationId } : undefined,
    };
  }

  if (path === 'bookings' || path === 'requests') {
    return { pathname: '/bookings' };
  }

  if (path === 'payments' || path === 'checkout') {
    const bookingId = firstQuery(url, ['bookingId', 'booking']);
    return {
      pathname: '/payments',
      params: bookingId ? { bookingId } : undefined,
    };
  }

  if (path === 'rogue' || path === 'ai-companion' || path.startsWith('ai/')) {
    const companion =
      firstQuery(url, ['id', 'companion', 'chat']) ||
      (path.startsWith('ai/') ? path.split('/')[1] : '') ||
      'rogue';
    return {
      pathname: '/ai-companion',
      params: { id: companion },
    };
  }

  if (
    path === 'events' ||
    path === 'community' ||
    path.startsWith('events/') ||
    path.startsWith('community/')
  ) {
    const chat = firstQuery(url, ['chat', 'companion', 'id']).toLowerCase();
    if (
      chat === 'delilah' ||
      chat === 'rogue' ||
      chat === 'scout' ||
      chat === 'taco'
    ) {
      return {
        pathname: '/ai-companion',
        params: { id: chat },
      };
    }

    const segments = path.split('/');
    const leaf = segments[1] || '';
    if (leaf === 'host') {
      return { pathname: '/community-host' };
    }
    if (leaf && leaf !== 'host') {
      return {
        pathname: '/community-event-detail',
        params: { slug: leaf },
      };
    }
    return { pathname: '/community-events' };
  }

  if (path === 'intern' || path.startsWith('intern/') || path === 'admin/internship' || path.startsWith('admin/internship')) {
    return { pathname: '/intern-portal' };
  }

  if (path === 'account' || path === 'settings') {
    return { pathname: '/account' };
  }

  if (slug) {
    return { pathname: '/guru-profile', params: { slug } };
  }

  return null;
}

export function shouldRemapSitGuruUrl(rawUrl: string) {
  const target = routeFromSitGuruUrl(rawUrl);
  if (!target) return false;

  try {
    const url = new URL(rawUrl);
    if (url.protocol === 'sitgurumobile:') {
      let path = cleanPath(url.pathname);
      if (path.startsWith('mobile/')) path = path.slice('mobile/'.length);
      const incoming = `/${path}`;
      if (!path || incoming === target.pathname) return false;
    }
  } catch {
    return false;
  }

  return true;
}

export function openSitGuruDeepLink(rawUrl: string) {
  const target = routeFromSitGuruUrl(rawUrl);
  if (!target) return false;

  router.push({
    pathname: target.pathname,
    params: target.params,
  } as Href);

  return true;
}
