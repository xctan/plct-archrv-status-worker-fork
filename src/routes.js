import {fetchStatus} from "./subscribe";

const RouteList = [
    {
        path: '/robots.txt',
        handler: async (request, env, ctx) => {
            return new Response('User-agent: *\nDisallow: /', {
                headers: {'Content-Type': 'text/plain'},
            });
        }
    },
    {
        path: '/favicon.ico',
        handler: async (request, env, ctx) => {
            return new Response('', {
                status: 302,
                headers: {
                    'Location': 'https://riscv-notes.sh1mar.in/img/favicon.ico',
                }
            })
        }
    },
    {
        path: '/',
        handler: async (request, env, ctx) => {
            const {pkgs} = await fetchStatus();

            // check query string
            const url = new URL(request.url);
            const format = url.searchParams.get('f');
            if (format === 'json') {
                return new Response(JSON.stringify(pkgs), {
                    headers: {'Content-Type': 'application/json'},
                });
            } else {
                // not finished yet
                return new Response('Not finished yet', {
                    status: 404,
                });
            }
        }
    }
]

export {RouteList};