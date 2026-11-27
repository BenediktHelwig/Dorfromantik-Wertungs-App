// Zugriff auf die gespeicherten Kampagnen (nur Rohdaten). Fehler werden zu deutschen Meldungen.

/** @param {{ apiUrl: string, token: () => string }} config */
export function createApi({ apiUrl, token }) {
  async function request(url, method = 'GET', body) {
    let response;
    try {
      response = await fetch(url, {
        method,
        credentials: 'same-origin',
        redirect: 'manual',
        headers: {
          requesttoken: token(),
          Accept: 'application/json',
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new Error('Keine Verbindung zur Nextcloud. Bitte prüft WLAN oder VPN und versucht es erneut.');
    }
    if (response.type === 'opaqueredirect' || response.status === 401 || response.status === 412) {
      throw new Error('Die Anmeldung ist abgelaufen. Bitte ladet die Seite neu.');
    }
    const answer = await response.json().catch(() => null);
    if (!response.ok || answer === null) {
      throw Object.assign(new Error(answer?.message ?? `Fehler der Nextcloud (${response.status})`), { status: response.status });
    }
    return answer;
  }

  const urlOf = (id) => `${apiUrl}/${encodeURIComponent(id)}`;

  return {
    list: () => request(apiUrl),
    save: (campaign) => request(urlOf(campaign.id), 'PUT', campaign),
    async remove(id) {
      try {
        await request(urlOf(id), 'DELETE');
      } catch (error) {
        if (error.status !== 404) throw error; // schon gelöscht ist auch gelöscht
      }
    },
  };
}
