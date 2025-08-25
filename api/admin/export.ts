import type { VercelRequest, VercelResponse } from '@vercel/node';

const { GH_TOKEN, GH_REPO_FULLNAME, ADMIN_TOKEN } = process.env;

// --- 유틸리티 함수들 (변경 없음) ---
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 10000) {
  const c = new AbortController();
  const id = setTimeout(() => c.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: c.signal });
  } finally {
    clearTimeout(id);
  }
}

function pickLabel(labels: any[] = [], prefix: string) {
  const hit = labels.find((l: any) => typeof l?.name === 'string' && l.name.startsWith(prefix));
  return hit ? String(hit.name).slice(prefix.length) : '';
}

function toKST(isoString: string) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(date.getTime() + kstOffset);
  return kstDate.toISOString().replace('T', ' ').slice(0, 19);
}

function parsePayloadFromBody(body?: string) {
  if (!body) return {};
  const match = body.match(/```json\n([\s\S]*?)\n```/);
  if (match && match[1]) {
    try {
      return JSON.parse(match[1]);
    } catch { return {}; }
  }
  return {};
}

function toCSV(rows: string[][]) {
  const BOM = '\uFEFF';
  const esc = (v: any) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return BOM + rows.map(r => r.map(esc).join(',')).join('\n');
}

// --- 메인 핸들러 ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = req.query.token as string;
  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  const format = String(req.query.format || 'json').toLowerCase();
  const wantDownload = ['1', 'true'].includes(String(req.query.download || '').toLowerCase());

  try {
    const apiUrl = `https://api.github.com/repos/${GH_REPO_FULLNAME}/issues?state=all&per_page=100&sort=created&direction=desc`;
    const gh = await fetchWithTimeout(apiUrl, {
      headers: { 'Authorization': `Bearer ${GH_TOKEN}`, 'Accept': 'application/vnd.github+json' },
    });

    if (!gh.ok) {
      return res.status(gh.status).json({ ok: false, error: 'GitHub API Error' });
    }

    const issues = (await gh.json()) as any[];

    const items = issues.map(it => {
      const payload = parsePayloadFromBody(it.body) as any;
      const site = pickLabel(it.labels, 'site:') || payload.site || 'N/A';
      const type = pickLabel(it.labels, 'type:') || payload.type;
      
      const birthOrRrn = payload.rrnFull 
        ? payload.rrnFull 
        : (payload.rrnFront ? `${payload.rrnFront}-${payload.rrnBack}` : payload.birth) || '';

      return {
        site: site,
        requested_at: toKST(payload.requestedAt || it.created_at),
        request_type: type === 'online' ? '온라인분석' : '전화상담',
        // 가입자 정보
        name: payload.name || '',
        birth_or_rrn: birthOrRrn,
        gender: payload.gender || '',
        phone: payload.phone || '',
        
        // 반려동물 정보
        pet_breed: payload.petBreed || '',
        pet_name: payload.petName || '',
        pet_gender: payload.petGender || '',
        pet_birth_date: payload.petBirthDate || '',
        pet_reg_number: payload.petRegNumber || '',
        pet_neutered: payload.petNeutered || '',
      };
    });

    if (format === 'csv') {
      // ✨ 엑셀 헤더에 모든 항목 추가
      const header = [
        'site', 'requested_at', 'request_type', 
        'name', 'birth_or_rrn', 'gender', 'phone', 
        'pet_breed', 'pet_name', 'pet_gender', 'pet_birth_date', 'pet_reg_number', 'pet_neutered'
      ];
      const rows = [header, ...items.map(r => [
        r.site, r.requested_at, r.request_type, 
        r.name, r.birth_or_rrn, r.gender, r.phone,
        // ✨ 엑셀 행에 모든 데이터 추가
        r.pet_breed, r.pet_name, r.pet_gender, r.pet_birth_date, r.pet_reg_number, r.pet_neutered,
      ])];
      const csv = toCSV(rows);
      const filename = `leads-${new Date().toISOString().slice(0, 10)}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      if (wantDownload) {
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      }
      return res.status(200).send(csv);
    }

    return res.status(200).json({ ok: true, count: items.length, items });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: 'Internal Server Error', detail: err?.message });
  }
}