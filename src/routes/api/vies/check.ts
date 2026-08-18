import { createFileRoute } from '@tanstack/react-router'

// Vérifie un numéro de TVA intracommunautaire via l'API REST publique et
// gratuite VIES (Commission européenne). Passe par une route serveur car
// l'API VIES ne renvoie pas d'en-têtes CORS utilisables depuis le navigateur.
export const Route = createFileRoute('/api/vies/check')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => ({}))
        const countryCode =
          typeof body.countryCode === 'string' ? body.countryCode.toUpperCase() : ''
        const vatNumber =
          typeof body.vatNumber === 'string' ? body.vatNumber.replace(/\s/g, '') : ''

        if (!/^[A-Z]{2}$/.test(countryCode) || !vatNumber) {
          return new Response(
            JSON.stringify({ error: 'invalid_input' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } },
          )
        }

        try {
          const res = await fetch(
            `https://ec.europa.eu/taxation_customs/vies/rest-api/ms/${countryCode}/vat/${encodeURIComponent(vatNumber)}`,
            { method: 'GET', headers: { Accept: 'application/json' } },
          )

          if (!res.ok) {
            return new Response(
              JSON.stringify({ error: 'vies_unavailable' }),
              { status: 502, headers: { 'Content-Type': 'application/json' } },
            )
          }

          const data = await res.json()

          return new Response(
            JSON.stringify({
              valid: !!data.valid,
              name: data.name ?? null,
              address: data.address ?? null,
              countryCode: data.countryCode ?? countryCode,
              vatNumber: data.vatNumber ?? vatNumber,
              requestDate: data.requestDate ?? null,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          )
        } catch (err) {
          console.error('Erreur VIES:', err)
          return new Response(
            JSON.stringify({ error: 'vies_unavailable' }),
            { status: 502, headers: { 'Content-Type': 'application/json' } },
          )
        }
      },
    },
  },
})
