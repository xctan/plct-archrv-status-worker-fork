import * as cheerio from 'cheerio';

const FetchUA='ArchRVStatusObserver PLCT::ArchRV.StatusWorker';

const PackageInfo = name => {
    return {
        name,
        felix: '', // 'dir' for problematic packages, and 'leaf' for normal packages
        user: null, // user who owns this package
        work: {
            kind: '',
            pr: null,
        },
        mark: [],
    }
}

const queries = {
    'FelixStatus': {
        url: 'https://archriscv.felixc.at/.status/status.htm',
        init: {
            method: 'GET',
            headers: { 'User-Agent': FetchUA },
        },
        parser: async (pkgs, resp) => {
            const $ = cheerio.load(await resp.text());
            for (const row of $('tr')) {
                const cells = $(row).find('td');
                const pkg_name = $(cells[1]).text();

                if (!pkg_name) {
                    continue;
                }

                pkgs[pkg_name] = pkgs[pkg_name] || PackageInfo(pkg_name);

                if ($(cells[2]).text().search('FTBFS') !== -1) {
                    pkgs[pkg_name].felix = 'dir';
                } else {
                    pkgs[pkg_name].felix = 'leaf';
                }

                let triage = $(cells[2]).find('span.badge.bg-danger');
                if (triage.length > 0) {
                    let reason = triage
                        .text()
                        .trim()
                        .replaceAll(/[()]/g, '')
                        .replaceAll(' ', '-')
                        .toLowerCase();
                    pkgs[pkg_name].mark.push(`triage-${reason}`);
                }

                let legacy = $(cells[2]).find('span.badge.bg-warning');
                if (legacy.length > 0) {
                    pkgs[pkg_name].mark.push('legacy');
                }

                let patched = $(cells[2]).find('span.badge.bg-secondary');
                if (patched.length > 0) {
                    pkgs[pkg_name].mark.push('patched');
                }
            }

            return pkgs;
        }
    },
    'MelonBot': {
        url: 'https://plct-arv.de2670dd.top/pkg',
        init: {
            method: 'GET',
            headers: {'User-Agent': FetchUA},
        },
        parser: async (pkgs, resp) => {
            const data = await resp.json();
            for (const work of data.workList) {
                for (const pkg_name of work.packages) {
                    pkgs[pkg_name] = pkgs[pkg_name] || PackageInfo(pkg_name);
                    pkgs[pkg_name].work.kind = 'add';
                    pkgs[pkg_name].user = work.alias;
                }
            }
            for (const pkg of data.markList) {
                if (pkg.marks.length === 0) {
                    continue;
                }
                pkgs[pkg.name] = pkgs[pkg.name] || PackageInfo(pkg.name);
                pkgs[pkg.name].mark.push(...pkg.marks);
            }
            return pkgs;
        }
    }
}

const fetchStatus = async () => {
    const start = Date.now();
    let requests = {};
    for (const [name, query] of Object.entries(queries)) {
        requests[name] = fetch(query.url, query.init)
            .then(resp => {
                return {
                    resp,
                    duration: Date.now() - start,
                }
            });
    }

    let pkgs = {};
    let durations = {};
    for (const [name, request] of Object.entries(requests)) {
        const {resp, duration} = await request;
        if (!resp.ok) {
            throw new Error(`Failed to fetch ${name}: ${resp.status} ${resp.statusText}`);
        }
        pkgs = await queries[name].parser(pkgs, resp);
        durations[name] = duration;
    }

    return {
        pkgs,
        durations,
    }
}

export {fetchStatus};
