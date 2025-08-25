import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { runtime: 'nodejs' };

type SubmitBody = {
  type: 'phone' | 'online';
  site?: string;
  // 가입자 정보
  name?: string;
  phone?: string;
  gender?: '남' | '여';
  birth?: string;
  rrnFront?: string;
  rrnBack?: string;
  
  // 반려동물 정보
  petBreed?: string;
  petName?: string;
  petGender?: string;
  petBirthDate?: string;
  petRegNumber?: string;
  petNeutered?: string;
};

const { GH_TOKEN, GH_REPO_FULLNAME } = process.env;

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 8000) {
  const c = new AbortController();
  const id = setTimeout(() => c.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: c.signal });
  } finally {
    clearTimeout(id);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'POST only' });
  }

  const body = req.body as SubmitBody;
  const {
    type,
    site = 'unknown',
    name = '',
    phone = '',
    petName,
  } = body;


  if (!type || (type !== 'phone' && type !== 'online')) {
    return res.status(400).json({ ok: false, error: 'Invalid type' });
  }

  const requestKo = type === 'phone' ? '전화' : '온라인';
  // ✨ 제목 생성 로직 수정: 가입자이름(펫이름)
  const title = `[${requestKo}] ${name}(${petName || '펫이름 미입력'}) / ${site}`;
  
  const labels = [`type:${type}`, `site:${site}`];

  // ✨ body에 있는 모든 정보를 그대로 payload로 사용
  const payload = { ...body, requestedAt: new Date().toISOString() };
  delete (payload as any).headers; // 불필요한 헤더 정보 제거

  const bodyMd = '```json\n' + JSON.stringify(payload, null, 2) + '\n```';

  try {
    const resp = await fetchWithTimeout(`https://api.github.com/repos/${GH_REPO_FULLNAME}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GH_TOKEN}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({ title, body: bodyMd, labels }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return res.status(500).json({ ok: false, error: 'GitHub error', detail: text });
    }

    const issue = await resp.json();
    return res.status(200).json({ ok: true, number: issue.number });
  } catch (e: any) {
    if (e?.name === 'AbortError') return res.status(504).json({ ok: false, error: 'Gateway Timeout from GitHub API' });
    return res.status(500).json({ ok: false, error: 'Internal Server Error', detail: e?.message || String(e) });
  }
}