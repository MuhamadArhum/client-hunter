import { useNavigate } from 'react-router-dom';
import { Eye, Zap } from 'lucide-react';

const DESIGNS = [
  {
    id: 1,
    name: 'Dark Emerald',
    desc: 'Dark background with Tiffany green accents, split layout with branding panel',
    tags: ['Dark', 'Split Layout', 'Green'],
    preview: 'linear-gradient(135deg, #080e09 0%, #0a1a0c 50%, #071209 100%)',
    accent: '#21F6A8',
    path: '/login-v1',
  },
  {
    id: 2,
    name: 'Clean Minimal',
    desc: 'Light white background, centered card, ultra-clean and minimal design',
    tags: ['Light', 'Minimal', 'Blue'],
    preview: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    accent: '#3B82F6',
    path: '/login-v2',
  },
  {
    id: 3,
    name: 'Glassmorphism',
    desc: 'Dark purple galaxy background with frosted glass card effect',
    tags: ['Dark', 'Glass Effect', 'Purple'],
    preview: 'linear-gradient(135deg, #0f0a1e 0%, #1a0a2e 50%, #0d0820 100%)',
    accent: '#A855F7',
    path: '/login-v3',
  },
  {
    id: 4,
    name: 'Corporate Navy',
    desc: 'Professional navy blue split design with gold accents for enterprise feel',
    tags: ['Dark', 'Split Layout', 'Gold'],
    preview: 'linear-gradient(135deg, #0A1628 0%, #0F2044 100%)',
    accent: '#F59E0B',
    path: '/login-v4',
  },
  {
    id: 5,
    name: 'Neon Cyberpunk',
    desc: 'Pure black background with neon cyan and magenta glowing effects',
    tags: ['Dark', 'Neon', 'Futuristic'],
    preview: 'linear-gradient(135deg, #000000 0%, #050510 100%)',
    accent: '#00FFFF',
    path: '/login-v5',
  },
];

export default function LoginPreview() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(145deg, #0a0a0f 0%, #0f0f1a 100%)' }}
    >
      {/* Header */}
      <div className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: 'linear-gradient(135deg, #21F6A8, #10B981)' }}
            >
              <Zap className="h-4 w-4 text-gray-900" fill="currentColor" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Abyte Hunt</p>
              <p className="text-[10px]" style={{ color: 'rgba(148,163,184,0.4)' }}>Login Page Designer</p>
            </div>
          </div>
          <div
            className="px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: 'rgba(33,246,168,0.08)', border: '1px solid rgba(33,246,168,0.15)', color: '#21F6A8' }}
          >
            5 Designs Available
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-white mb-3">Choose Your Login Design</h1>
          <p style={{ color: 'rgba(148,163,184,0.5)' }}>
            Preview each design and select the one you like most
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DESIGNS.map((d) => (
            <div
              key={d.id}
              className="rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer group"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.border = `1px solid ${d.accent}40`;
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = `0 20px 60px ${d.accent}15`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(255,255,255,0.07)';
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
              }}
            >
              {/* Preview box */}
              <div
                className="relative h-40 flex items-center justify-center"
                style={{ background: d.preview }}
              >
                <div
                  className="px-5 py-3 rounded-xl text-xs font-semibold"
                  style={{
                    background: 'rgba(0,0,0,0.4)',
                    border: `1px solid ${d.accent}50`,
                    color: d.accent,
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  Design {d.id} — {d.name}
                </div>
                {/* Color dot */}
                <div
                  className="absolute top-3 right-3 h-3 w-3 rounded-full"
                  style={{ background: d.accent, boxShadow: `0 0 10px ${d.accent}` }}
                />
              </div>

              {/* Info */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-base font-bold text-white">{d.name}</h3>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: `${d.accent}15`, color: d.accent }}
                  >
                    #{d.id}
                  </span>
                </div>
                <p className="text-xs mb-4 leading-relaxed" style={{ color: 'rgba(148,163,184,0.5)' }}>
                  {d.desc}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {d.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        color: 'rgba(148,163,184,0.5)',
                        border: '1px solid rgba(255,255,255,0.07)',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => navigate(d.path)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={{
                    background: `${d.accent}15`,
                    border: `1px solid ${d.accent}30`,
                    color: d.accent,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = `${d.accent}25`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = `${d.accent}15`;
                  }}
                >
                  <Eye className="h-4 w-4" />
                  Preview Design
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center mt-10 text-xs" style={{ color: 'rgba(148,163,184,0.3)' }}>
          These are sample designs. Tell which one you want to use as the main login page.
        </p>
      </div>
    </div>
  );
}
