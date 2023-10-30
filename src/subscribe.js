import * as cheerio from 'cheerio';

const FetchUA='ArchRVStatusObserver PLCT::ArchRV.StatusWorker';

const PackageInfo = name => {
    return {
        name,
        base: null,
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

            const re = /Leaf package|Changes/;
            const re_paren = /[()]/g;
            const re_dep = /Dependency '(.*)' not satisfied\./;
            const re_base = /.* \((.*)\)/;

            for (const row of $('tr')) {
                const cells = $(row).find('td');
                const pkg_name = $(cells[1]).text();

                if (!pkg_name) {
                    continue;
                }

                pkgs[pkg_name] = pkgs[pkg_name] || PackageInfo(pkg_name);

                let base = $(cells[1]).text().match(re_base);
                if (base) {
                    pkgs[pkg_name].base = base[1];
                }

                if ($(cells[2]).text().search(re) !== -1) {
                    pkgs[pkg_name].felix = 'leaf';
                } else {
                    pkgs[pkg_name].felix = 'dir';
                }
                let dep = $(cells[2]).text().match(re_dep);
                if (dep) {
                    pkgs[pkg_name].felix = 'dep';
                    pkgs[pkg_name].mark.push({
                        name: 'missing_dep',
                        by: { alias: 'null (felix)', },
                        comment: dep[1],
                    });
                }

                let triage = $(cells[2]).find('span.badge.bg-danger');
                if (triage.length > 0) {
                    let reason = triage
                        .text()
                        .trim()
                        .replaceAll(re_paren, '')
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
        url: 'https://plct-arv.jiejiss.com/pkg',
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

const dispatchRequests = () => {
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

    return requests;
}

const fetchStatus = async () => {
    let requests = dispatchRequests();

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

const fetchRawStatus = async () => {
    let requests = dispatchRequests();

    let source = {};
    let durations = {};
    for (const [name, request] of Object.entries(requests)) {
        const {resp, duration} = await request;
        if (!resp.ok) {
            throw new Error(`Failed to fetch ${name}: ${resp.status} ${resp.statusText}`);
        }
        source[name] = await resp.text();
        durations[name] = duration;
    }

    return {
        source,
        durations,
    }
}

export {fetchStatus, fetchRawStatus};
