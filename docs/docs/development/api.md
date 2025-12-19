# API

Every frontend-available data and more is accessible through the API. Simply create your API key in your profile, and then add it as a
header when querying the API.

The API is available at `/api/`. You can do an unauthenticated request at `/api/ping` that replies a simple string, and an authenticated
request at `/api/` that gets the version.

Unauthenticated `GET` request to `/api/ping`:

```bash
curl https://your-red-kite-url/api/ping
```

## API Key

Generate your API key in your profile page, giving it a meaningful name and an expiration date. Then, use it as a header in your following
requests.

Authenticated `GET` request to `/api/`:

```bash
export MY_KEY="my key value"
curl -H "x-api-key: $MY_KEY" https://your-red-kite-url/api/
```
