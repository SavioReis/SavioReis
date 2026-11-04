// Gera os cartoes do perfil (estatisticas, linguagens e projeto AE:MP) como SVG,
// sem depender de site externo. Roda no GitHub Actions com o GITHUB_TOKEN.
//   node cartoes.mjs <usuario> <pasta-de-saida> [repo-destaque]
// Sem GITHUB_TOKEN usa dados de exemplo (para testar o desenho).
import fs from 'node:fs';
import path from 'node:path';

const [, , USUARIO = 'SavioReis', SAIDA = 'dist', DESTAQUE = 'AE-MP'] = process.argv;
const TOKEN = process.env.GITHUB_TOKEN;

const C = { fundo: '#1a1b27', borda: '#2a2e45', titulo: '#33F7F7', texto: '#c0caf5', fraco: '#7a83a8', icone: '#33F7F7' };
const FONTE = "'Segoe UI', Ubuntu, 'Helvetica Neue', Sans-Serif";

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const num = (n) => (n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace('.', ',') + ' mil' : String(n));

async function buscar() {
    if (!TOKEN) return exemplo();
    const query = `query($login: String!, $repo: String!) {
      user(login: $login) {
        name login
        followers { totalCount }
        pullRequests { totalCount }
        issues { totalCount }
        contributionsCollection {
          totalCommitContributions restrictedContributionsCount
          contributionCalendar { totalContributions }
        }
        repositories(first: 100, ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC) {
          totalCount
          nodes {
            stargazerCount
            languages(first: 10, orderBy: {field: SIZE, direction: DESC}) { edges { size node { name color } } }
          }
        }
        repository(name: $repo) {
          name description url stargazerCount forkCount
          primaryLanguage { name color }
          releases(first: 1, orderBy: {field: CREATED_AT, direction: DESC}) { nodes { tagName } }
        }
      }
    }`;
    const r = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: { Authorization: `bearer ${TOKEN}`, 'Content-Type': 'application/json', 'User-Agent': 'cartoes-perfil' },
        body: JSON.stringify({ query, variables: { login: USUARIO, repo: DESTAQUE } }),
    });
    const j = await r.json();
    if (!r.ok || j.errors) throw new Error('GitHub: ' + JSON.stringify(j.errors || j).slice(0, 500));
    return j.data.user;
}

function exemplo() {
    return {
        name: 'Sávio Reis', login: USUARIO,
        followers: { totalCount: 12 }, pullRequests: { totalCount: 8 }, issues: { totalCount: 5 },
        contributionsCollection: { totalCommitContributions: 342, restrictedContributionsCount: 120, contributionCalendar: { totalContributions: 471 } },
        repositories: {
            totalCount: 14,
            nodes: [
                { stargazerCount: 3, languages: { edges: [{ size: 900000, node: { name: 'C++', color: '#f34b7d' } }, { size: 120000, node: { name: 'Pawn', color: '#dbb284' } }] } },
                { stargazerCount: 1, languages: { edges: [{ size: 300000, node: { name: 'PHP', color: '#4F5D95' } }, { size: 90000, node: { name: 'JavaScript', color: '#f1e05a' } }] } },
                { stargazerCount: 0, languages: { edges: [{ size: 80000, node: { name: 'HTML', color: '#e34c26' } }, { size: 40000, node: { name: 'CSS', color: '#563d7c' } }, { size: 20000, node: { name: 'Lua', color: '#000080' } }] } },
            ],
        },
        repository: {
            name: 'AE-MP', url: 'https://github.com/SavioReis/AE-MP',
            description: 'Multiplayer de GTA San Andreas feito do zero, compatível com gamemodes Pawn do SA-MP.',
            stargazerCount: 3, forkCount: 0, primaryLanguage: { name: 'C++', color: '#f34b7d' }, releases: { nodes: [{ tagName: 'v1.0.0' }] },
        },
    };
}

const moldura = (w, h, corpo) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" role="img">
<style>
  .t { font: 600 18px ${FONTE}; fill: ${C.titulo}; }
  .l { font: 400 14px ${FONTE}; fill: ${C.texto}; }
  .v { font: 700 14px ${FONTE}; fill: ${C.texto}; }
  .f { font: 400 12px ${FONTE}; fill: ${C.fraco}; }
  .s { animation: entra .6s ease-out forwards; opacity: 0; }
  @keyframes entra { to { opacity: 1; } }
</style>
<rect x="0.5" y="0.5" rx="10" width="${w - 1}" height="${h - 1}" fill="${C.fundo}" stroke="${C.borda}"/>
${corpo}
</svg>
`;

// Icones simples (caminhos 16x16 do Octicons, licenca MIT)
const ICONES = {
    estrela: 'M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z',
    commit: 'M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.75a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z',
    pr: 'M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354Z',
    issue: 'M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z',
    repo: 'M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z',
    pessoas: 'M2 5.5a3.5 3.5 0 1 1 5.898 2.549 5.508 5.508 0 0 1 3.034 4.084.75.75 0 1 1-1.482.235 4 4 0 0 0-7.9 0 .75.75 0 0 1-1.482-.236A5.507 5.507 0 0 1 3.102 8.05 3.493 3.493 0 0 1 2 5.5ZM11 4a3.001 3.001 0 0 1 2.22 5.018 5.01 5.01 0 0 1 2.56 3.012.749.749 0 0 1-.885.954.752.752 0 0 1-.549-.514 3.507 3.507 0 0 0-2.522-2.372.75.75 0 0 1-.574-.73v-.352a.75.75 0 0 1 .416-.672A1.5 1.5 0 0 0 11 5.5.75.75 0 0 1 11 4Zm-5.5-.5a2 2 0 1 0-.001 3.999A2 2 0 0 0 5.5 3.5Z',
    garfo: 'M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z',
    tag: 'M1 7.775V2.75C1 1.784 1.784 1 2.75 1h5.025c.464 0 .91.184 1.238.513l6.25 6.25a1.75 1.75 0 0 1 0 2.474l-5.026 5.026a1.75 1.75 0 0 1-2.474 0l-6.25-6.25A1.752 1.752 0 0 1 1 7.775Zm1.5 0c0 .066.026.13.073.177l6.25 6.25a.25.25 0 0 0 .354 0l5.025-5.025a.25.25 0 0 0 0-.354l-6.25-6.25a.25.25 0 0 0-.177-.073H2.75a.25.25 0 0 0-.25.25ZM6 5a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z',
};
const icone = (nome, x, y, cor = C.icone) => `<path transform="translate(${x} ${y})" fill="${cor}" d="${ICONES[nome]}"/>`;

function cartaoEstatisticas(u) {
    const cc = u.contributionsCollection;
    const estrelas = u.repositories.nodes.reduce((s, r) => s + r.stargazerCount, 0);
    const linhas = [
        ['estrela', 'Estrelas recebidas', estrelas],
        ['commit', 'Commits neste ano', cc.totalCommitContributions + cc.restrictedContributionsCount],
        ['pr', 'Pull requests', u.pullRequests.totalCount],
        ['issue', 'Issues', u.issues.totalCount],
        ['repo', 'Repositórios públicos', u.repositories.totalCount],
        ['pessoas', 'Seguidores', u.followers.totalCount],
    ];
    const corpo = linhas
        .map(([ic, rot, v], i) => {
            const y = 62 + i * 24;
            return `<g class="s" style="animation-delay:${150 + i * 120}ms">${icone(ic, 25, y - 12)}<text class="l" x="50" y="${y}">${esc(rot)}:</text><text class="v" x="245" y="${y}">${esc(num(v))}</text></g>`;
        })
        .join('\n');
    const total = cc.contributionCalendar.totalContributions;
    const anel = `<g transform="translate(360 95)">
  <circle r="42" stroke="${C.borda}" stroke-width="7"/>
  <circle r="42" stroke="${C.titulo}" stroke-width="7" stroke-linecap="round" stroke-dasharray="264" stroke-dashoffset="${264 - Math.min(264, (total / 1000) * 264)}" transform="rotate(-90)"/>
  <text class="t" text-anchor="middle" y="7">${esc(num(total))}</text>
  <text class="f" text-anchor="middle" y="66">contribuições no ano</text>
</g>`;
    return moldura(450, 205, `<text class="t" x="25" y="34">Estatísticas de ${esc(u.name || u.login)}</text>\n${corpo}\n${anel}`);
}

function cartaoLinguagens(u) {
    const tot = new Map();
    for (const r of u.repositories.nodes)
        for (const e of r.languages.edges) {
            const a = tot.get(e.node.name) || { tam: 0, cor: e.node.color || '#888' };
            a.tam += e.size;
            tot.set(e.node.name, a);
        }
    const lista = [...tot.entries()].sort((a, b) => b[1].tam - a[1].tam).slice(0, 8);
    const soma = lista.reduce((s, [, v]) => s + v.tam, 0) || 1;
    const W = 300;
    let x = 0;
    const barra = lista
        .map(([, v]) => {
            const w = (v.tam / soma) * W;
            const r = `<rect x="${(25 + x).toFixed(2)}" y="50" width="${w.toFixed(2)}" height="10" fill="${v.cor}"/>`;
            x += w;
            return r;
        })
        .join('');
    const itens = lista
        .map(([nome, v], i) => {
            const col = i % 2, lin = Math.floor(i / 2);
            const px = 25 + col * 150, py = 88 + lin * 24;
            return `<g class="s" style="animation-delay:${200 + i * 100}ms"><circle cx="${px + 5}" cy="${py - 4}" r="5" fill="${v.cor}"/><text class="l" x="${px + 16}" y="${py}">${esc(nome)} <tspan class="f">${((v.tam / soma) * 100).toFixed(1).replace('.', ',')}%</tspan></text></g>`;
        })
        .join('\n');
    const h = 88 + Math.ceil(lista.length / 2) * 24;
    return moldura(350, Math.max(h, 205), `<text class="t" x="25" y="34">Linguagens mais usadas</text>
<clipPath id="cb"><rect x="25" y="50" width="${W}" height="10" rx="5"/></clipPath>
<g clip-path="url(#cb)">${barra || `<rect x="25" y="50" width="${W}" height="10" fill="${C.borda}"/>`}</g>
${itens}`);
}

// Quebra a descricao em linhas de ate n caracteres
function quebrar(texto, n, max) {
    const out = [];
    let linha = '';
    for (const p of String(texto || '').split(/\s+/)) {
        if ((linha + ' ' + p).trim().length > n) {
            out.push(linha.trim());
            linha = p;
        } else linha += ' ' + p;
    }
    if (linha.trim()) out.push(linha.trim());
    if (out.length > max) {
        out.length = max;
        out[max - 1] = out[max - 1].replace(/\s*\S*$/, '') + '…';
    }
    return out;
}

function cartaoProjeto(u) {
    const r = u.repository;
    if (!r) return null;
    const desc = quebrar(r.description || 'Multiplayer de GTA San Andreas feito do zero.', 52, 2)
        .map((l, i) => `<text class="l" x="25" y="${72 + i * 20}">${esc(l)}</text>`)
        .join('');
    const tag = r.releases?.nodes?.[0]?.tagName;
    const lang = r.primaryLanguage;
    let x = 25;
    const rodape = [];
    if (lang) {
        rodape.push(`<circle cx="${x + 6}" cy="128" r="6" fill="${lang.color || '#888'}"/><text class="f" x="${x + 17}" y="132">${esc(lang.name)}</text>`);
        x += 30 + lang.name.length * 7;
    }
    if (tag) {
        rodape.push(`${icone('tag', x, 120, C.fraco)}<text class="f" x="${x + 21}" y="132">${esc(tag)}</text>`);
        x += 35 + tag.length * 7;
    }
    rodape.push(`${icone('estrela', x, 120, C.fraco)}<text class="f" x="${x + 21}" y="132">${r.stargazerCount}</text>`);
    x += 45;
    rodape.push(`${icone('garfo', x, 120, C.fraco)}<text class="f" x="${x + 21}" y="132">${r.forkCount}</text>`);
    return moldura(400, 150, `${icone('repo', 25, 22)}<text class="t" x="50" y="35">${esc(r.name)}</text>
${desc}
${rodape.join('\n')}`);
}

const u = await buscar();
fs.mkdirSync(SAIDA, { recursive: true });
const gravar = (nome, svg) => {
    if (!svg) return;
    fs.writeFileSync(path.join(SAIDA, nome), svg);
    console.log('gerado', nome);
};
gravar('estatisticas.svg', cartaoEstatisticas(u));
gravar('linguagens.svg', cartaoLinguagens(u));
gravar(`projeto-${DESTAQUE.toLowerCase()}.svg`, cartaoProjeto(u));
if (!u.repository) console.warn(`Aviso: repositorio ${DESTAQUE} nao encontrado (publico?)`);
